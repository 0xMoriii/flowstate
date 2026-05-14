import type { BrokerParser, ParsedTrade } from "../types";

export const tradovateParser: BrokerParser = {
  id: "tradovate",
  label: "Tradovate",
  delimiter: ",",
  description:
    "Use your platform's export (e.g. Account Performance) with columns such as Symbol, PnL, Bought/Sold Timestamp, Buy/Sell Price.",
  parse({ headers, rows }, ctx) {
    const lower = headers.map((h) => h.toLowerCase());
    const pnlIdx = lower.indexOf("pnl");
    const instIdx = lower.indexOf("symbol");
    const boughtIdx = lower.indexOf("boughttimestamp");
    const soldIdx = lower.indexOf("soldtimestamp");
    const buyPriceIdx = lower.indexOf("buyprice");
    const sellPriceIdx = lower.indexOf("sellprice");
    const qtyIdx = lower.findIndex((h) => {
      const t = h.trim();
      if (/contract\s*size|contractsize/.test(t)) return false;
      return /quantity|^qty$|contracts|^size$|positionsize/.test(t);
    });

    if (
      pnlIdx === -1 ||
      instIdx === -1 ||
      boughtIdx === -1 ||
      soldIdx === -1 ||
      buyPriceIdx === -1 ||
      sellPriceIdx === -1
    ) {
      throw new Error("Missing required columns. Ensure it is a valid Tradovate export.");
    }

    const base = ctx.now ?? Date.now();
    const out: ParsedTrade[] = [];
    rows.forEach((row, i) => {
      if (row.length < headers.length) return;
      const rawPnl = row[pnlIdx] ?? "";
      const isNegative = rawPnl.includes("(") && rawPnl.includes(")");
      const cleanPnl = parseFloat(String(rawPnl).replace(/[^0-9.]/g, ""));
      if (Number.isNaN(cleanPnl)) return;
      const pnl = isNegative ? -cleanPnl : cleanPnl;

      const t1 = new Date(String(row[boughtIdx]).replace(/"/g, "")).getTime();
      const t2 = new Date(String(row[soldIdx]).replace(/"/g, "")).getTime();
      if (Number.isNaN(t1) || Number.isNaN(t2)) return;

      const buyPrice = parseFloat(String(row[buyPriceIdx]));
      const sellPrice = parseFloat(String(row[sellPriceIdx]));

      const isLong = t1 < t2;
      const entryTime = Math.min(t1, t2);
      const exitTime = Math.max(t1, t2);
      const entryPrice = isLong ? buyPrice : sellPrice;
      const exitPrice = isLong ? sellPrice : buyPrice;

      const rawQty = qtyIdx >= 0 ? parseFloat(String(row[qtyIdx]).replace(/"/g, "")) : NaN;
      const lotSize = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : undefined;

      out.push({
        id: `csv_${base}_${i}`,
        instrument: String(row[instIdx]).replace(/"/g, "") || "UNKNOWN",
        entryTime,
        exitTime,
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
