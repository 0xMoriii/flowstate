import type { BrokerParser, ParsedTrade } from "../types";
import { parseEt } from "../../time/et";

export const deepchartsParser: BrokerParser = {
  id: "deepcharts",
  label: "DeepCharts",
  delimiter: ";",
  description: "DeepCharts semicolon-delimited export.",
  parse({ headers, rows }, ctx) {
    const lower = headers.map((h) => h.toLowerCase());
    const instIdx = lower.findIndex((h) => h === "symbol");
    const contractIdx = lower.findIndex((h) => h === "contract");
    const entryDateIdx = lower.findIndex((h) => h === "entry date");
    const exitDateIdx = lower.findIndex((h) => h === "exit date");
    const entryPriceIdx = lower.findIndex((h) => h === "entry price");
    const exitPriceIdx = lower.findIndex((h) => h === "exit price");
    const sideIdx = lower.findIndex((h) => h === "side");
    const qtyIdx = lower.findIndex((h) => h === "quantity");
    const pnlIdx = lower.findIndex((h) => h === "net p/l");

    if (
      entryDateIdx === -1 ||
      exitDateIdx === -1 ||
      entryPriceIdx === -1 ||
      exitPriceIdx === -1 ||
      sideIdx === -1 ||
      qtyIdx === -1 ||
      pnlIdx === -1
    ) {
      throw new Error("Missing required columns. Ensure this is a DeepCharts export.");
    }

    const base = ctx.now ?? Date.now();
    const out: ParsedTrade[] = [];
    rows.forEach((row, i) => {
      if (row.length < headers.length) return;
      const instrumentRaw = String(row[instIdx] || row[contractIdx] || "UNKNOWN").replace(/"/g, "").trim();
      const side = String(row[sideIdx]).toUpperCase().trim();

      const rawPnl = row[pnlIdx] ?? "";
      const isNegative = rawPnl.includes("(") && rawPnl.includes(")");
      const cleanPnl = parseFloat(String(rawPnl).replace(/[^0-9.-]/g, ""));
      if (Number.isNaN(cleanPnl)) return;
      const pnl = isNegative ? -Math.abs(cleanPnl) : cleanPnl;

      const t1 = parseEt(String(row[entryDateIdx]).replace(/"/g, ""));
      const t2 = parseEt(String(row[exitDateIdx]).replace(/"/g, ""));
      if (Number.isNaN(t1) || Number.isNaN(t2)) return;

      const entryPrice = parseFloat(String(row[entryPriceIdx]));
      const exitPrice = parseFloat(String(row[exitPriceIdx]));
      const rawQty = parseFloat(String(row[qtyIdx]).replace(/"/g, ""));
      const lotSize = Number.isFinite(rawQty) ? Math.abs(rawQty) : undefined;
      const isLong = side === "BUY";

      out.push({
        id: `csv_${base}_deepcharts_${i}`,
        instrument: instrumentRaw,
        entryTime: Math.min(t1, t2),
        exitTime: Math.max(t1, t2),
        entryPrice,
        exitPrice,
        isLong,
        pnl,
        tags: [ctx.tag],
        modelTag: undefined,
        lotSize,
        notes: "",
        strength: 0,
        modelAdherence: 1,
      });
    });
    return out;
  },
};
