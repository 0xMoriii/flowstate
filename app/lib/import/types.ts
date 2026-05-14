export type ParsedTrade = {
  id: string;
  instrument: string;
  entryTime: number;
  exitTime: number;
  entryPrice?: number;
  exitPrice?: number;
  isLong?: boolean;
  pnl: number;
  capitalAfter?: number;
  tags: string[];
  modelTag?: string | null;
  lotSize?: number;
  notes: string;
  strength: number;
  modelAdherence: number;
};

export type CsvData = { headers: string[]; rows: string[][] };

export type ParseContext = {
  /** Tag applied to every imported trade (e.g. broker name). */
  tag: string;
  /** Optional deterministic seed for trade ids. Defaults to Date.now(). */
  now?: number;
};

export type BrokerParser = {
  id: string;
  label: string;
  /** Preferred delimiter if known. Universal parser may auto-detect. */
  delimiter?: string;
  /** Help text shown in the import UI. */
  description?: string;
  parse(csv: CsvData, ctx: ParseContext): ParsedTrade[];
};

/**
 * Universal/mapping types
 */
export type TradeField =
  | "instrument"
  | "entryTime"
  | "exitTime"
  | "entryPrice"
  | "exitPrice"
  | "pnl"
  | "lotSize"
  | "side"
  | "notes";

export type ImportMapping = {
  /** Map from Trade field -> CSV column index (or -1 if unmapped). */
  fields: Partial<Record<TradeField, number>>;
  delimiter: string;
};

export type FieldConfidence = Partial<Record<TradeField, number>>;

export type AutoDetectResult = {
  mapping: ImportMapping;
  confidence: FieldConfidence;
  /** True if all required fields were detected with high confidence. */
  ready: boolean;
  /** Required fields missing or low-confidence. */
  missing: TradeField[];
};

export type ImportTemplate = {
  id: string;
  name: string;
  /** Stable hash of the CSV header row so we can re-suggest the template. */
  fingerprint: string;
  mapping: ImportMapping;
  createdAt: number;
};

export const REQUIRED_FIELDS: TradeField[] = ["instrument", "entryTime", "exitTime", "pnl"];
