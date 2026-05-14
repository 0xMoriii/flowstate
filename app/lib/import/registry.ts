import type { BrokerParser } from "./types";
import { tradovateParser } from "./parsers/tradovate";
import { robinhoodParser } from "./parsers/robinhood";
import { deepchartsParser } from "./parsers/deepcharts";
import { universalParser } from "./parsers/universal";

export const PARSERS: BrokerParser[] = [
  universalParser,
  tradovateParser,
  robinhoodParser,
  deepchartsParser,
];

export function getParser(id: string): BrokerParser | undefined {
  return PARSERS.find((p) => p.id === id);
}

export const IMPORT_TAG_BY_ID: Record<string, string> = {
  tradovate: "Tradovate Import",
  robinhood: "Robinhood Import",
  deepcharts: "DeepCharts Import",
  universal: "CSV Import",
};
