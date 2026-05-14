"use client";

import { useMemo, useState } from "react";
import type { CsvData, FieldConfidence, ImportMapping, TradeField } from "../lib/import/types";
import { REQUIRED_FIELDS } from "../lib/import/types";

const FIELD_LABELS: Record<TradeField, string> = {
  instrument: "Instrument / Symbol",
  entryTime: "Entry time / date",
  exitTime: "Exit time / date",
  entryPrice: "Entry price",
  exitPrice: "Exit price",
  pnl: "PnL / Profit",
  lotSize: "Quantity / Size",
  side: "Side (Buy/Sell)",
  notes: "Notes",
};

const ALL_FIELDS: TradeField[] = [
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

export type ImportMappingModalProps = {
  csv: CsvData;
  initialMapping: ImportMapping;
  confidence?: FieldConfidence;
  missing?: TradeField[];
  onCancel: () => void;
  onConfirm: (mapping: ImportMapping, saveAs?: string) => void;
};

export default function ImportMappingModal({
  csv,
  initialMapping,
  confidence,
  missing,
  onCancel,
  onConfirm,
}: ImportMappingModalProps) {
  const [fields, setFields] = useState<ImportMapping["fields"]>({ ...initialMapping.fields });
  const [templateName, setTemplateName] = useState("");
  const [saveTemplate, setSaveTemplate] = useState(false);

  const sampleRow = csv.rows[0] ?? [];
  const requiredOk = useMemo(
    () => REQUIRED_FIELDS.every((f) => fields[f] !== undefined && fields[f]! >= 0),
    [fields]
  );

  const setField = (field: TradeField, idx: number) => {
    setFields((prev) => ({ ...prev, [field]: idx }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#27272a] border border-white/60 dark:border-[#3f3f46] shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-[#2e2e2e] dark:text-[#fafafa]">Map CSV columns</h3>
            <p className="text-sm text-gray-500 dark:text-[#a1a1aa] mt-1">
              {missing && missing.length
                ? `We couldn't confidently detect: ${missing.join(", ")}. Pick the right column for each field below.`
                : "Confirm the detected columns or adjust as needed."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-[#2e2e2e] dark:hover:text-[#fafafa] text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {ALL_FIELDS.map((field) => {
            const isRequired = REQUIRED_FIELDS.includes(field);
            const selected = fields[field] ?? -1;
            const sample = selected >= 0 ? sampleRow[selected] : "";
            const conf = confidence?.[field];
            return (
              <div key={field} className="flex items-center gap-3">
                <label className="w-44 shrink-0 text-sm font-medium text-[#2e2e2e] dark:text-[#e5e7eb]">
                  {FIELD_LABELS[field]}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={selected}
                  onChange={(e) => setField(field, parseInt(e.target.value, 10))}
                  className="flex-1 rounded-lg border border-white/60 dark:border-[#3f3f46] bg-white/70 dark:bg-[#3f3f46] px-3 py-2 text-sm text-[#111827] dark:text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#98935c]"
                >
                  <option value={-1}>— Not mapped —</option>
                  {csv.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `(column ${i + 1})`}
                    </option>
                  ))}
                </select>
                <div className="w-40 shrink-0 text-xs text-gray-500 dark:text-[#a1a1aa] truncate" title={String(sample ?? "")}>
                  {selected >= 0 ? (
                    <>
                      <span className="font-medium">sample:</span> {String(sample ?? "").slice(0, 30) || "(empty)"}
                    </>
                  ) : conf ? (
                    <span>auto {Math.round(conf * 100)}%</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#3f3f46] space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#2e2e2e] dark:text-[#e5e7eb]">
            <input
              type="checkbox"
              checked={saveTemplate}
              onChange={(e) => setSaveTemplate(e.target.checked)}
              className="accent-[#98935c]"
            />
            Save this mapping as a template for future imports
          </label>
          {saveTemplate && (
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (e.g. My Broker)"
              className="w-full rounded-lg border border-white/60 dark:border-[#3f3f46] bg-white/70 dark:bg-[#3f3f46] px-3 py-2 text-sm text-[#111827] dark:text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#98935c]"
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#2e2e2e] dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3f3f46]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!requiredOk}
            onClick={() =>
              onConfirm(
                { fields, delimiter: initialMapping.delimiter },
                saveTemplate ? templateName.trim() || "Custom mapping" : undefined
              )
            }
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#2e2e2e] dark:bg-[#98935c] text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Import trades
          </button>
        </div>
      </div>
    </div>
  );
}
