import type {
  AutoDetectResult,
  BrokerParser,
  CsvData,
  FieldConfidence,
  ImportMapping,
  ParsedTrade,
  ParseContext,
  TradeField,
} from "../types";
import { REQUIRED_FIELDS } from "../types";

/** Aliases per Trade field. Lowercase exact-or-substring matched against header text. */
const ALIASES: Record<TradeField, string[]> = {
  instrument: ["symbol", "ticker", "instrument", "contract", "asset", "security"],
  entryTime: [
    "entry time",
    "entry date",
    "open time",
    "open date",
    "bought timestamp",
    "boughttimestamp",
    "buy time",
    "opened",
    "entry",
    "date opened",
  ],
  exitTime: [
    "exit time",
    "exit date",
    "close time",
    "close date",
    "sold timestamp",
    "soldtimestamp",
    "sell time",
    "closed",
    "exit",
    "date closed",
  ],
  entryPrice: ["entry price", "open price", "buy price", "buyprice", "avg entry", "fill price entry"],
  exitPrice: ["exit price", "close price", "sell price", "sellprice", "avg exit", "fill price exit"],
  pnl: ["pnl", "p/l", "p&l", "net p/l", "net pnl", "profit", "profit/loss", "realized pnl", "net profit", "gain"],
  lotSize: ["quantity", "qty", "size", "contracts", "position size", "positionsize", "shares", "volume"],
  side: ["side", "direction", "buy/sell", "long/short", "action", "type"],
  notes: ["notes", "note", "comment", "comments", "memo", "tags"],
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[i - 1], dp[i]) + 1;
      prev = tmp;
    }
  }
  return dp[a.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / max;
}

function scoreHeader(field: TradeField, header: string): number {
  const h = header.trim().toLowerCase();
  if (!h) return 0;
  const aliases = ALIASES[field];
  let best = 0;
  for (const alias of aliases) {
    if (h === alias) return 1;
    if (h.includes(alias) || alias.includes(h)) best = Math.max(best, 0.8);
    const sim = similarity(h, alias);
    if (sim > 0.85) best = Math.max(best, 0.75);
  }
  return best;
}

const NUMERIC_RE = /-?\$?\(?\d[\d,]*\.?\d*\)?/;
const DATE_RE = /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\d{10,13}/;

function columnLooksNumeric(rows: string[][], idx: number): boolean {
  let hits = 0;
  const sampleSize = Math.min(5, rows.length);
  for (let i = 0; i < sampleSize; i++) {
    const v = (rows[i]?.[idx] ?? "").toString().trim();
    if (NUMERIC_RE.test(v)) hits++;
  }
  return hits >= Math.ceil(sampleSize / 2);
}

function columnLooksLikeDate(rows: string[][], idx: number): boolean {
  let hits = 0;
  const sampleSize = Math.min(5, rows.length);
  for (let i = 0; i < sampleSize; i++) {
    const v = (rows[i]?.[idx] ?? "").toString().trim();
    if (DATE_RE.test(v) && !Number.isNaN(new Date(v).getTime())) hits++;
  }
  return hits >= Math.ceil(sampleSize / 2);
}

export function autoDetectMapping(csv: CsvData): AutoDetectResult {
  const { headers, rows } = csv;
  const fields: ImportMapping["fields"] = {};
  const confidence: FieldConfidence = {};
  const claimed = new Set<number>();

  const fieldOrder: TradeField[] = [
    "instrument",
    "entryTime",
    "exitTime",
    "pnl",
    "entryPrice",
    "exitPrice",
    "lotSize",
    "side",
    "notes",
  ];

  for (const field of fieldOrder) {
    let bestIdx = -1;
    let bestScore = 0;
    headers.forEach((h, i) => {
      if (claimed.has(i)) return;
      let score = scoreHeader(field, h);
      if (score <= 0) return;
      // Content sanity boost / penalty
      const numericFields: TradeField[] = ["pnl", "entryPrice", "exitPrice", "lotSize"];
      const dateFields: TradeField[] = ["entryTime", "exitTime"];
      if (numericFields.includes(field)) {
        if (columnLooksNumeric(rows, i)) score = Math.min(1, score + 0.1);
        else score *= 0.6;
      } else if (dateFields.includes(field)) {
        if (columnLooksLikeDate(rows, i)) score = Math.min(1, score + 0.1);
        else score *= 0.6;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0 && bestScore >= 0.5) {
      fields[field] = bestIdx;
      confidence[field] = bestScore;
      claimed.add(bestIdx);
    }
  }

  const missing = REQUIRED_FIELDS.filter((f) => fields[f] === undefined || (confidence[f] ?? 0) < 0.7);
  return {
    mapping: { fields, delimiter: "," },
    confidence,
    ready: missing.length === 0,
    missing,
  };
}

function parseNumberLike(raw: unknown): number {
  if (raw === null || raw === undefined) return NaN;
  const s = String(raw).trim();
  if (!s) return NaN;
  const isParenNeg = s.includes("(") && s.includes(")");
  const isLeadingMinus = /^-/.test(s);
  const cleaned = s.replace(/[^0-9.]/g, "");
  if (!cleaned) return NaN;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return isParenNeg || isLeadingMinus ? -Math.abs(n) : n;
}

function parseDateLike(raw: unknown): number {
  if (raw === null || raw === undefined) return NaN;
  const s = String(raw).replace(/"/g, "").trim();
  if (!s) return NaN;
  if (/^\d{10}$/.test(s)) return parseInt(s, 10) * 1000;
  if (/^\d{13}$/.test(s)) return parseInt(s, 10);
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function parseSide(raw: unknown): boolean | undefined {
  const s = String(raw ?? "").toUpperCase().trim();
  if (!s) return undefined;
  if (/(^|\b)(BUY|LONG|B|L)(\b|$)/.test(s)) return true;
  if (/(^|\b)(SELL|SHORT|S)(\b|$)/.test(s)) return false;
  return undefined;
}

export function parseWithMapping(csv: CsvData, mapping: ImportMapping, ctx: ParseContext): ParsedTrade[] {
  const { rows } = csv;
  const f = mapping.fields;
  const required: TradeField[] = ["instrument", "entryTime", "exitTime", "pnl"];
  for (const r of required) {
    if (f[r] === undefined || f[r]! < 0) {
      throw new Error(`Missing required column mapping for ${r}.`);
    }
  }
  const base = ctx.now ?? Date.now();
  const out: ParsedTrade[] = [];

  rows.forEach((row, i) => {
    const instrument = String(row[f.instrument!] ?? "").replace(/"/g, "").trim();
    if (!instrument) return;
    const t1 = parseDateLike(row[f.entryTime!]);
    const t2 = parseDateLike(row[f.exitTime!]);
    if (Number.isNaN(t1) || Number.isNaN(t2)) return;
    const pnl = parseNumberLike(row[f.pnl!]);
    if (Number.isNaN(pnl)) return;

    const entryPrice = f.entryPrice !== undefined ? parseNumberLike(row[f.entryPrice]) : undefined;
    const exitPrice = f.exitPrice !== undefined ? parseNumberLike(row[f.exitPrice]) : undefined;
    const lotSizeRaw = f.lotSize !== undefined ? parseNumberLike(row[f.lotSize]) : undefined;
    const lotSize = Number.isFinite(lotSizeRaw) && (lotSizeRaw as number) > 0 ? (lotSizeRaw as number) : undefined;

    let isLong: boolean | undefined;
    if (f.side !== undefined) isLong = parseSide(row[f.side]);
    if (isLong === undefined && Number.isFinite(entryPrice) && Number.isFinite(exitPrice)) {
      const dir = (exitPrice as number) - (entryPrice as number);
      isLong = dir >= 0 ? pnl >= 0 : pnl < 0;
    }
    if (isLong === undefined) isLong = t1 <= t2;

    const notes = f.notes !== undefined ? String(row[f.notes] ?? "").trim() : "";

    out.push({
      id: `csv_${base}_universal_${i}`,
      instrument,
      entryTime: Math.min(t1, t2),
      exitTime: Math.max(t1, t2),
      entryPrice: Number.isFinite(entryPrice) ? (entryPrice as number) : undefined,
      exitPrice: Number.isFinite(exitPrice) ? (exitPrice as number) : undefined,
      isLong,
      pnl,
      tags: [ctx.tag],
      modelTag: undefined,
      lotSize,
      notes,
      strength: 0,
      modelAdherence: 1,
    });
  });

  return out;
}

export const universalParser: BrokerParser = {
  id: "universal",
  label: "Auto-detect",
  description:
    "Tries to auto-detect any broker's columns. If detection is uncertain you'll be shown a quick column-mapping screen.",
  parse(csv, ctx) {
    const detected = autoDetectMapping(csv);
    if (!detected.ready) {
      const err = new Error(`AUTO_DETECT_NEEDS_MAPPING:${detected.missing.join(",")}`);
      (err as Error & { autoDetect?: AutoDetectResult }).autoDetect = detected;
      throw err;
    }
    return parseWithMapping(csv, detected.mapping, ctx);
  },
};
