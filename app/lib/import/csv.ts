import type { CsvData } from "./types";

export function parseCsvText(text: string, delimiter: string = ","): CsvData {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    if (current.length > 0) rows.push(current);
    current = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      pushField();
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (field !== "" || current.length > 0) {
        pushField();
        pushRow();
      }
      while (text[i + 1] === "\n" || text[i + 1] === "\r") i++;
    } else {
      field += ch;
    }
  }
  if (field !== "" || current.length > 0) {
    pushField();
    pushRow();
  }

  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  return { headers, rows: rows.slice(1) };
}

/**
 * Sniff the delimiter from the first non-empty line. Picks the candidate that
 * yields the most evenly distributed columns across the first few lines.
 */
export function detectDelimiter(text: string): string {
  const candidates = [",", ";", "\t", "|"];
  const sample = text.split(/\r?\n/).filter((l) => l.length > 0).slice(0, 5);
  if (!sample.length) return ",";

  let best = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const counts = sample.map((line) => {
      let n = 0;
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQ = !inQ;
        else if (c === d && !inQ) n++;
      }
      return n;
    });
    const first = counts[0];
    if (first <= 0) continue;
    const consistent = counts.every((c) => c === first);
    const score = first * (consistent ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** Stable header fingerprint for matching saved templates. */
export function headerFingerprint(headers: string[]): string {
  return headers
    .map((h) => h.trim().toLowerCase())
    .sort()
    .join("|");
}
