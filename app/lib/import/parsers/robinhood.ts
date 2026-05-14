import type { BrokerParser, ParsedTrade } from "../types";

const OPTIONS_TRANS_CODES = ["BTO", "STO", "STC", "BTC"];
const FUTURES_BUY_SELL = ["BUY", "SELL"];
const isFuturesSymbol = (sym: string) =>
  /^\d*[A-Z]{1,5}\d*\/[A-Z0-9]+$/.test(sym) ||
  /^(ES|NQ|MES|MNQ|CL|GC|ZB|ZN|RTY|YM|EMD|MCL|MGC|MESZ4|ESH5|NQZ4)$/i.test(sym.trim());

export const robinhoodParser: BrokerParser = {
  id: "robinhood",
  label: "Robinhood",
  delimiter: ",",
  description:
    "Use the Activity CSV export. Only options and futures trades (BTO, STO, STC, BTC) are imported; buys and sells are grouped into full round-trip trades (FIFO).",
  parse({ headers, rows }, ctx) {
    const lower = headers.map((h) => h.toLowerCase());
    const activityIdx = lower.indexOf("activity date");
    const instrumentIdx = lower.indexOf("instrument");
    const descIdx = lower.indexOf("description");
    const transCodeIdx = lower.indexOf("trans code");
    const qtyIdx = lower.indexOf("quantity");
    const priceIdx = lower.indexOf("price");
    const amountIdx = lower.indexOf("amount");

    if (
      activityIdx === -1 ||
      instrumentIdx === -1 ||
      transCodeIdx === -1 ||
      qtyIdx === -1 ||
      priceIdx === -1 ||
      amountIdx === -1
    ) {
      throw new Error(
        "Missing required columns. Ensure this is the Robinhood Activity CSV export (Activity Date, Instrument, Trans Code, Quantity, Price, Amount)."
      );
    }

    type RobinhoodEvent = {
      dateMs: number;
      instrument: string;
      description: string;
      transCode: string;
      qty: number;
      price: number;
      amount: number;
      rowIndex: number;
      isFutures: boolean;
    };

    const events: RobinhoodEvent[] = [];
    rows.forEach((row, i) => {
      const instrumentRaw = (row[instrumentIdx] ?? "").toString().trim();
      const transCode = (row[transCodeIdx] ?? "").toString().trim().toUpperCase();
      const description = (descIdx >= 0 ? row[descIdx] ?? "" : "").toString().trim().replace(/\s+/g, " ");
      if (!instrumentRaw || !transCode) return;

      const isOption = OPTIONS_TRANS_CODES.includes(transCode);
      const isFutures = isFuturesSymbol(instrumentRaw);
      const isFuturesBuySell = isFutures && FUTURES_BUY_SELL.includes(transCode);
      if (!isOption && !isFuturesBuySell) return;

      const qty = parseFloat((row[qtyIdx] ?? "").toString().replace(/,/g, ""));
      const price = parseFloat((row[priceIdx] ?? "").toString().replace(/[$,]/g, ""));
      const amountStr = (row[amountIdx] ?? "").toString();
      if (!amountStr || !Number.isFinite(qty) || qty <= 0) return;

      const isNegative = amountStr.includes("(") && amountStr.includes(")");
      const cleanAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
      if (Number.isNaN(cleanAmount)) return;
      const amount = isNegative ? -cleanAmount : cleanAmount;

      const dateStr = (row[activityIdx] ?? "").toString().trim();
      const dateMs = new Date(dateStr).getTime();
      if (Number.isNaN(dateMs)) return;

      events.push({ dateMs, instrument: instrumentRaw, description, transCode, qty, price, amount, rowIndex: i, isFutures });
    });

    events.sort((a, b) => a.dateMs - b.dateMs || a.rowIndex - b.rowIndex);

    type Lot = { qty: number; price: number; amount: number; dateMs: number };
    const longLotsByKey = new Map<string, Lot[]>();
    const shortLotsByKey = new Map<string, Lot[]>();
    const getPositionKey = (e: RobinhoodEvent) =>
      !e.isFutures && e.description && /put|call|\d{1,2}\/\d{1,2}\/\d{2,4}|\$\d+/.test(e.description.toLowerCase())
        ? `${e.instrument}|${e.description}`
        : e.instrument;

    const baseTime = ctx.now ?? Date.now();
    const out: ParsedTrade[] = [];

    events.forEach((e, idx) => {
      const key = getPositionKey(e);
      const openLong = e.transCode === "BTO" || (e.isFutures && e.transCode === "BUY");
      const openShort = e.transCode === "STO";
      const closeLong = e.transCode === "STC" || (e.isFutures && e.transCode === "SELL");
      const closeShort = e.transCode === "BTC";
      if (openLong) {
        const lots = longLotsByKey.get(key) ?? [];
        lots.push({ qty: e.qty, price: e.price, amount: e.amount, dateMs: e.dateMs });
        longLotsByKey.set(key, lots);
      } else if (openShort) {
        const lots = shortLotsByKey.get(key) ?? [];
        lots.push({ qty: e.qty, price: e.price, amount: e.amount, dateMs: e.dateMs });
        shortLotsByKey.set(key, lots);
      } else if (closeLong) {
        let remaining = e.qty;
        const lots = longLotsByKey.get(key) ?? [];
        while (remaining > 1e-9 && lots.length > 0) {
          const lot = lots[0];
          const take = Math.min(lot.qty, remaining);
          const entryAmount = (lot.amount / lot.qty) * take;
          const exitAmount = (e.amount / e.qty) * take;
          const realizedPnl = exitAmount - Math.abs(entryAmount);
          out.push({
            id: `csv_${baseTime}_${key.replace(/\|/g, "_")}_${idx}`,
            instrument: e.description || e.instrument,
            entryTime: lot.dateMs,
            exitTime: e.dateMs,
            entryPrice: lot.price,
            exitPrice: e.price,
            isLong: true,
            pnl: realizedPnl,
            tags: [ctx.tag],
            modelTag: undefined,
            lotSize: take,
            notes: "",
            strength: 0,
            modelAdherence: 1,
          });
          remaining -= take;
          lot.qty -= take;
          if (lot.qty < 1e-9) lots.shift();
        }
        longLotsByKey.set(key, lots);
      } else if (closeShort) {
        let remaining = e.qty;
        const lots = shortLotsByKey.get(key) ?? [];
        while (remaining > 1e-9 && lots.length > 0) {
          const lot = lots[0];
          const take = Math.min(lot.qty, remaining);
          const entryAmount = (lot.amount / lot.qty) * take;
          const exitAmount = (e.amount / e.qty) * take;
          const realizedPnl = Math.abs(entryAmount) - Math.abs(exitAmount);
          out.push({
            id: `csv_${baseTime}_${key.replace(/\|/g, "_")}_${idx}`,
            instrument: e.description || e.instrument,
            entryTime: lot.dateMs,
            exitTime: e.dateMs,
            entryPrice: lot.price,
            exitPrice: e.price,
            isLong: false,
            pnl: realizedPnl,
            tags: [ctx.tag],
            modelTag: undefined,
            lotSize: take,
            notes: "",
            strength: 0,
            modelAdherence: 1,
          });
          remaining -= take;
          lot.qty -= take;
          if (lot.qty < 1e-9) lots.shift();
        }
        shortLotsByKey.set(key, lots);
      }
    });

    return out;
  },
};
