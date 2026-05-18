"use client";

import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  List as LucideList,
  Calendar as LucideCalendar,
  Target as LucideTarget,
  Brain as LucideBrain,
  Layout as LucideLayoutDashboard,
  Zap as LucideZap,
  TrendingUp as LucideTrendingUp,
  BarChart3 as LucideBarChart3,
  Activity as LucideActivity,
  Crosshair as LucideCrosshair,
  CircleDot as LucideCircleDot,
  LineChart as LucideLineChart,
  Pencil as LucidePencil,
  Trash2 as LucideTrash2,
  Merge as LucideMerge,
  Menu as LucideMenu,
  Sun as LucideSun,
  Moon as LucideMoon,
  LogIn as LucideLogIn,
  LogOut as LucideLogOut,
  Upload as LucideUpload,
  BookOpen as LucideBookOpen,
  ChevronDown as LucideChevronDown,
  ChevronUp as LucideChevronUp,
  X as LucideX,
  type LucideIcon,
} from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { parseCsvText as libParseCsvText, detectDelimiter, headerFingerprint } from "./lib/import/csv";
import { getParser, IMPORT_TAG_BY_ID } from "./lib/import/registry";
import {
  autoDetectMapping,
  parseWithMapping,
  universalParser,
} from "./lib/import/parsers/universal";
import type {
  CsvData,
  FieldConfidence,
  ImportMapping,
  ImportTemplate,
  ParsedTrade,
  TradeField,
} from "./lib/import/types";
import ImportMappingModal from "./components/ImportMappingModal";
import { formatEtDayKey, formatEtTime, formatEtDateTime, formatEtShortDate, formatEtWeekdayDate, formatDurationHMS } from "./lib/time/et";

/** Strategy card icon options (id -> Lucide component). Used in Strategy tab and trade strategy tag. */
const MODEL_ICONS: Record<string, LucideIcon> = {
  target: LucideTarget,
  brain: LucideBrain,
  zap: LucideZap,
  trendingUp: LucideTrendingUp,
  barChart: LucideBarChart3,
  activity: LucideActivity,
  crosshair: LucideCrosshair,
  circleDot: LucideCircleDot,
  lineChart: LucideLineChart,
};
// To swap a sidebar icon: 1) Pick one at https://lucide.dev/icons 2) Add it here, e.g. "Sparkles as LucideDiscipline"
// 3) Use it in the nav array below, e.g. { id: "discipline", icon: LucideDiscipline, label: "Discipline" }

// --- CONFIG & ICONS ---
const COLORS = {
  bg: "#ebebeb",
  text: "#2e2e2e",
  accent: "#98935c",
  profit: "#42bda8",
  loss: "#f43636",
  glassBg: "rgba(255, 255, 255, 0.4)",
  glassBorder: "rgba(255, 255, 255, 0.6)",
};

const Icons = {
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  List: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  Brain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.9.5H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.5V9H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5z"></path>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.9.5h.1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-.5v-4.5h.5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2.5z"></path>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  Tag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  ),
};

/** Match (max-width: 767px) for mobile layout. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/** Normalize futures symbol for display: preserve Micro (MES/MNQ) vs Mini (ES/NQ). ESM4->ES, MESH6->MES, etc. */
function formatSymbolDisplay(symbol: string): string {
  const s = (symbol || "").trim();
  // Check Micro (MES, MNQ) before Mini (ES, NQ) so we don't collapse MES->ES.
  if (/^MES/i.test(s)) return "MES";
  if (/^MNQ/i.test(s)) return "MNQ";
  if (/^ES/i.test(s)) return "ES";
  if (/^NQ/i.test(s)) return "NQ";
  const root = s.replace(/[FGHJKMNQUVXZ]\d?$/i, "").slice(0, 3).toUpperCase();
  return root || s;
}

/** Format PnL consistently: "+$100.00" or "-$100.00" (sign first, then $, then amount). */
function formatPnl(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(value).toFixed(decimals)}`;
}

const MARK_DOUGLAS_QUOTES = [
  "An edge is nothing more than an indication of a higher probability of one thing happening over another.",
  "There is a random distribution between wins and losses for any given set of variables that define an edge.",
  "To be a successful trader, you have to learn to think in probabilities.",
  "The hard, cold reality of trading is that every trade has an uncertain outcome.",
];

// --- MOCK DATA GENERATOR ---
const generateMockTrades = () => {
  const trades: Array<{
    id: string;
    instrument: string;
    entryTime: number;
    exitTime: number;
    pnl: number;
    capitalAfter: number;
    tags: string[];
    modelTag?: string | null; // model name when trade was executed with a saved model (separate from tags)
    notes: string;
    strength: number;
    modelAdherence: number;
    entryPrice?: number;
    exitPrice?: number;
    isLong?: boolean;
    lotSize?: number; // number of contracts (from imports or manual)
    chartImage?: string; // legacy single image (migrated to chartImages)
    chartImages?: string[]; // base64 data URLs for attached chart/screenshots
    combinedFromKeys?: string[]; // when this trade is a combined trade, keys (instrument|entryTime|exitTime) of constituent trades so CSV import doesn't re-add them
    timeInTradeMs?: number; // sum of leg durations for combined trades
    mergedSources?: Array<Record<string, unknown>>; // snapshot of original trade objects for uncombine
  }> = [];
  let currentCapital = 50000;
  const now = new Date();

  for (let i = 45; i >= 0; i--) {
    const tradesToday = Math.floor(Math.random() * 4);
    for (let j = 0; j < tradesToday; j++) {
      const isWin = Math.random() > 0.45;
      const pnl = isWin ? Math.random() * 800 + 100 : -(Math.random() * 500 + 100);
      currentCapital += pnl;

      const tradeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      tradeDate.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));

      const entryPrice = 4000 + Math.random() * 100;
      const exitPrice = entryPrice + (pnl > 0 ? Math.abs(pnl) / 50 : -Math.abs(pnl) / 50);

      trades.push({
        id: `trd_${i}_${j}_${Math.random().toString(36).substr(2, 5)}`,
        instrument: Math.random() > 0.5 ? "ESM4" : "NQM4",
        entryTime: tradeDate.getTime(),
        exitTime: tradeDate.getTime() + Math.random() * 3600000,
        pnl,
        capitalAfter: currentCapital,
        tags: isWin ? ["Trend Following"] : ["FOMO", "Early Entry"],
        modelTag: undefined,
        notes: "",
        strength: 0,
        modelAdherence: Math.random() > 0.3 ? 1 : 0,
        entryPrice,
        exitPrice,
        isLong: pnl > 0,
        lotSize: Math.random() > 0.3 ? 1 : 2,
      });
    }
  }
  return trades.reverse();
};

// --- LOCAL STORAGE PERSISTENCE (Option 1: client-only) ---
const TRADES_STORAGE_KEY = "flowstate-trades";
const USER_HAS_IMPORTED_KEY = "flowstate-has-user-imported";

function loadTradesFromStorage(): ReturnType<typeof generateMockTrades> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveTradesToStorage(trades: ReturnType<typeof generateMockTrades>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch {
    // Quota exceeded or other; fail silently
  }
}

const DISCIPLINE_NOTES_STORAGE_KEY = "flowstate-discipline-notes";

function loadDisciplineNotesFromStorage(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DISCIPLINE_NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveDisciplineNotesToStorage(notes: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISCIPLINE_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Quota exceeded or other; fail silently
  }
}

// --- GEMINI API INTEGRATIONS (via Next.js API routes to avoid CORS) ---
const generateAIResponse = async (prompt: string, systemInstruction: string) => {
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const backoffs = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i < backoffs.length; i++) {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemInstruction }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error ?? `HTTP ${response.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      return data?.text ?? "No insight generated.";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      if (i === backoffs.length - 1) {
        console.error("Gemini API error:", message);
        return `AI unavailable: ${message}. Check your API key at https://aistudio.google.com/apikey and that the Gemini API is enabled.`;
      }
      await delay(backoffs[i]);
    }
  }
  return "AI System unavailable.";
};

// --- COMPONENTS ---
const GlassCard = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-white/40 dark:bg-[#27272a] backdrop-blur-md border border-white/60 dark:border-[#3f3f46] shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-2xl p-6 ${className}`}
  >
    {children}
  </div>
);

const StrengthMeter = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          onClick={(e) => {
            e.stopPropagation();
            onChange(star);
          }}
          onMouseEnter={() => setHover(star)}
          className="w-6 h-6 cursor-pointer transition-colors duration-200"
          style={{ color: (hover || value) >= star ? COLORS.accent : "#9ca3af", fill: (hover || value) >= star ? "currentColor" : "none" }}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      ))}
    </div>
  );
};

// --- CALENDAR (standalone so it doesn't remount on App re-renders) ---
const CALENDAR_DAY_MIN_WIDTH = 104;
const CALENDAR_GRID_GAP_PX = 8;
const CALENDAR_FULL_MIN_WIDTH = CALENDAR_DAY_MIN_WIDTH * 8 + CALENDAR_GRID_GAP_PX * 7;

type CalendarTrade = ReturnType<typeof generateMockTrades>[number];

type TradeForMetrics = {
  pnl: number;
  entryTime: number;
  notes?: string;
  tags?: string[];
  strength?: number;
  chartImages?: string[];
};

function computeMetricsFromTrades(
  trades: TradeForMetrics[],
  flowDayKeys?: Set<string>,
): {
  profitFactor: number;
  winLossRatio: number;
  disciplineScore: number;
  score: number;
  totalTrades: number;
  winRate: number;
  expectedReturn: number;
  components: { pfComponent: number; discComponent: number; riskAdjComponent: number };
} | null {
  if (!trades.length) return null;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  const expectedReturn = (grossProfit - grossLoss) / trades.length;

  const winCount = wins.length;
  const winLossRatio = trades.length ? (winCount / trades.length) * 100 : 0;

  const lossAmounts = losses.map((t) => Math.abs(t.pnl));
  let riskConsistencyScore = 100;
  if (lossAmounts.length >= 2) {
    const mean = lossAmounts.reduce((a, b) => a + b, 0) / lossAmounts.length;
    const variance = lossAmounts.reduce((s, x) => s + (x - mean) ** 2, 0) / lossAmounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;
    riskConsistencyScore = Math.max(0, Math.min(100, 100 - 50 * cv));
  }

  const journalingScores = trades.map((t) => {
    const hasNotes = (t.notes?.trim() ?? "").length > 0;
    const tagCount = t.tags?.length ?? 0;
    const imageCount = t.chartImages?.length ?? 0;
    const notePart = hasNotes ? 40 : 0;
    const tagPart = Math.min(tagCount * 12, 30);
    const imagePart = Math.min(imageCount * 15, 30);
    const flowBonus = flowDayKeys && flowDayKeys.has(formatEtDayKey(t.entryTime)) ? 20 : 0;
    return Math.min(100, notePart + tagPart + imagePart + flowBonus);
  });
  const journalingScore = journalingScores.length
    ? journalingScores.reduce((a, b) => a + b, 0) / journalingScores.length
    : 0;

  const strengths = trades.map((t) => t.strength ?? 0).filter((s) => s >= 0);
  const avgStrength = strengths.length ? strengths.reduce((a, b) => a + b, 0) / strengths.length : 0;
  const strengthScore = Math.min(100, (avgStrength / 5) * 100);

  const disciplineScore = Math.round(
    (riskConsistencyScore * 1) / 3 + (journalingScore * 1) / 3 + (strengthScore * 1) / 3,
  );

  // PF: 1.0 → 0 pts, 3.0 → 40 pts (linear between 1 and 3)
  const pfComponent =
    profitFactor <= 1 ? 0 : Math.min(40, ((Math.min(profitFactor, 3) - 1) / 2) * 40);
  const discComponent = disciplineScore * 0.4;

  // Risk-adjusted (max 20): expectancy per unit risk + drawdown
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const expectancyRatio = avgLoss > 0 ? expectedReturn / avgLoss : (expectedReturn > 0 ? 2 : 0);
  const expectancyPart = 10 * Math.min(expectancyRatio, 2) / 2;

  const sortedByTime = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  let cum = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of sortedByTime) {
    cum += t.pnl;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const drawdownRatio = peak > 0 ? maxDrawdown / peak : 0;
  const drawdownPart = 10 * (1 - Math.min(drawdownRatio, 1));
  const riskAdjComponent = Math.min(20, Math.max(0, expectancyPart + drawdownPart));

  const score = Math.min(100, Math.max(0, pfComponent + discComponent + riskAdjComponent));

  return {
    profitFactor,
    winLossRatio,
    disciplineScore,
    score,
    totalTrades: trades.length,
    winRate: (wins.length / trades.length) * 100,
    expectedReturn,
    components: { pfComponent, discComponent, riskAdjComponent },
  };
}

type CalendarFlowSubmission = {
  id: string;
  templateId: string;
  templateName: string;
  date: string;
  answers: Record<string, string | string[]>;
  submittedAt: number;
};
type CalendarFlowQuestion = { id: string; prompt: string; type: "text" | "tags" };
type CalendarFlowTemplate = { id: string; name: string; questions: CalendarFlowQuestion[] };

function CalendarView({
  trades,
  setTrades,
  setSelectedTrade,
  viewMonth,
  setViewMonth,
  viewYear,
  selectedDate,
  setSelectedDate,
  isMobile = false,
  flowSubmissions = [],
  flowTemplates = [],
  onOpenFlow,
  todayKey,
}: {
  trades: ReturnType<typeof generateMockTrades>;
  setTrades: React.Dispatch<React.SetStateAction<ReturnType<typeof generateMockTrades>>>;
  setSelectedTrade: (t: CalendarTrade | null) => void;
  viewMonth: number;
  setViewMonth: React.Dispatch<React.SetStateAction<number>>;
  viewYear: number;
  selectedDate: string | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<string | null>>;
  isMobile?: boolean;
  flowSubmissions?: CalendarFlowSubmission[];
  flowTemplates?: CalendarFlowTemplate[];
  onOpenFlow?: (templateId: string) => void;
  todayKey?: string;
}) {
  const hideWeeklyColumn = isMobile;
  const [compactCalendar, setCompactCalendar] = useState(false);
  const [selectedForCombine, setSelectedForCombine] = useState<Set<string>>(new Set());
  const [confirmClearDay, setConfirmClearDay] = useState(false);
  const [expandedFlowSubmissionId, setExpandedFlowSubmissionId] = useState<string | null>(null);

  const submissionsForSelectedDay = selectedDate
    ? flowSubmissions.filter((s) => s.date === selectedDate)
    : [];
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfirmClearDay(false);
  }, [selectedDate]);

  const handleClearDay = () => {
    if (!selectedDate) return;
    setTrades((prev) => prev.filter((t) => formatEtDayKey(t.entryTime) !== selectedDate));
    setConfirmClearDay(false);
    setSelectedForCombine(new Set());
  };

  // Round to nearest second so re-imports with sub-ms timestamp drift still match.
  const tradeKey = (t: { instrument: string; entryTime: number; exitTime: number }) =>
    `${t.instrument}|${Math.round(t.entryTime / 1000)}|${Math.round(t.exitTime / 1000)}`;

  const mergeTradeGroup = (group: CalendarTrade[]): CalendarTrade => {
    const entryTime = Math.min(...group.map((t) => t.entryTime));
    const exitTime = Math.max(...group.map((t) => t.exitTime));
    const combinedPnL = group.reduce((sum, t) => sum + t.pnl, 0);
    const lastTrade = group.reduce((a, b) => (a.exitTime > b.exitTime ? a : b));
    const firstTrade = group.reduce((a, b) => (a.entryTime < b.entryTime ? a : b));
    const allTags = [...new Set(group.flatMap((t) => t.tags || []).filter(Boolean))];
    const allNotes = group.map((t) => t.notes).filter(Boolean).join("\n\n");
    const allChartImages = group.flatMap((t) => t.chartImages ?? (t.chartImage ? [t.chartImage] : []));
    const allCombinedKeys = [...new Set(group.flatMap((t) =>
      (t.combinedFromKeys && t.combinedFromKeys.length > 0) ? t.combinedFromKeys : [tradeKey(t)]
    ))];
    const summedLotSize = group.reduce((s, t) => s + (Number.isFinite(t.lotSize) ? (t.lotSize as number) : 0), 0);
    const timeInTradeMs = group.reduce((s, t) => s + Math.max(0, t.exitTime - t.entryTime), 0);
    const mergedSources = group.map((t) => JSON.parse(JSON.stringify(t)) as Record<string, unknown>);

    return {
      ...firstTrade,
      id: `combined_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      entryTime,
      exitTime,
      pnl: combinedPnL,
      capitalAfter: lastTrade.capitalAfter,
      tags: allTags,
      notes: allNotes || firstTrade.notes,
      chartImages: allChartImages.length > 0 ? allChartImages : undefined,
      chartImage: undefined,
      combinedFromKeys: allCombinedKeys,
      lotSize: summedLotSize > 0 ? summedLotSize : firstTrade.lotSize,
      timeInTradeMs,
      mergedSources,
    };
  };

  const handleCombineSelected = () => {
    if (selectedForCombine.size < 2) return;
    const toCombine = trades.filter((t) => selectedForCombine.has(t.id));
    if (toCombine.length < 2) return;
    const combined = mergeTradeGroup(toCombine);
    setTrades((prev) => {
      const idsToRemove = new Set(toCombine.map((t) => t.id));
      const kept = prev.filter((t) => !idsToRemove.has(t.id));
      return [...kept, combined].sort((a, b) => a.entryTime - b.entryTime);
    });
    setSelectedForCombine(new Set());
    setSelectedTrade(combined);
  };

  const [autoCombinePreview, setAutoCombinePreview] = useState<CalendarTrade[][] | null>(null);

  const computeAutoCombineClusters = (dayTrades: CalendarTrade[]): CalendarTrade[][] => {
    const buckets = new Map<string, CalendarTrade[]>();
    for (const t of dayTrades) {
      const k = `${t.instrument}|${t.isLong === undefined ? "unk" : t.isLong ? "L" : "S"}`;
      const arr = buckets.get(k);
      if (arr) arr.push(t);
      else buckets.set(k, [t]);
    }
    const clusters: CalendarTrade[][] = [];
    for (const list of buckets.values()) {
      list.sort((a, b) => a.entryTime - b.entryTime);
      let current: CalendarTrade[] = [];
      let maxExit = -Infinity;
      for (const t of list) {
        if (current.length === 0 || t.entryTime <= maxExit) {
          current.push(t);
          maxExit = Math.max(maxExit, t.exitTime);
        } else {
          if (current.length >= 2) clusters.push(current);
          current = [t];
          maxExit = t.exitTime;
        }
      }
      if (current.length >= 2) clusters.push(current);
    }
    return clusters;
  };

  const handleAutoCombinePreview = () => {
    setAutoCombinePreview(computeAutoCombineClusters(tradesForSelectedDate));
  };

  const handleAutoCombineConfirm = () => {
    if (!autoCombinePreview || autoCombinePreview.length === 0) {
      setAutoCombinePreview(null);
      return;
    }
    const merged = autoCombinePreview.map(mergeTradeGroup);
    setTrades((prev) => {
      const idsToRemove = new Set(autoCombinePreview.flat().map((t) => t.id));
      const kept = prev.filter((t) => !idsToRemove.has(t.id));
      return [...kept, ...merged].sort((a, b) => a.entryTime - b.entryTime);
    });
    setAutoCombinePreview(null);
    setSelectedForCombine(new Set());
  };

  const autoCombineSummary = useMemo(() => {
    if (!autoCombinePreview) return "";
    if (autoCombinePreview.length === 0) return "No overlapping trades found";
    const counts = new Map<string, number>();
    for (const group of autoCombinePreview) {
      const first = group[0];
      const side = first.isLong === undefined ? "" : first.isLong ? " long" : " short";
      const k = `${first.instrument}${side}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const parts = [...counts.entries()].map(([k, n]) => `${n}× ${k}`).join(", ");
    return `Found ${autoCombinePreview.length} group${autoCombinePreview.length === 1 ? "" : "s"}: ${parts}`;
  }, [autoCombinePreview]);

  const toggleSelectForCombine = (e: React.MouseEvent, tradeId: string) => {
    e.stopPropagation();
    setSelectedForCombine((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) next.delete(tradeId);
      else next.add(tradeId);
      return next;
    });
  };

  useEffect(() => {
    setSelectedForCombine(new Set());
    setAutoCombinePreview(null);
  }, [selectedDate]);

  useEffect(() => {
    const el = calendarContainerRef.current;
    if (!el) return;
    const updateCompact = () => {
      const w = el.clientWidth;
      setCompactCalendar(w < CALENDAR_FULL_MIN_WIDTH);
    };
    updateCompact();
    const ro = new ResizeObserver(updateCompact);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(viewMonth, viewYear);

  // Pre-group trades by date string in a single pass so per-day lookup is O(1).
  // Replaces an O(trades × days) nested filter that allocated a Date per comparison.
  const tradesByDate = useMemo(() => {
    const map = new Map<string, CalendarTrade[]>();
    for (const t of trades) {
      const key = formatEtDayKey(t.entryTime);
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [trades]);

  let totalMonthlyPnL = 0;
  const weeks: { days: (null | { date: number; fullDate: string; trades: CalendarTrade[]; pnl: number })[]; weeklyPnL: number }[] = [];
  let currentWeek: { days: (null | { date: number; fullDate: string; trades: CalendarTrade[]; pnl: number })[]; weeklyPnL: number } = {
    days: Array(firstDayOfMonth).fill(null),
    weeklyPnL: 0,
  };

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTrades = tradesByDate.get(dateStr) ?? [];
    const dayPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0);

    totalMonthlyPnL += dayPnL;
    currentWeek.weeklyPnL += dayPnL;
    currentWeek.days.push({ date: d, fullDate: dateStr, trades: dayTrades, pnl: dayPnL });

    if (currentWeek.days.length === 7) {
      weeks.push(currentWeek);
      currentWeek = { days: [], weeklyPnL: 0 };
    }
  }
  if (currentWeek.days.length > 0) {
    while (currentWeek.days.length < 7) currentWeek.days.push(null);
    weeks.push(currentWeek);
  }

  const tradesForSelectedDate = selectedDate ? tradesByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="fade-in space-y-6">
      <div
        className={`flex mb-6 ${compactCalendar ? "flex-col gap-4 items-start" : "justify-between items-end"}`}
      >
        <div className={compactCalendar ? "w-full" : ""}>
          <h2
            className={`display-font text-[#2e2e2e] dark:text-[#fafafa] ${compactCalendar ? "text-3xl" : "text-5xl"}`}
          >
            {new Date(viewYear, viewMonth).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa] mt-2 flex gap-4">
            <button
              onClick={() => setViewMonth((prev) => (prev === 0 ? 11 : prev - 1))}
              className="hover:text-black"
            >
              ← Prev
            </button>
            <button
              onClick={() => setViewMonth((prev) => (prev === 11 ? 0 : prev + 1))}
              className="hover:text-black"
            >
              Next →
            </button>
          </div>
        </div>
        <div className={compactCalendar ? "w-full text-right" : "text-right"}>
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-2">
            Monthly PnL
          </div>
          <div
            className={`display-font tracking-tight ${compactCalendar ? "text-3xl" : "text-5xl"}`}
            style={{ color: totalMonthlyPnL >= 0 ? COLORS.profit : COLORS.loss }}
          >
            {formatPnl(totalMonthlyPnL, 2)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div ref={calendarContainerRef} className="w-full overflow-x-auto" style={{ minWidth: 0 }}>
          <div className={`flex flex-col ${hideWeeklyColumn ? "min-w-0 pl-2 pr-2 sm:pl-4 sm:pr-4 md:pl-8 md:pr-8" : "min-w-[600px] pl-8 pr-8"} pb-8`}>
            <div className={`grid mb-2 ${hideWeeklyColumn ? "grid-cols-7" : "grid-cols-8"} ${compactCalendar ? "gap-1" : "gap-2"}`}>
              {(hideWeeklyColumn ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Weekly"]).map((d, i) => (
                <div
                  key={d}
                  className={`text-center font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase ${compactCalendar ? "text-[8px] tracking-wide" : "text-[10px] tracking-wider"} ${!hideWeeklyColumn && i === 7 ? "text-[#2e2e2e] dark:text-[#fafafa]" : ""}`}
                >
                  {!hideWeeklyColumn && compactCalendar && i === 7 ? "Wk" : d}
                </div>
              ))}
            </div>

            {weeks.map((week, wIdx) => (
              <div
                key={wIdx}
                className={`grid ${hideWeeklyColumn ? "grid-cols-7" : "grid-cols-8"} mb-2 ${compactCalendar ? "gap-1" : "gap-2"}`}
              >
                {week.days.map((day, dIdx) => (
                  <GlassCard
                    key={dIdx}
                    onClick={day && day.trades.length > 0 ? () => setSelectedDate(day.fullDate) : undefined}
                    className={`!p-2 md:!p-3 flex flex-col justify-start items-start gap-0 transition-all duration-200
                      ${compactCalendar ? "h-16" : "h-[100px] min-h-[100px] justify-between"}
                      ${!day ? "invisible" : ""} 
                      ${day && day.trades.length === 0 ? "cursor-default" : "cursor-pointer"}
                      ${day?.fullDate === selectedDate
                        ? (day?.pnl ?? 0) > 0
                          ? "!bg-[#42bda8] !border-2 !border-[#42bda8]"
                          : (day?.pnl ?? 0) < 0
                            ? "!bg-[#f43636] !border-2 !border-[#f43636]"
                            : "!bg-[#98935c] !border-2 !border-[#98935c]"
                        : day && day.trades.length > 0
                          ? (day.pnl ?? 0) > 0
                            ? compactCalendar
                              ? "!border-2 !border-[#42bda8] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(66,189,168,0.35)]"
                              : "!border-2 !border-[#42bda8] hover:!border-[#42bda8] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(66,189,168,0.35)]"
                            : (day.pnl ?? 0) < 0
                              ? compactCalendar
                                ? "!border-2 !border-[#f43636] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(244,54,54,0.35)]"
                                : "!border-2 !border-[#f43636] hover:!border-[#f43636] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(244,54,54,0.35)]"
                              : compactCalendar
                                ? "!border-2 !border-[#98935c] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(152,147,92,0.3)]"
                                : "!border-2 !border-[#98935c] hover:!border-[#98935c] hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[inset_0_0_24px_rgba(152,147,92,0.3)]"
                          : "border-2 border-transparent"}
                    `}
                  >
                    {day && (
                      <>
                        <div
                          className={`font-extrabold w-full text-right ${compactCalendar ? "text-sm" : "text-xl"} ${day.fullDate === selectedDate ? "text-white" : "text-[var(--color-gray-500)]"}`}
                        >
                          {day.date}
                        </div>
                        {!compactCalendar && (
                          <div className="text-right space-y-0.5 w-full">
                            {day.trades.length > 0 && (
                              <div
                                className={`text-[10px] font-medium uppercase tracking-wide ${day.fullDate === selectedDate ? "text-white/90" : "text-gray-500 dark:text-[#a1a1aa]"}`}
                              >
                                {day.trades.length} {day.trades.length === 1 ? "trade" : "trades"}
                              </div>
                            )}
                            {day.trades.length > 0 && (
                              <div
                                className={`text-sm font-semibold ${day.fullDate === selectedDate ? "text-white" : ""}`}
                                style={day.fullDate !== selectedDate ? { color: day.pnl >= 0 ? COLORS.profit : COLORS.loss } : undefined}
                              >
                                {formatPnl(day.pnl, 0)}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </GlassCard>
                ))}
                {!hideWeeklyColumn && (
                  <div
                    className={`flex items-center justify-center rounded-xl bg-white/20 dark:bg-white/10 font-semibold ${compactCalendar ? "text-xs" : "text-sm"}`}
                    style={{ color: week.weeklyPnL >= 0 ? COLORS.profit : COLORS.loss }}
                  >
                    {formatPnl(week.weeklyPnL, 0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div className="w-full fade-in pb-8">
            <GlassCard>
              {submissionsForSelectedDay.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {submissionsForSelectedDay.map((sub) => {
                    const expanded = expandedFlowSubmissionId === sub.id;
                    const template = flowTemplates.find((t) => t.id === sub.templateId);
                    return (
                      <div key={sub.id} className="w-full">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFlowSubmissionId(expanded ? null : sub.id)
                          }
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                            expanded
                              ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                              : "bg-[#98935c]/10 text-[#2e2e2e] dark:text-[#fafafa] border-[#98935c]/30 hover:bg-[#98935c]/20"
                          }`}
                          aria-expanded={expanded}
                        >
                          <LucideBookOpen className="w-4 h-4" />
                          <span>Flow: {sub.templateName}</span>
                          {expanded ? (
                            <LucideChevronUp className="w-4 h-4" />
                          ) : (
                            <LucideChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expanded && (
                          <div className="mt-2 p-4 rounded-xl bg-white/40 dark:bg-[#27272a] border border-white/60 dark:border-[#3f3f46] space-y-3">
                            {template ? (
                              template.questions.map((q) => {
                                const ans = sub.answers[q.id];
                                const displayAns =
                                  Array.isArray(ans)
                                    ? ans.length
                                      ? ans.join(", ")
                                      : "—"
                                    : (ans ?? "").toString().trim() || "—";
                                return (
                                  <div key={q.id}>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-[#a1a1aa] mb-1">
                                      {q.prompt}
                                    </div>
                                    <div className="text-sm text-[#2e2e2e] dark:text-[#fafafa] whitespace-pre-wrap">
                                      {Array.isArray(ans) ? (
                                        ans.length ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {ans.map((tag) => (
                                              <span
                                                key={tag}
                                                className="px-2 py-0.5 rounded-md bg-[#2e2e2e] text-white text-xs"
                                              >
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )
                                      ) : (
                                        displayAns
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-xs text-gray-500 italic">
                                Template no longer exists; showing raw answers.
                                <pre className="mt-2 text-xs whitespace-pre-wrap">
                                  {JSON.stringify(sub.answers, null, 2)}
                                </pre>
                              </div>
                            )}
                            {todayKey === sub.date && onOpenFlow && (
                              <div className="pt-2 border-t border-white/60 dark:border-[#3f3f46]">
                                <button
                                  type="button"
                                  onClick={() => onOpenFlow(sub.templateId)}
                                  className="text-[11px] font-semibold uppercase tracking-widest text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
                                >
                                  Edit in Flow →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap justify-between items-end gap-4 mb-6 border-b border-white/50 dark:border-[#3f3f46] pb-4">
                <h3 className="display-font text-3xl text-[#2e2e2e] dark:text-[#fafafa]">
                  {(() => {
                    const [yy, mm, dd] = selectedDate.split("-").map(Number);
                    return new Date(yy, (mm ?? 1) - 1, dd ?? 1).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    });
                  })()}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {autoCombinePreview !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-[#fafafa]">
                        {autoCombineSummary}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAutoCombinePreview(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white/40"
                      >
                        Cancel
                      </button>
                      {autoCombinePreview.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAutoCombineConfirm}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#98935c] text-white hover:bg-[#7d7848]"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  )}
                  {autoCombinePreview === null && tradesForSelectedDate.length >= 2 && (
                    <button
                      type="button"
                      onClick={handleAutoCombinePreview}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#98935c]/10 text-[#2e2e2e] dark:text-[#fafafa] hover:bg-[#98935c]/20 border border-[#98935c]/30 transition-colors"
                      aria-label="Auto-combine overlapping trades"
                    >
                      <LucideMerge className="w-4 h-4" />
                      Auto-combine
                    </button>
                  )}
                  {autoCombinePreview === null && selectedForCombine.size >= 2 && (
                    <button
                      type="button"
                      onClick={handleCombineSelected}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#98935c]/20 text-[#2e2e2e] dark:text-[#fafafa] hover:bg-[#98935c]/30 transition-colors"
                    >
                      <LucideMerge className="w-4 h-4" />
                      Combine {selectedForCombine.size} trades
                    </button>
                  )}
                  {autoCombinePreview === null && tradesForSelectedDate.length > 0 && !confirmClearDay && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearDay(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[#f43636] hover:bg-[#f43636]/10 border border-transparent hover:border-[#f43636]/30 transition-colors"
                      aria-label="Clear all trades on this day"
                    >
                      <LucideTrash2 className="w-4 h-4" />
                      Clear day
                    </button>
                  )}
                  {confirmClearDay && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1aa]">
                        Delete all {tradesForSelectedDate.length} trades on this day?
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmClearDay(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white/40"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDay}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f43636] text-white hover:bg-[#d62929]"
                      >
                        Delete all
                      </button>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa]">
                    {tradesForSelectedDate.length} Trades
                  </span>
                </div>
              </div>
              {tradesForSelectedDate.length === 0 ? (
                <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No trades recorded.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 dark:text-[#a1a1aa] mb-3">
                    {autoCombinePreview !== null
                      ? "Review the groups below. Each box will become a single combined trade when you click Confirm."
                      : "Select two or more trades (e.g. same position with multiple take-profits) to combine P&L into one."}
                  </p>
                  {(() => {
                    const renderTradeCard = (t: CalendarTrade) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTrade(t)}
                        className={`relative p-4 pl-10 rounded-xl cursor-pointer border transition-colors ${selectedForCombine.has(t.id) ? "border-[#98935c] bg-[#98935c]/10" : "border-transparent hover:bg-white/50 dark:hover:bg-[#3f3f46]"} ${t.pnl >= 0 ? "hover:border-[#42bda8]/30" : "hover:border-[#f43636]/30"}`}
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleSelectForCombine(e, t.id)}
                          className="absolute left-3 top-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: selectedForCombine.has(t.id) ? COLORS.accent : "#9ca3af",
                            backgroundColor: selectedForCombine.has(t.id) ? COLORS.accent : "transparent",
                          }}
                          aria-label={selectedForCombine.has(t.id) ? "Deselect for combine" : "Select for combine"}
                        >
                          {selectedForCombine.has(t.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-lg text-[#2e2e2e] dark:text-[#fafafa]">{formatSymbolDisplay(t.instrument)}</span>
                          <span
                            className="font-medium"
                            style={{ color: t.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                          >
                            {formatPnl(t.pnl, 2)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa]">
                          {formatEtTime(t.entryTime)} - {formatEtTime(t.exitTime)}
                        </div>
                      </div>
                    );

                    if (autoCombinePreview !== null) {
                      const groupedIds = new Set(autoCombinePreview.flat().map((t) => t.id));
                      const ungrouped = tradesForSelectedDate.filter((t) => !groupedIds.has(t.id));
                      return (
                        <div className="flex flex-col gap-5">
                          {autoCombinePreview.map((group, idx) => {
                            const first = group[0];
                            const sideLabel = first.isLong === undefined ? "" : first.isLong ? " long" : " short";
                            const groupPnL = group.reduce((s, t) => s + t.pnl, 0);
                            const groupLots = group.reduce((s, t) => s + (Number.isFinite(t.lotSize) ? (t.lotSize as number) : 0), 0);
                            return (
                              <div
                                key={`grp-${idx}`}
                                className="rounded-2xl border-2 border-[#98935c] bg-[#98935c]/10 p-4"
                              >
                                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 px-1">
                                  <div className="flex items-baseline gap-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#98935c]">
                                      Group {idx + 1}
                                    </span>
                                    <span className="font-semibold text-[#2e2e2e] dark:text-[#fafafa]">
                                      {formatSymbolDisplay(first.instrument)}{sideLabel}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-[#a1a1aa]">
                                      {group.length} trades{groupLots > 0 ? ` · ${groupLots} contracts` : ""}
                                    </span>
                                  </div>
                                  <span
                                    className="text-sm font-semibold"
                                    style={{ color: groupPnL >= 0 ? COLORS.profit : COLORS.loss }}
                                  >
                                    {formatPnl(groupPnL, 2)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                  {group.map(renderTradeCard)}
                                </div>
                              </div>
                            );
                          })}
                          {ungrouped.length > 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#3f3f46] p-4 opacity-70">
                              <div className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-3 px-1">
                                Not in any group ({ungrouped.length})
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {ungrouped.map(renderTradeCard)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {tradesForSelectedDate.map(renderTradeCard)}
                      </div>
                    );
                  })()}
                </>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", icon: LucideLayoutDashboard, label: "Dashboard" },
  { id: "flow", icon: LucideBookOpen, label: "Flow" },
  { id: "recap", icon: LucideList, label: "Daily Recap" },
  { id: "calendar", icon: LucideCalendar, label: "Calendar" },
  { id: "strategy", icon: LucideTarget, label: "Strategy" },
  { id: "discipline", icon: LucideBrain, label: "Discipline" },
  { id: "import", icon: LucideUpload, label: "Import Data" },
] as const;

// --- MAIN APP (client-only; params are unwrapped by the server page so the client tree has no Promise props). ---
export default function ClientApp() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  type DashboardStatId = "score" | "profitFactor" | "discipline" | "winLoss";
  const [dashboardStatTooltip, setDashboardStatTooltip] = useState<DashboardStatId | null>(null);

  // Auth: session user or null; authReady when we've checked session once.
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    const nowDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    setIsDark(nowDark);
  };
  // Empty initial state so server and client render the same (avoids hydration error).
  // Load from API (when signed in) or localStorage only after auth is ready.
  const [trades, setTrades] = useState<ReturnType<typeof generateMockTrades>>(() => []);
  const [selectedTrade, setSelectedTrade] = useState<(typeof trades)[0] | null>(null);
  const [coachFocusedTrade, setCoachFocusedTrade] = useState<ReturnType<typeof generateMockTrades>[number] | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  // Selection can be a built-in parser id ("universal" | "tradovate" | ...) or a saved template id ("tpl_...").
  const [importBroker, setImportBroker] = useState<string>("universal");
  const [importTemplates, setImportTemplates] = useState<ImportTemplate[]>([]);
  const [mappingModal, setMappingModal] = useState<{
    csv: CsvData;
    initialMapping: ImportMapping;
    confidence?: FieldConfidence;
    missing?: TradeField[];
    brokerTag: string;
  } | null>(null);
  const [quote, setQuote] = useState(MARK_DOUGLAS_QUOTES[0]);
  useEffect(() => {
    setQuote(MARK_DOUGLAS_QUOTES[Math.floor(Math.random() * MARK_DOUGLAS_QUOTES.length)]);
  }, []);

  // Auth: use API as source of truth so session works after refresh and across devices (server has cookies).
  useEffect(() => {
    let mounted = true;
    fetch("/api/user-data", { credentials: "include" })
      .then((res) => {
        if (!mounted) return;
        if (res.ok) return res.json();
        if (res.status === 401) return null;
        return Promise.reject(new Error("Failed to load"));
      })
      .then((data) => {
        if (!mounted) return;
        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email });
          if (Array.isArray(data.trades)) setTrades(data.trades);
          if (data.discipline_notes && typeof data.discipline_notes === "object") setDisciplineNotes(data.discipline_notes);
          if (Array.isArray(data.models)) setModels(data.models);
          if (Array.isArray(data.import_templates)) setImportTemplates(data.import_templates as ImportTemplate[]);
          if (Array.isArray(data.flow_templates)) setFlowTemplates(data.flow_templates as FlowTemplate[]);
          if (Array.isArray(data.flow_submissions)) setFlowSubmissions(data.flow_submissions as FlowSubmission[]);
          if (data.theme === "dark" || data.theme === "light") {
            document.documentElement.classList.toggle("dark", data.theme === "dark");
            setIsDark(data.theme === "dark");
          }
          setHasImported(!!data.user_has_imported);
          if (data.user_has_imported && typeof localStorage !== "undefined") {
            try {
              localStorage.setItem(USER_HAS_IMPORTED_KEY, "1");
            } catch {
              // ignore
            }
          }
        } else {
          setUser(null);
          const stored = loadTradesFromStorage();
          setTrades(stored && stored.length > 0 ? stored : generateMockTrades());
          if (typeof localStorage !== "undefined") {
            setHasImported(!!localStorage.getItem(USER_HAS_IMPORTED_KEY));
            try {
              const raw = localStorage.getItem("flowstate-import-templates");
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setImportTemplates(parsed as ImportTemplate[]);
              }
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setAuthReady(true);
        if (mounted) setUserDataFetched(true);
      });
    const supabase = createSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) setUser({ id: session.user.id, email: session.user.email ?? undefined });
      else setUser(null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [userDataFetched, setUserDataFetched] = useState(false);
  // Server-authoritative flag for whether the user has ever imported a CSV.
  // Falls back to localStorage when signed out. Drives the "first import replaces, later imports merge" decision.
  const [hasImported, setHasImported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(USER_HAS_IMPORTED_KEY);
  });

  const [chartTimeframe, setChartTimeframe] = useState("ALL");

  // --- MODEL FRAMEWORKS (Models tab) ---
  type ModelSection = {
    id: string;
    label: string;
    value: string;
  };

  type TradingModel = {
    id: string;
    name: string;
    iconId: string;
    sections: ModelSection[];
    createdAt: number;
  };

  const MODEL_STORAGE_KEY = "flowstate-models";

  function loadModelsFromStorage(): TradingModel[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(MODEL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  function saveModelsToStorage(models: TradingModel[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models));
    } catch {
      // ignore
    }
  }

  const [models, setModels] = useState<TradingModel[]>(() => loadModelsFromStorage());
  const [expandedModelId, setExpandedModelId] = useState<string | "new" | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const [draftModelName, setDraftModelName] = useState("");
  const [draftIconId, setDraftIconId] = useState("target");
  const [draftContext, setDraftContext] = useState("");
  const [draftEntry, setDraftEntry] = useState("");
  const [draftRisk, setDraftRisk] = useState("");

  const optionalSectionTemplates: { id: string; label: string; placeholder: string }[] = [
    {
      id: "marketConditions",
      label: "Market Conditions",
      placeholder: "9:30–11:00 AM EST, trending conditions",
    },
    {
      id: "htfBias",
      label: "Higher Timeframe Bias",
      placeholder: "Either (with confirmation)",
    },
    {
      id: "keyLevels",
      label: "Key Levels",
      placeholder:
        "Order blocks from 15m/1H timeframes, previous day high/low, institutional levels, liquidity pools around key levels.",
    },
    {
      id: "confirmationRequirements",
      label: "Confirmation Requirements",
      placeholder:
        "1. HTF trend alignment\n2. Volume spike on entry candle\n3. Clean structure (no overlapping candles)\n4. Time of day within playbook window",
    },
    {
      id: "profitTarget",
      label: "Profit Target",
      placeholder: "2:1 R/R minimum",
    },
    {
      id: "trailingStop",
      label: "Trailing Stop",
      placeholder: "Move to BE at 1R, trail at swing highs/lows or structure pivots.",
    },
    {
      id: "exitStrategy",
      label: "Exit Strategy",
      placeholder:
        "Scale out 50% at 1.5R, let remainder run to next key level. Exit on clear reversal signal or before major news.",
    },
  ];

  const [enabledOptionalSections, setEnabledOptionalSections] = useState<Record<string, boolean>>({});
  const [optionalSectionValues, setOptionalSectionValues] = useState<Record<string, string>>({});

  const [customSections, setCustomSections] = useState<Array<{ id: string; label: string; value: string }>>([]);

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const [disciplineNotes, setDisciplineNotes] = useState<Record<string, string>>(
    () => loadDisciplineNotesFromStorage(),
  );

  // --- FLOW (daily routine & journal) ---
  type FlowQuestionType = "text" | "tags";
  type FlowQuestion = {
    id: string;
    prompt: string;
    type: FlowQuestionType;
  };
  type FlowTemplate = {
    id: string;
    name: string;
    iconId: string;
    questions: FlowQuestion[];
    createdAt: number;
  };
  type FlowAnswerMap = Record<string, string | string[]>;
  type FlowSubmission = {
    id: string;
    templateId: string;
    templateName: string;
    date: string;
    answers: FlowAnswerMap;
    submittedAt: number;
  };
  type FlowDraft = {
    templateId: string;
    date: string;
    answers: FlowAnswerMap;
    updatedAt: number;
  };

  const FLOW_TEMPLATES_KEY = "flowstate-flow-templates";
  const FLOW_SUBMISSIONS_KEY = "flowstate-flow-submissions";
  const FLOW_DRAFTS_KEY = "flowstate-flow-drafts";
  const FLOW_ACTIVE_FILL_KEY = "flowstate-flow-active-fill";

  function readLocalJson<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  function writeLocalJson(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  const [flowTemplates, setFlowTemplates] = useState<FlowTemplate[]>(() =>
    readLocalJson<FlowTemplate[]>(FLOW_TEMPLATES_KEY, []),
  );
  const [flowSubmissions, setFlowSubmissions] = useState<FlowSubmission[]>(() =>
    readLocalJson<FlowSubmission[]>(FLOW_SUBMISSIONS_KEY, []),
  );
  const [flowDrafts, setFlowDrafts] = useState<Record<string, FlowDraft>>(() =>
    readLocalJson<Record<string, FlowDraft>>(FLOW_DRAFTS_KEY, {}),
  );

  const [expandedFlowId, setExpandedFlowId] = useState<string | "new" | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [draftFlowName, setDraftFlowName] = useState("");
  const [draftFlowIconId, setDraftFlowIconId] = useState("brain");
  const [draftFlowQuestions, setDraftFlowQuestions] = useState<FlowQuestion[]>([]);

  const [activeFlowFillId, setActiveFlowFillId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(FLOW_ACTIVE_FILL_KEY);
    } catch {
      return null;
    }
  });
  const [expandedFlowSubmissionId, setExpandedFlowSubmissionId] = useState<string | null>(null);
  const [flowTagDraftInput, setFlowTagDraftInput] = useState<Record<string, string>>({});

  // Persist trades to localStorage whenever they change
  useEffect(() => {
    saveTradesToStorage(trades);
  }, [trades]);

  useEffect(() => {
    saveDisciplineNotesToStorage(disciplineNotes);
  }, [disciplineNotes]);

  useEffect(() => {
    saveModelsToStorage(models);
  }, [models]);

  useEffect(() => {
    writeLocalJson(FLOW_TEMPLATES_KEY, flowTemplates);
  }, [flowTemplates]);

  useEffect(() => {
    writeLocalJson(FLOW_SUBMISSIONS_KEY, flowSubmissions);
  }, [flowSubmissions]);

  useEffect(() => {
    writeLocalJson(FLOW_DRAFTS_KEY, flowDrafts);
  }, [flowDrafts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activeFlowFillId) localStorage.setItem(FLOW_ACTIVE_FILL_KEY, activeFlowFillId);
      else localStorage.removeItem(FLOW_ACTIVE_FILL_KEY);
    } catch {
      // ignore
    }
  }, [activeFlowFillId]);

  // Prune stale drafts (different ET day) on mount.
  useEffect(() => {
    const today = formatEtDayKey(Date.now());
    setFlowDrafts((prev) => {
      let changed = false;
      const next: Record<string, FlowDraft> = {};
      for (const [tid, draft] of Object.entries(prev)) {
        if (draft.date === today) next[tid] = draft;
        else changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("flowstate-import-templates", JSON.stringify(importTemplates));
    } catch {
      // ignore
    }
  }, [importTemplates]);

  // Debounced save to API when signed in (must be after disciplineNotes/models are declared).
  // Data (trades/notes/models/hasImported) and theme are saved separately so a dark-mode toggle
  // doesn't re-upload the full trades blob.
  const saveToApiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (!user || !userDataFetched) return;
    const payload = JSON.stringify({
      trades,
      discipline_notes: disciplineNotes,
      models,
      user_has_imported: hasImported,
      import_templates: importTemplates,
      flow_templates: flowTemplates,
      flow_submissions: flowSubmissions,
    });
    if (payload === lastSavedRef.current) return;
    if (saveToApiRef.current) clearTimeout(saveToApiRef.current);
    saveToApiRef.current = setTimeout(() => {
      saveToApiRef.current = null;
      fetch("/api/user-data", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
        .then(async (res) => {
          if (res.ok) {
            lastSavedRef.current = payload;
            setSaveError("");
          } else {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
          }
        })
        .catch((err) => {
          console.error("Failed to save to database:", err);
          setSaveError(`Failed to save to database: ${err.message}. Your changes are only saved locally.`);
          setTimeout(() => setSaveError(""), 8000);
        });
    }, 1500);
    return () => {
      if (saveToApiRef.current) clearTimeout(saveToApiRef.current);
    };
  }, [user?.id, userDataFetched, trades, disciplineNotes, models, hasImported, importTemplates, flowTemplates, flowSubmissions]);

  // Theme-only save: tiny payload, fires only when isDark changes.
  const lastSavedThemeRef = useRef<string>("");
  useEffect(() => {
    if (!user || !userDataFetched) return;
    const theme = isDark ? "dark" : "light";
    if (theme === lastSavedThemeRef.current) return;
    lastSavedThemeRef.current = theme;
    fetch("/api/user-data", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    }).catch((err) => console.error("Failed to save theme:", err));
  }, [user?.id, userDataFetched, isDark]);

  const resetDraftModel = () => {
    setDraftModelName("");
    setDraftIconId("target");
    setDraftContext("");
    setDraftEntry("");
    setDraftRisk("");
    setEnabledOptionalSections({});
    setOptionalSectionValues({});
    setCustomSections([]);
    setEditingModelId(null);
  };

  const loadDraftFromModel = (model: TradingModel) => {
    setDraftModelName(model.name);
    setDraftIconId(model.iconId in MODEL_ICONS ? model.iconId : "target");
    const contextSec = model.sections.find((s) => s.id === "context");
    const entrySec = model.sections.find((s) => s.id === "entry");
    const riskSec = model.sections.find((s) => s.id === "risk");
    setDraftContext(contextSec?.value ?? "");
    setDraftEntry(entrySec?.value ?? "");
    setDraftRisk(riskSec?.value ?? "");
    const enabled: Record<string, boolean> = {};
    const values: Record<string, string> = {};
    optionalSectionTemplates.forEach((tpl) => {
      const sec = model.sections.find((s) => s.id === tpl.id);
      if (sec) {
        enabled[tpl.id] = true;
        values[tpl.id] = sec.value ?? "";
      }
    });
    setEnabledOptionalSections(enabled);
    setOptionalSectionValues(values);
    const custom = model.sections
      .filter((s) => s.id === "custom")
      .map((s, i) => ({ id: `c_${Date.now()}_${i}`, label: s.label, value: s.value }));
    setCustomSections(custom);
    setEditingModelId(model.id);
  };

  const handleSaveModel = () => {
    const name = draftModelName.trim();
    if (!name) return;

    const baseSections: ModelSection[] = [
      { id: "context", label: "Context & Setup", value: draftContext.trim() },
      { id: "entry", label: "Entry", value: draftEntry.trim() },
      { id: "risk", label: "Risk", value: draftRisk.trim() },
    ];

    const optionalSections: ModelSection[] = optionalSectionTemplates
      .filter((tpl) => enabledOptionalSections[tpl.id])
      .map((tpl) => ({
        id: tpl.id,
        label: tpl.label,
        value: (optionalSectionValues[tpl.id] ?? "").trim(),
      }));

    const custom: ModelSection[] = customSections
      .map((c) => ({
        id: "custom",
        label: c.label.trim() || "Custom Input",
        value: c.value.trim(),
      }))
      .filter((c) => c.value);

    const existing = editingModelId ? models.find((m) => m.id === editingModelId) : null;
    const model: TradingModel = {
      id: existing?.id ?? `mdl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      iconId: draftIconId,
      sections: [...baseSections, ...optionalSections, ...custom],
      createdAt: existing?.createdAt ?? Date.now(),
    };

    if (editingModelId) {
      setModels((prev) => prev.map((m) => (m.id === editingModelId ? model : m)));
    } else {
      setModels((prev) => [model, ...prev]);
    }
    resetDraftModel();
    setExpandedModelId(model.id);
  };

  const handleRemoveModel = (id: string) => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Remove this strategy? Trades tagged with it will keep the strategy name but the strategy will no longer appear in the list.")) return;
    setModels((prev) => prev.filter((m) => m.id !== id));
    if (expandedModelId === id) setExpandedModelId(null);
    setEditingModelId((prev) => (prev === id ? null : prev));
  };

  // --- FLOW handlers ---
  const resetDraftFlow = () => {
    setDraftFlowName("");
    setDraftFlowIconId("brain");
    setDraftFlowQuestions([]);
    setEditingFlowId(null);
  };

  const loadDraftFromFlowTemplate = (template: FlowTemplate) => {
    setDraftFlowName(template.name);
    setDraftFlowIconId(template.iconId in MODEL_ICONS ? template.iconId : "brain");
    setDraftFlowQuestions(template.questions.map((q) => ({ ...q })));
    setEditingFlowId(template.id);
  };

  const handleSaveFlowTemplate = () => {
    const name = draftFlowName.trim();
    if (!name) return;
    const questions = draftFlowQuestions
      .map((q) => ({ ...q, prompt: q.prompt.trim() }))
      .filter((q) => q.prompt.length > 0);
    if (questions.length === 0) return;

    const existing = editingFlowId ? flowTemplates.find((t) => t.id === editingFlowId) : null;
    const template: FlowTemplate = {
      id: existing?.id ?? `flw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      iconId: draftFlowIconId,
      questions,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (editingFlowId) {
      setFlowTemplates((prev) => prev.map((t) => (t.id === editingFlowId ? template : t)));
    } else {
      setFlowTemplates((prev) => [template, ...prev]);
    }
    resetDraftFlow();
    setExpandedFlowId(null);
  };

  const handleRemoveFlowTemplate = (id: string) => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Remove this Flow? Submitted entries on past days will keep their content but the template will no longer appear in the list.")) return;
    setFlowTemplates((prev) => prev.filter((t) => t.id !== id));
    setFlowDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (expandedFlowId === id) setExpandedFlowId(null);
    if (activeFlowFillId === id) setActiveFlowFillId(null);
    setEditingFlowId((prev) => (prev === id ? null : prev));
  };

  const getFlowDraftOrInit = (templateId: string): FlowDraft => {
    const today = formatEtDayKey(Date.now());
    const existing = flowDrafts[templateId];
    if (existing && existing.date === today) return existing;
    // Seed from today's submission if it exists (allows "resubmit" edit)
    const sub = flowSubmissions.find((s) => s.templateId === templateId && s.date === today);
    return {
      templateId,
      date: today,
      answers: sub ? { ...sub.answers } : {},
      updatedAt: Date.now(),
    };
  };

  const updateFlowAnswer = (templateId: string, questionId: string, value: string | string[]) => {
    setFlowDrafts((prev) => {
      const today = formatEtDayKey(Date.now());
      let base: FlowDraft;
      if (prev[templateId] && prev[templateId].date === today) {
        base = prev[templateId];
      } else {
        // Seed from today's submission if one exists so editing one prompt
        // doesn't wipe unchanged answers when the user resubmits.
        const todaySub = flowSubmissions.find(
          (s) => s.templateId === templateId && s.date === today,
        );
        base = {
          templateId,
          date: today,
          answers: todaySub ? { ...todaySub.answers } : {},
          updatedAt: Date.now(),
        };
      }
      return {
        ...prev,
        [templateId]: {
          ...base,
          answers: { ...base.answers, [questionId]: value },
          updatedAt: Date.now(),
        },
      };
    });
  };

  const handleSubmitFlow = (templateId: string) => {
    const template = flowTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const today = formatEtDayKey(Date.now());
    const draft = flowDrafts[templateId];
    const priorSub = flowSubmissions.find(
      (s) => s.templateId === templateId && s.date === today,
    );
    // Prefer in-progress draft, then prior submission, then empty.
    // Prevents wiping unchanged answers if user reopens a submitted Flow
    // and resubmits without touching every field.
    const answers: FlowAnswerMap =
      draft && draft.date === today
        ? { ...(priorSub?.answers ?? {}), ...draft.answers }
        : priorSub
          ? { ...priorSub.answers }
          : {};
    const submission: FlowSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      templateId,
      templateName: template.name,
      date: today,
      answers,
      submittedAt: Date.now(),
    };
    setFlowSubmissions((prev) => {
      const filtered = prev.filter((s) => !(s.templateId === templateId && s.date === today));
      return [submission, ...filtered];
    });
    setFlowDrafts((prev) => {
      if (!(templateId in prev)) return prev;
      const next = { ...prev };
      delete next[templateId];
      return next;
    });
    setActiveFlowFillId(null);
  };

  const flowSubmissionDateSet = useMemo(
    () => new Set(flowSubmissions.map((s) => s.date)),
    [flowSubmissions],
  );


  const commitParsedTrades = (parsedTrades: ParsedTrade[], brokerTag: string) => {
    if (!parsedTrades.length) {
      throw new Error("No valid trades found in this CSV.");
    }
    parsedTrades.sort((a, b) => a.entryTime - b.entryTime);
    const parsedWithCapital = parsedTrades.map((t) => ({ ...t, capitalAfter: 0 }));
    const isFirstImport = !hasImported;

    if (isFirstImport) {
      let runningCapital = 50000;
      const withCapital = parsedWithCapital.map((t) => {
        runningCapital += t.pnl;
        return { ...t, capitalAfter: runningCapital };
      });
      setTrades(withCapital.reverse() as ReturnType<typeof generateMockTrades>);
      setHasImported(true);
      try {
        localStorage.setItem(USER_HAS_IMPORTED_KEY, "1");
      } catch {
        // ignore
      }
      setImportStatus(`Successfully imported ${parsedTrades.length} trade(s). Pre-populated data cleared.`);
    } else {
      setTrades((prevTrades) => {
        const tradeKeyForMerge = (t: { instrument: string; entryTime: number; exitTime: number }) =>
          `${t.instrument}|${Math.round(t.entryTime / 1000)}|${Math.round(t.exitTime / 1000)}`;
        const isCombined = (t: { id?: string }) => t.id?.startsWith("combined_");
        const kept = prevTrades.filter((t) => !t.tags?.includes(brokerTag) || isCombined(t));
        const existingBrokerTrades = prevTrades.filter((t) => t.tags?.includes(brokerTag) && !isCombined(t));
        const keysConsumedByCombined = new Set<string>(
          kept.flatMap((t) => (isCombined(t) && t.combinedFromKeys ? t.combinedFromKeys : []))
        );
        // Keys belonging to OTHER brokers' trades — never overwrite or duplicate these.
        const otherBrokerKeys = new Set<string>(
          kept.filter((t) => !isCombined(t)).map((t) => tradeKeyForMerge(t))
        );
        const brokerMap = new Map<string, (typeof parsedWithCapital)[0]>();
        for (const t of existingBrokerTrades) {
          brokerMap.set(tradeKeyForMerge(t), { ...t, capitalAfter: 0 } as (typeof parsedWithCapital)[0]);
        }
        for (const t of parsedWithCapital) {
          const key = tradeKeyForMerge(t);
          if (keysConsumedByCombined.has(key)) continue;
          if (otherBrokerKeys.has(key)) continue;
          brokerMap.set(key, { ...t });
        }
        const mergedBroker = Array.from(brokerMap.values());
        const combined = [...kept, ...mergedBroker].sort((a, b) => a.entryTime - b.entryTime);

        let runningCapital = 50000;
        const withCapital = combined.map((t) => {
          runningCapital += t.pnl;
          return { ...t, capitalAfter: runningCapital };
        });

        return withCapital.reverse() as ReturnType<typeof generateMockTrades>;
      });
      setImportStatus(`Successfully imported ${parsedTrades.length} trade(s). Previous data kept and merged.`);
    }
    setTimeout(() => setImportStatus(""), 4000);
  };

  /** Resolve the selected import option to a parser + tag + optional template. */
  const resolveImportSelection = (selection: string) => {
    const tpl = importTemplates.find((t) => t.id === selection);
    if (tpl) return { kind: "template" as const, template: tpl, tag: tpl.name };
    const parser = getParser(selection) ?? universalParser;
    return { kind: "parser" as const, parser, tag: IMPORT_TAG_BY_ID[parser.id] ?? `${parser.label} Import` };
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sel = resolveImportSelection(importBroker);
    const label = sel.kind === "template" ? sel.template.name : sel.parser.label;
    setImportStatus(`Parsing ${label} CSV...`);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) ?? "";
        // Pick delimiter: template/parser-defined first, then sniff.
        const explicitDelimiter =
          sel.kind === "template" ? sel.template.mapping.delimiter : sel.parser.delimiter;
        const delimiter = explicitDelimiter ?? detectDelimiter(text);
        const csv = libParseCsvText(text, delimiter);
        if (!csv.headers.length || !csv.rows.length) throw new Error("File empty or missing data rows.");

        // Template path: validate fingerprint matches; if not, fall through to auto-detect.
        if (sel.kind === "template") {
          if (headerFingerprint(csv.headers) === sel.template.fingerprint) {
            const trades = parseWithMapping(csv, sel.template.mapping, { tag: sel.tag });
            commitParsedTrades(trades, sel.tag);
            return;
          }
          // fingerprint mismatch -> fall back to auto-detect with a notice
          setImportStatus(`Template "${sel.template.name}" headers don't match this file — auto-detecting...`);
        }

        // Universal / auto-detect path: detect, then either parse or open the mapping modal.
        if (sel.kind === "template" || sel.parser.id === "universal") {
          const detected = autoDetectMapping(csv);
          if (detected.ready) {
            const trades = parseWithMapping(csv, detected.mapping, { tag: sel.tag });
            commitParsedTrades(trades, sel.tag);
          } else {
            setImportStatus("");
            setMappingModal({
              csv,
              initialMapping: { ...detected.mapping, delimiter },
              confidence: detected.confidence,
              missing: detected.missing,
              brokerTag: sel.tag,
            });
          }
          return;
        }

        // Dedicated broker parser path.
        const trades = sel.parser.parse(csv, { tag: sel.tag });
        commitParsedTrades(trades, sel.tag);
      } catch (err) {
        setImportStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        setTimeout(() => setImportStatus(""), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Split into separate memos: best/worst is one O(n) pass per trade change; the 30-day
  // window subsets are stable across most trade edits and can be cached independently.
  const tradeWindows = useMemo(() => {
    const now = Date.now();
    const ms30 = 30 * 86400000;
    const current30: typeof trades = [];
    const prior30: typeof trades = [];
    let bestTrade: (typeof trades)[number] | null = null;
    let worstTrade: (typeof trades)[number] | null = null;
    for (const t of trades) {
      if (t.entryTime >= now - ms30) current30.push(t);
      else if (t.entryTime >= now - ms30 * 2) prior30.push(t);
      if (!bestTrade || t.pnl > bestTrade.pnl) bestTrade = t;
      if (!worstTrade || t.pnl < worstTrade.pnl) worstTrade = t;
    }
    return { current30, prior30, bestTrade, worstTrade };
  }, [trades]);

  const metrics = useMemo(() => {
    const result = computeMetricsFromTrades(trades, flowSubmissionDateSet);
    if (!result) return null;

    const currentM = computeMetricsFromTrades(tradeWindows.current30, flowSubmissionDateSet);
    const priorM = computeMetricsFromTrades(tradeWindows.prior30, flowSubmissionDateSet);
    const hasPriorData = !!(priorM && priorM.totalTrades > 0 && currentM && currentM.totalTrades > 0);
    const trends = {
      hasPrevData: hasPriorData,
      score: hasPriorData ? currentM!.score - priorM!.score : 0,
      profitFactor: hasPriorData ? currentM!.profitFactor - priorM!.profitFactor : 0,
      disciplineScore: hasPriorData ? currentM!.disciplineScore - priorM!.disciplineScore : 0,
    };

    return {
      ...result,
      bestTrade: tradeWindows.bestTrade!,
      worstTrade: tradeWindows.worstTrade!,
      trends,
    };
  }, [trades, tradeWindows]);

  const filteredChartData = useMemo(() => {
    if (!trades.length) return { data: [] as { time: number; value: number }[], isPositive: true, currentNet: 0 };

    const sorted = [...trades].sort((a, b) => a.entryTime - b.entryTime);
    const now = new Date().getTime();
    let cutoff = 0;

    switch (chartTimeframe) {
      case "1W":
        cutoff = now - 7 * 86400000;
        break;
      case "1M":
        cutoff = now - 30 * 86400000;
        break;
      case "3M":
        cutoff = now - 90 * 86400000;
        break;
      case "YTD":
        cutoff = new Date(new Date().getFullYear(), 0, 1).getTime();
        break;
      case "ALL":
      default:
        cutoff = 0;
        break;
    }

    const periodTrades = sorted.filter((t) => t.entryTime >= cutoff);
    let netProfit = 0;

    const data = periodTrades.map((t) => {
      netProfit += t.pnl;
      return { time: t.entryTime, value: netProfit };
    });

    if (data.length > 0 && chartTimeframe !== "ALL") {
      data.unshift({ time: cutoff, value: 0 });
    } else if (data.length > 0 && chartTimeframe === "ALL") {
      data.unshift({ time: sorted[0].entryTime - 86400000, value: 0 });
    }

    const isPositive = data.length > 0 ? data[data.length - 1].value >= 0 : true;

    return { data, isPositive, currentNet: netProfit };
  }, [trades, chartTimeframe]);

  const renderSidebar = () => (
    <div
      className={`hidden md:flex ${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 h-screen sticky top-0 bg-white/30 dark:bg-[#27272a] backdrop-blur-xl border-r border-white/50 dark:border-[#3f3f46] flex-col px-4 pb-[16px] pt-[16px] shrink-0 z-20`}
    >
      <div className="flex justify-center pt-1 pb-2">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-500 dark:text-[#a1a1aa] hover:text-[#2e2e2e] dark:hover:text-[#fafafa] transition-colors"
          title="Toggle Sidebar"
        >
          {sidebarOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
        </button>
      </div>
      <div className="flex flex-col gap-4 mb-8 mt-2">
        <div className="w-full relative h-10 min-h-[2.5rem] flex items-center">
          {sidebarOpen ? (
            <div className="relative w-full h-full">
              <Image
                src="/FLOWSTATE.svg"
                alt="Flowstate"
                fill
                className="object-contain object-left dark:brightness-0 dark:invert"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex justify-center">
              <Image
                src="/FLOWSTATE%20Icon.svg"
                alt="Flowstate"
                fill
                className="object-contain dark:brightness-0 dark:invert"
              />
            </div>
          )}
        </div>
      </div>

      <nav className="flex flex-col space-y-3 flex-1 min-h-0">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center p-3 rounded-xl transition-all ${activeTab === item.id ? "bg-[#98935c]/20 shadow-inner" : "hover:bg-white/40 dark:hover:bg-[#3f3f46]"}`}
          >
            <span style={{ color: activeTab === item.id ? COLORS.accent : "#6b7280" }}>
              <IconComponent size={20} strokeWidth={2} />
            </span>
            {sidebarOpen && <span className="ml-4 font-medium whitespace-nowrap">{item.label}</span>}
          </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 relative flex flex-col gap-2">
        {/* Auth: Sign in with Google / Sign out */}
        <div className={`flex items-center gap-2 ${sidebarOpen ? "flex-row" : "flex-col"}`}>
          {!authReady ? (
            <span className="text-xs text-gray-500 dark:text-[#a1a1aa] py-2">Loading…</span>
          ) : user ? (
            <button
              type="button"
              onClick={() => createSupabaseClient().auth.signOut()}
              className={`flex items-center flex-1 min-w-0 w-full ${sidebarOpen ? "justify-start px-4" : "justify-center"} py-2.5 rounded-xl border border-white/60 dark:border-[#3f3f46] bg-white/30 dark:bg-[#3f3f46] text-sm font-medium text-[#2e2e2e] dark:text-[#fafafa] hover:bg-white/50 dark:hover:bg-[#52525b] transition-all`}
            >
              <LucideLogOut size={18} strokeWidth={2} />
              {sidebarOpen && <span className="ml-3 truncate">{user.email ?? "Sign out"}</span>}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                createSupabaseClient().auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback` },
                });
              }}
              className={`flex items-center flex-1 min-w-0 w-full ${sidebarOpen ? "justify-start px-4" : "justify-center"} py-2.5 rounded-xl bg-[#2e2e2e] text-white hover:bg-black transition-all text-sm font-medium shadow-md dark:bg-[#3f3f46] dark:hover:bg-[#52525b] dark:text-[#fafafa]`}
            >
              <LucideLogIn size={18} strokeWidth={2} />
              {sidebarOpen && <span className="ml-3 whitespace-nowrap">Sign in with Google</span>}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="self-center p-2 text-gray-500 dark:text-[#a1a1aa] hover:text-[#2e2e2e] dark:hover:text-[#fafafa] transition-colors"
        >
          {isDark ? <LucideSun size={22} strokeWidth={2} /> : <LucideMoon size={22} strokeWidth={2} />}
        </button>
        {saveError && (
          <div className="absolute bottom-full left-0 w-full mb-2 z-50 bg-red-500/90 text-white backdrop-blur-md shadow-lg border border-red-400 rounded-lg p-2 text-xs text-center">
            {saveError}
          </div>
        )}
        {importStatus && activeTab !== "import" && (
          <div
            className={`absolute bottom-full left-0 w-full mb-2 z-50 bg-white/90 backdrop-blur-md shadow-lg border border-white/60 rounded-lg p-2 text-xs text-center dark:bg-[#27272a] dark:border-[#3f3f46]`}
          >
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileNav = () => (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-white/30 dark:bg-[#27272a] backdrop-blur-xl border-b border-white/50 dark:border-[#3f3f46] shrink-0">
        <div className="relative w-8 h-8">
          <Image src="/FLOWSTATE%20Icon.svg" alt="Flowstate" fill className="object-contain object-left dark:brightness-0 dark:invert" />
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-[#3f3f46] text-gray-600 dark:text-[#a1a1aa] aria-pressed:bg-white/50 dark:aria-pressed:bg-[#3f3f46]"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <LucideMenu size={24} strokeWidth={2} />
        </button>
      </header>
      {mobileMenuOpen && (
        <>
          <div
            className="fixed top-14 left-0 right-0 bottom-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto md:hidden bg-white/95 dark:bg-[#27272a] backdrop-blur-xl border-b border-white/60 dark:border-[#3f3f46] shadow-lg flex flex-col">
            <nav className="flex flex-col p-4 gap-1 flex-1 min-h-0">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center p-3 rounded-xl transition-all text-left ${activeTab === item.id ? "bg-[#98935c]/20 shadow-inner" : "hover:bg-white/60 dark:hover:bg-[#3f3f46]"}`}
                  >
                    <span style={{ color: activeTab === item.id ? COLORS.accent : "#6b7280" }}>
                      <IconComponent size={20} strokeWidth={2} />
                    </span>
                    <span className="ml-4 font-medium">{item.label}</span>
                  </button>
                );
              })}
              {authReady && (
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/50 dark:border-[#3f3f46]">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        createSupabaseClient().auth.signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white/30 dark:bg-[#3f3f46] text-sm font-medium text-[#2e2e2e] dark:text-[#fafafa]"
                    >
                      <LucideLogOut size={18} className="mr-3 shrink-0" /> <span className="truncate">{user.email ?? "Sign out"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        createSupabaseClient().auth.signInWithOAuth({
                          provider: "google",
                          options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback` },
                        });
                      }}
                      className="flex items-center flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-[#2e2e2e] text-white text-sm font-medium dark:bg-[#3f3f46] dark:text-[#fafafa]"
                    >
                      <LucideLogIn size={18} className="mr-3 shrink-0" /> Sign in with Google
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-[#2e2e2e] text-white hover:bg-black transition-all dark:bg-[#3f3f46] dark:hover:bg-[#52525b] dark:text-[#fafafa]"
                  >
                    {isDark ? <LucideSun size={20} strokeWidth={2} /> : <LucideMoon size={20} strokeWidth={2} />}
                  </button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );

  const renderImportData = () => (
    <div className="space-y-8 fade-in pb-12 max-w-2xl">
      <div>
        <h2 className="display-font text-4xl md:text-5xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight">Import Data</h2>
        <p className="text-sm text-gray-500 dark:text-[#a1a1aa] mt-2">
          Import your trade history from a broker CSV. Select your broker below, then choose your export file.
        </p>
      </div>

      <div className="rounded-2xl bg-white/30 dark:bg-[#27272a] border border-white/50 dark:border-[#3f3f46] p-6 space-y-6">
        <h3 className="text-lg font-semibold text-[#2e2e2e] dark:text-[#fafafa]">Instructions</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-[#a1a1aa]">
          <li>Export your account activity or trade history from your broker as a <strong className="text-[#2e2e2e] dark:text-[#e5e7eb]">CSV file</strong>.</li>
          <li>Leave the dropdown on <strong className="text-[#2e2e2e] dark:text-[#e5e7eb]">Auto-detect</strong> for most brokers — we&apos;ll match columns automatically. If detection is uncertain you&apos;ll get a quick column-mapping screen, and you can save the mapping as a template for next time.</li>
          <li><strong className="text-[#2e2e2e] dark:text-[#e5e7eb]">Tradovate / DeepCharts:</strong> simple one-row-per-trade exports; the built-in parsers (or Auto-detect) work out of the box.</li>
          <li><strong className="text-[#2e2e2e] dark:text-[#e5e7eb]">Robinhood:</strong> use the Activity CSV. Only options and futures trades (BTO, STO, STC, BTC) are imported and grouped into round-trip trades (FIFO) — select the Robinhood parser explicitly for this one.</li>
          <li>After importing, your first import replaces any demo data; later imports are merged with your existing trades.</li>
        </ul>

        <div className="flex flex-col gap-4 pt-2">
          <label htmlFor="import-broker-select" className="text-sm font-medium text-[#2e2e2e] dark:text-[#e5e7eb]">
            Broker
          </label>
          <select
            id="import-broker-select"
            value={importBroker}
            onChange={(ev) =>
              setImportBroker(ev.target.value)
            }
            className="w-full max-w-xs rounded-xl border border-white/60 dark:border-[#3f3f46] bg-white/50 dark:bg-[#3f3f46] px-4 py-3 text-[#111827] dark:text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#98935c]"
          >
            <optgroup label="Auto-detect">
              <option value="universal">Auto-detect (any broker)</option>
            </optgroup>
            <optgroup label="Built-in parsers">
              <option value="tradovate">Tradovate</option>
              <option value="robinhood">Robinhood</option>
              <option value="deepcharts">DeepCharts</option>
            </optgroup>
            {importTemplates.length > 0 && (
              <optgroup label="Saved templates">
                {importTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          {importBroker.startsWith("tpl_") && (
            <button
              type="button"
              onClick={() => {
                setImportTemplates((prev) => prev.filter((t) => t.id !== importBroker));
                setImportBroker("universal");
              }}
              className="self-start text-xs text-red-600 hover:underline"
            >
              Delete this template
            </button>
          )}

          <div>
            <label htmlFor="csv-upload-page" className="text-sm font-medium text-[#2e2e2e] dark:text-[#e5e7eb] block mb-2">
              CSV file
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload-page"
            />
            <label
              htmlFor="csv-upload-page"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2e2e2e] dark:bg-[#3f3f46] text-white dark:text-[#fafafa] cursor-pointer hover:bg-black dark:hover:bg-[#52525b] transition-all text-sm font-medium shadow-md"
            >
              <Icons.Upload /> Choose file
            </label>
          </div>

          {importStatus && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                importStatus.startsWith("Error")
                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  : "bg-[#98935c]/15 dark:bg-[#98935c]/20 text-[#2e2e2e] dark:text-[#e5e7eb]"
              }`}
            >
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-10 fade-in pb-12">
      <div className="mb-4">
        <h2 className="display-font text-4xl md:text-6xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-[#a1a1aa] italic mt-4 border-l-2 border-[#98935c] pl-4 font-light">
          &quot;{quote}&quot; <span className="font-semibold">— Mark Douglas</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40 dark:hover:bg-[#3f3f46]"
          onMouseEnter={() => !isMobile && setDashboardStatTooltip("score")}
          onMouseLeave={() => !isMobile && setDashboardStatTooltip(null)}
          onClick={() => isMobile && setDashboardStatTooltip((id) => (id === "score" ? null : "score"))}
          role={isMobile ? "button" : undefined}
          tabIndex={isMobile ? 0 : undefined}
          onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDashboardStatTooltip((id) => (id === "score" ? null : "score")); } } : undefined}
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Trader Score
            {isMobile && (
              <span className="ml-1.5 text-gray-400 font-normal">(tap for breakdown)</span>
            )}
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {(metrics?.score ?? 0).toFixed(1)}
          </div>
          {metrics?.trends?.hasPrevData && (
            <div
              className="mt-3 text-[11px] font-semibold tracking-wide"
              style={{ color: (metrics.trends?.score ?? 0) >= 0 ? COLORS.profit : COLORS.loss }}
            >
              {(metrics.trends?.score ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(metrics.trends?.score ?? 0).toFixed(1)} VS
              PRIOR 30D
            </div>
          )}
          <div
            className={`absolute top-[105%] left-0 w-64 bg-white/95 dark:bg-[#27272a] backdrop-blur-xl border border-white/80 dark:border-[#3f3f46] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 transition-all duration-200 ${
              dashboardStatTooltip === "score" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
            }`}
          >
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3 border-b border-gray-200 dark:border-[#3f3f46] pb-2">
              Score Breakdown
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa]">Profit Factor (Max 40)</span>
                <span className="text-sm font-semibold text-[#2e2e2e] dark:text-[#fafafa]">
                  {(metrics?.components.pfComponent ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa]">Discipline (Max 40)</span>
                <span className="text-sm font-semibold text-[#2e2e2e] dark:text-[#fafafa]">
                  {(metrics?.components.discComponent ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa]">Risk-Adjusted (Max 20)</span>
                <span className="text-sm font-semibold text-[#2e2e2e] dark:text-[#fafafa]">
                  {(metrics?.components.riskAdjComponent ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-[11px] font-light text-gray-500 dark:text-[#a1a1aa] leading-relaxed mt-3 pt-2 border-t border-gray-200 dark:border-[#3f3f46]">
              Total = Profit Factor (PF 1.0→0 pts, 3.0→40 pts) + Discipline (0–100% → 40 pts) + Risk-Adjusted (expectancy vs risk + drawdown, 20 pts max). Score is the sum, capped 0–100.
            </p>
          </div>
        </div>

        <div
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40 dark:hover:bg-[#3f3f46]"
          onMouseEnter={() => !isMobile && setDashboardStatTooltip("profitFactor")}
          onMouseLeave={() => !isMobile && setDashboardStatTooltip(null)}
          onClick={() => isMobile && setDashboardStatTooltip((id) => (id === "profitFactor" ? null : "profitFactor"))}
          role={isMobile ? "button" : undefined}
          tabIndex={isMobile ? 0 : undefined}
          onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDashboardStatTooltip((id) => (id === "profitFactor" ? null : "profitFactor")); } } : undefined}
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Profit Factor
            {isMobile && (
              <span className="ml-1.5 text-gray-400 font-normal">(tap for details)</span>
            )}
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {(metrics?.profitFactor ?? 0).toFixed(2)}
          </div>
          {metrics?.trends?.hasPrevData && (
            <div
              className="mt-3 text-[11px] font-semibold tracking-wide"
              style={{
                color: (metrics.trends?.profitFactor ?? 0) >= 0 ? COLORS.profit : COLORS.loss,
              }}
            >
              {(metrics.trends?.profitFactor ?? 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(metrics.trends?.profitFactor ?? 0).toFixed(2)} VS PRIOR 30D
            </div>
          )}
          <div
            className={`absolute top-[105%] left-0 w-64 bg-white/95 dark:bg-[#27272a] backdrop-blur-xl border border-white/80 dark:border-[#3f3f46] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 transition-all duration-200 ${
              dashboardStatTooltip === "profitFactor" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
            }`}
          >
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3 border-b border-gray-200 dark:border-[#3f3f46] pb-2">
              Calculation
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e] dark:text-[#fafafa]">Gross Profit ÷ Gross Loss</p>
              <p className="text-[11px] font-light text-gray-500 dark:text-[#a1a1aa] leading-relaxed">
                Values greater than 1.0 indicate profitability. A factor above 2.0 is considered
                exceptional institutional performance.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40 dark:hover:bg-[#3f3f46]"
          onMouseEnter={() => !isMobile && setDashboardStatTooltip("discipline")}
          onMouseLeave={() => !isMobile && setDashboardStatTooltip(null)}
          onClick={() => isMobile && setDashboardStatTooltip((id) => (id === "discipline" ? null : "discipline"))}
          role={isMobile ? "button" : undefined}
          tabIndex={isMobile ? 0 : undefined}
          onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDashboardStatTooltip((id) => (id === "discipline" ? null : "discipline")); } } : undefined}
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Discipline Index
            {isMobile && (
              <span className="ml-1.5 text-gray-400 font-normal">(tap for details)</span>
            )}
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {(metrics?.disciplineScore ?? 0).toFixed(0)}%
          </div>
          {metrics?.trends?.hasPrevData && (
            <div
              className="mt-3 text-[11px] font-semibold tracking-wide"
              style={{
                color: (metrics.trends?.disciplineScore ?? 0) >= 0 ? COLORS.profit : COLORS.loss,
              }}
            >
              {(metrics.trends?.disciplineScore ?? 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(metrics.trends?.disciplineScore ?? 0).toFixed(0)}% VS PRIOR 30D
            </div>
          )}
          <div
            className={`absolute top-[105%] left-0 w-64 bg-white/95 dark:bg-[#27272a] backdrop-blur-xl border border-white/80 dark:border-[#3f3f46] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 transition-all duration-200 ${
              dashboardStatTooltip === "discipline" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
            }`}
          >
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3 border-b border-gray-200 dark:border-[#3f3f46] pb-2">
              Measurement
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e] dark:text-[#fafafa]">Three equal factors (⅓ each)</p>
              <p className="text-[11px] font-light text-gray-500 dark:text-[#a1a1aa] leading-relaxed">
                <strong>Risk consistency:</strong> Losses in a tight range (low variance) score higher. &nbsp;
                <strong>Journaling:</strong> Notes, tags, and chart images per trade add to the score. &nbsp;
                <strong>Strength:</strong> Higher trade strength ratings (1–5) across trades improve discipline.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40 dark:hover:bg-[#3f3f46]"
          onMouseEnter={() => !isMobile && setDashboardStatTooltip("winLoss")}
          onMouseLeave={() => !isMobile && setDashboardStatTooltip(null)}
          onClick={() => isMobile && setDashboardStatTooltip((id) => (id === "winLoss" ? null : "winLoss"))}
          role={isMobile ? "button" : undefined}
          tabIndex={isMobile ? 0 : undefined}
          onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDashboardStatTooltip((id) => (id === "winLoss" ? null : "winLoss")); } } : undefined}
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Win / Loss Ratio
            {isMobile && (
              <span className="ml-1.5 text-gray-400 font-normal">(tap for details)</span>
            )}
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] dark:text-[#fafafa] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {metrics ? `${(metrics.winLossRatio as number).toFixed(0)}%` : "--"}
          </div>
          <div
            className={`absolute top-[105%] right-0 w-64 bg-white/95 dark:bg-[#27272a] backdrop-blur-xl border border-white/80 dark:border-[#3f3f46] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 transition-all duration-200 ${
              dashboardStatTooltip === "winLoss" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
            }`}
          >
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3 border-b border-gray-200 dark:border-[#3f3f46] pb-2">
              Measurement
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e] dark:text-[#fafafa]">% of Trades That Were Wins</p>
              <p className="text-[11px] font-light text-gray-500 dark:text-[#a1a1aa] leading-relaxed">
                Win count ÷ total trades, as a percentage. Example: 6 wins and 4 losses out of 10
                trades = 60% win/loss ratio.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => metrics?.bestTrade && setSelectedTrade(metrics.bestTrade)}
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] cursor-pointer hover:bg-white/50 dark:hover:bg-[#3f3f46] transition-colors border border-transparent hover:border-[#42bda8]/30"
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Best Trade
          </div>
          {metrics?.bestTrade ? (
            <div className="flex justify-between items-end">
              <div>
                <div className="text-lg font-semibold text-[#2e2e2e] dark:text-[#fafafa]">{formatSymbolDisplay(metrics.bestTrade.instrument)}</div>
                <div className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa] mt-1">
                  {formatEtShortDate(metrics.bestTrade.entryTime)}
                </div>
              </div>
              <div className="display-font text-5xl tracking-tight" style={{ color: COLORS.profit }}>
                {formatPnl(metrics.bestTrade.pnl, 2)}
              </div>
            </div>
          ) : (
            <div className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No data</div>
          )}
        </div>

        <div
          onClick={() => metrics?.worstTrade && setSelectedTrade(metrics.worstTrade)}
          className="flex flex-col p-6 bg-white/30 dark:bg-[#27272a] rounded-[2rem] cursor-pointer hover:bg-white/50 dark:hover:bg-[#3f3f46] transition-colors border border-transparent hover:border-[#f43636]/30"
        >
          <div className="text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-[0.2em] mb-3">
            Worst Trade
          </div>
          {metrics?.worstTrade ? (
            <div className="flex justify-between items-end">
              <div>
                <div className="text-lg font-semibold text-[#2e2e2e] dark:text-[#fafafa]">
                  {formatSymbolDisplay(metrics.worstTrade.instrument)}
                </div>
                <div className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa] mt-1">
                  {formatEtShortDate(metrics.worstTrade.entryTime)}
                </div>
              </div>
              <div className="display-font text-5xl tracking-tight" style={{ color: COLORS.loss }}>
                {formatPnl(metrics.worstTrade.pnl, 2)}
              </div>
            </div>
          ) : (
            <div className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No data</div>
          )}
        </div>
      </div>

      <div className="h-[450px] w-full p-8 bg-white/30 dark:bg-[#27272a] rounded-[2rem] relative flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-4">
          <div>
            <h3 className="display-font text-3xl text-[#2e2e2e] dark:text-[#fafafa]">Net Profit</h3>
            <div
              className="display-font text-5xl mt-1 tracking-tight"
              style={{ color: filteredChartData.isPositive ? COLORS.profit : COLORS.loss }}
            >
              {formatPnl(filteredChartData.currentNet, 2)}
            </div>
          </div>
          <div className="flex gap-1 bg-white/50 dark:bg-[#3f3f46] p-1 rounded-xl border border-white/60 dark:border-[#3f3f46]">
            {["1W", "1M", "3M", "YTD", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${chartTimeframe === tf ? "bg-[#2e2e2e] dark:bg-[#52525b] text-white dark:text-[#fafafa] shadow-sm" : "text-gray-500 dark:text-[#a1a1aa] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full min-h-0 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredChartData.data}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888", fontFamily: "Inter" }}
                tickFormatter={(t) =>
                  chartTimeframe === "1W"
                    ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(new Date(t))
                    : new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(new Date(t))
                }
                minTickGap={30}
              />
              <YAxis
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888", fontFamily: "Inter" }}
                tickFormatter={(v) => `$${v}`}
                orientation="right"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
                labelStyle={{ color: "#2e2e2e", fontFamily: "Inter" }}
                labelFormatter={(l) => formatEtDateTime(typeof l === "number" ? l : new Date(l).getTime())}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Net Profit"]}
                itemStyle={{ color: COLORS.text, fontWeight: 600, fontFamily: "Inter" }}
              />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" opacity={0.5} />
              <Line
                type="linear"
                dataKey="value"
                stroke={filteredChartData.isPositive ? COLORS.profit : COLORS.loss}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: filteredChartData.isPositive ? COLORS.profit : COLORS.loss,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-center pt-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && !window.confirm("Clear all trades and discipline notes? Your saved strategies will be kept. This cannot be undone." + (user ? " Data will be cleared from your account on all devices." : ""))) return;
            setTrades([]);
            setSelectedTrade(null);
            setDisciplineNotes({});
            try {
              localStorage.removeItem(TRADES_STORAGE_KEY);
              localStorage.removeItem(USER_HAS_IMPORTED_KEY);
              localStorage.removeItem(DISCIPLINE_NOTES_STORAGE_KEY);
            } catch {
              // ignore
            }
            if (user) {
              fetch("/api/user-data", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  trades: [],
                  discipline_notes: {},
                  models,
                  theme: isDark ? "dark" : "light",
                  user_has_imported: false,
                }),
              }).catch(() => {});
            }
          }}
          className="text-xs text-gray-400 dark:text-[#71717a] hover:text-gray-600 dark:hover:text-[#a1a1aa] underline underline-offset-2"
        >
          Clear all data (testing)
        </button>
      </p>
    </div>
  );

  // Most recent day that has at least one trade (so weekends / no-trade days still show last recap).
  // Memoized so reopening the tab or unrelated state changes don't re-sort all trades.
  const recap = useMemo(() => {
    if (trades.length === 0) return { recapDate: null as string | null, recapTrades: [] as typeof trades };
    const byDate = new Map<string, typeof trades>();
    let mostRecent: { date: string; ts: number } | null = null;
    for (const t of trades) {
      const key = formatEtDayKey(t.entryTime);
      const arr = byDate.get(key);
      if (arr) arr.push(t);
      else byDate.set(key, [t]);
      if (!mostRecent || t.entryTime > mostRecent.ts) mostRecent = { date: key, ts: t.entryTime };
    }
    const recapDate = mostRecent?.date ?? null;
    return { recapDate, recapTrades: recapDate ? byDate.get(recapDate) ?? [] : [] };
  }, [trades]);

  const renderDailyRecap = () => {
    const { recapDate, recapTrades } = recap;

    return (
      <div className="flex flex-col gap-8 fade-in">
        <h2 className="display-font text-5xl mb-6 text-[#2e2e2e] dark:text-[#fafafa]">Daily Recap</h2>
        {recapDate && (
          <p className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa] -mt-2 mb-2">
            Showing recap for {(() => {
              const [yy, mm, dd] = recapDate.split("-").map(Number);
              return new Date(yy, (mm ?? 1) - 1, dd ?? 1).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
            })()}
          </p>
        )}
        {/* Desktop: 40% Flow Lab left, 60% Trades right. Mobile: stacked (trades then Flow Lab). */}
        <div className="flex flex-col md:grid md:grid-cols-[40%_1fr] md:gap-8 gap-6 md:items-start">
          <div className="w-full min-w-0 order-2 md:order-1">
            <AICoachPanel
              metrics={metrics}
              trades={recapTrades}
              onPushNote={(note, tradeId) => {
                if (!tradeId && recapTrades.length > 0) tradeId = recapTrades[0].id;
                if (tradeId)
                  setTrades(
                    trades.map((t) =>
                      t.id === tradeId ? { ...t, notes: t.notes + "\n\nAI Coach: " + note } : t
                    )
                  );
              }}
            />
          </div>
          <div className="space-y-6 w-full min-w-0 order-1 md:order-2">
            {recapTrades.length === 0 ? (
              <GlassCard>
                <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No trades recorded yet.</p>
              </GlassCard>
            ) : (
              recapTrades.map((trade) => (
                <GlassCard
                  key={trade.id}
                  className={`cursor-pointer border border-transparent hover:bg-white/50 dark:hover:bg-[#3f3f46] transition-colors ${trade.pnl >= 0 ? "hover:border-[#42bda8]/30" : "hover:border-[#f43636]/30"}`}
                  onClick={() => setSelectedTrade(trade)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-lg text-[#2e2e2e] dark:text-[#fafafa]">{formatSymbolDisplay(trade.instrument)}</span>
                    <span
                      className="font-medium"
                      style={{ color: trade.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                    >
                      {formatPnl(trade.pnl, 2)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa] mb-4">
                    {formatEtTime(trade.entryTime)} - {formatEtTime(trade.exitTime)}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 min-w-0">
                    {trade.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex flex-shrink-0 items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-[#3f3f46] bg-white/50 dark:bg-[#a1a1aa] text-[#2e2e2e] dark:text-[var(--color-black)] whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/50 dark:border-[#3f3f46] flex items-center gap-4">
                    <span className="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa]">
                      Trade Strength:
                    </span>
                    <StrengthMeter
                      value={trade.strength}
                      onChange={(val) =>
                        setTrades(trades.map((t) => (t.id === trade.id ? { ...t, strength: val } : t)))
                      }
                    />
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Calendar state in App so it persists when modal opens/closes; passed to standalone CalendarView
  const now = new Date();
  const [calendarViewMonth, setCalendarViewMonth] = useState(now.getMonth());
  const [calendarViewYear, setCalendarViewYear] = useState(now.getFullYear());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  // Lifted so discipline filters persist when ClientApp re-renders (e.g. selecting a trade or focusing one for coach)
  const [disciplineSelectedTag, setDisciplineSelectedTag] = useState<string | null>(null);
  const [disciplineSelectedModelTag, setDisciplineSelectedModelTag] = useState<string | null>(null);

  const renderStrategy = () => (
    <div className="fade-in space-y-8 max-w-4xl">
      <div>
        <h2 className="display-font text-5xl mb-2 text-[#2e2e2e] dark:text-[#fafafa]">Strategy</h2>
        <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa] max-w-2xl">
          Build a card-based playbook for each strategy. Tap a strategy card to reveal an
          interactive checklist you can run in real time during execution.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 pb-2">
        {/* Add strategy card */}
        <button
          type="button"
          onClick={() => {
            resetDraftModel();
            setExpandedModelId("new");
          }}
          className={`flex flex-col items-center justify-center w-[180px] h-[220px] min-w-[180px] flex-shrink-0 rounded-2xl border-2 border-dashed transition-colors px-3 text-center ${
            expandedModelId === "new"
              ? "bg-white/80 dark:bg-[#27272a] border-[#98935c] text-[#2e2e2e] dark:text-[#fafafa]"
              : "border-gray-300 dark:border-[#3f3f46] bg-white/40 dark:bg-[#27272a] text-[#2e2e2e] dark:text-[#fafafa] hover:border-[#98935c] hover:bg-white/70 dark:hover:bg-[#3f3f46]"
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-[#2e2e2e] dark:border-[#a1a1aa] flex items-center justify-center mb-2 text-2xl leading-none flex-shrink-0 shrink-0">
            +
          </div>
          <span className="block w-full text-sm font-semibold text-center">Add Strategy</span>
        </button>

        {models.map((model) => {
          const isActive = expandedModelId === model.id;
          const Icon = MODEL_ICONS[model.iconId] ?? LucideTarget;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setExpandedModelId(isActive ? null : model.id)}
              className={`flex flex-col items-center justify-center w-[180px] h-[220px] min-w-[180px] flex-shrink-0 rounded-2xl border-2 transition-colors px-3 text-center ${
                isActive
                  ? "bg-[#98935c] border-[#98935c] text-white shadow-inner"
                  : "bg-white/60 dark:bg-[#27272a] border-transparent text-[#2e2e2e] dark:text-[#fafafa] hover:border-[#98935c]/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full border flex items-center justify-center mb-3 flex-shrink-0 shrink-0 ${
                  isActive ? "border-white/80 dark:border-[#3f3f46]" : "border-[#2e2e2e] dark:border-[#a1a1aa]"
                }`}
              >
                <Icon size={22} strokeWidth={2} className={isActive ? "text-white" : ""} />
              </div>
              <span className="block w-full min-w-0 text-xs font-semibold uppercase tracking-widest text-center break-words line-clamp-3">
                {model.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded content */}
      {expandedModelId === "new" && (
        <GlassCard className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Strategy Name
              </label>
              <input
                type="text"
                value={draftModelName}
                onChange={(e) => setDraftModelName(e.target.value)}
                className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-medium"
                placeholder="e.g., London Breakout"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MODEL_ICONS).map(([id, IconComponent]) => {
                  const active = draftIconId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDraftIconId(id)}
                      className={`flex items-center justify-center rounded-xl border w-9 h-9 transition-colors ${
                        active
                          ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                          : "bg-white/50 dark:bg-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] border-white/60 dark:border-[#3f3f46] hover:border-[#98935c]"
                      }`}
                      title={id}
                    >
                      <IconComponent size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mr-0">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Context &amp; Setup
              </label>
              <textarea
                value={draftContext}
                onChange={(e) => setDraftContext(e.target.value)}
                className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[80px]"
                placeholder="Market conditions, HTF context, session, structure you require before even thinking about an entry."
              />
            </div>
            <div className="w-full min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Entry
              </label>
              <textarea
                value={draftEntry}
                onChange={(e) => setDraftEntry(e.target.value)}
                className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[80px]"
                placeholder="Primary entry signal, candle confirmation, execution pattern."
              />
            </div>
            <div className="w-full min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Risk
              </label>
              <textarea
                value={draftRisk}
                onChange={(e) => setDraftRisk(e.target.value)}
                className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[80px]"
                placeholder="Hard stop rules, max loss per trade, account risk."
              />
            </div>
          </div>

          <div className="border-t border-white/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Optional Sections
              </span>
              <span className="text-[11px] text-gray-400">
                Start with the core, then layer precision from your playbook.
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {optionalSectionTemplates.map((tpl) => {
                const enabled = enabledOptionalSections[tpl.id];
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() =>
                      setEnabledOptionalSections((prev) => ({
                        ...prev,
                        [tpl.id]: !prev[tpl.id],
                      }))
                    }
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      enabled
                        ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                        : "bg-white/40 dark:bg-[#27272a] text-[#2e2e2e] dark:text-[#fafafa] border-white/60 dark:border-[#3f3f46] hover:border-[#98935c]"
                    }`}
                  >
                    {tpl.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {optionalSectionTemplates
                .filter((tpl) => enabledOptionalSections[tpl.id])
                .map((tpl) => (
                  <div key={tpl.id}>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                      {tpl.label}
                    </label>
                    <textarea
                      value={optionalSectionValues[tpl.id] ?? ""}
                      onChange={(e) =>
                        setOptionalSectionValues((prev) => ({
                          ...prev,
                          [tpl.id]: e.target.value,
                        }))
                      }
                      className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[80px]"
                      placeholder={tpl.placeholder}
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="border-t border-white/60 pt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Custom Inputs
              </span>
              <button
                type="button"
                onClick={() =>
                  setCustomSections((prev) => [
                    ...prev,
                    { id: `c_${Date.now()}_${prev.length}`, label: "", value: "" },
                  ])
                }
                className="text-[11px] font-semibold uppercase tracking-widest text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
              >
                + Add custom input
              </button>
            </div>
            {customSections.length > 0 && (
              <div className="space-y-4">
                {customSections.map((section, idx) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={section.label}
                        onChange={(e) =>
                          setCustomSections((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, label: e.target.value } : c,
                            ),
                          )
                        }
                        className="flex-1 bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#98935c]"
                        placeholder="Label (e.g., Trade Management, Add-on rules...)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCustomSections((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-[11px] text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={section.value}
                      onChange={(e) =>
                        setCustomSections((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, value: e.target.value } : c,
                          ),
                        )
                      }
                      className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[80px]"
                      placeholder="Checklist style notes for this input."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetDraftModel();
                setExpandedModelId(null);
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveModel}
              className="px-5 py-2 rounded-xl text-sm font-semibold tracking-wide bg-[#2e2e2e] text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!draftModelName.trim()}
            >
              Save Strategy
            </button>
          </div>
        </GlassCard>
      )}

      {expandedModelId && expandedModelId !== "new" && (
        <GlassCard className="space-y-6">
          {(() => {
            const model = models.find((m) => m.id === expandedModelId);
            if (!model) return null;

            const checklistKeyFor = (sectionId: string, idx: number) =>
              `${model.id}:${sectionId}:${idx}`;
            const ModelIcon = MODEL_ICONS[model.iconId] ?? LucideTarget;

            return (
              <>
                <div className="flex justify-between items-end gap-4 border-b border-white/60 pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-9 h-9 rounded-full border border-[#2e2e2e] flex items-center justify-center">
                        <ModelIcon size={20} />
                      </div>
                      <h3 className="display-font text-3xl text-[#2e2e2e] dark:text-[#fafafa]">{model.name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-[0.2em]">
                      Real-time execution checklist
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 mr-2">
                      Created {formatEtShortDate(new Date(model.createdAt).getTime())}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        loadDraftFromModel(model);
                        setExpandedModelId("new");
                      }}
                      className="p-2 rounded-lg text-gray-500 hover:bg-white/50 hover:text-[#2e2e2e] transition-colors"
                      title="Edit strategy"
                    >
                      <LucidePencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(model.id)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove strategy"
                    >
                      <LucideTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {model.sections.map((section) => {
                    const lines = section.value
                      ? section.value.split("\n").filter((ln) => ln.trim().length > 0)
                      : [];
                    return (
                      <div key={section.label} className="space-y-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                          {section.label}
                        </div>
                        {lines.length === 0 ? (
                          <p className="text-xs font-light text-gray-400">
                            No details captured yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {lines.map((line, idx) => {
                              const key = checklistKeyFor(section.id, idx);
                              const checked = !!checklistState[key];
                              return (
                                <label
                                  key={key}
                                  className={`flex items-start gap-2 text-xs cursor-pointer ${
                                    checked ? "text-[#2e2e2e] dark:text-[#fafafa]" : "text-gray-600 dark:text-[#a1a1aa]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setChecklistState((prev) => ({
                                        ...prev,
                                        [key]: !prev[key],
                                      }))
                                    }
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-400 text-[#2e2e2e] focus:ring-[#98935c]"
                                  />
                                  <span className={checked ? "line-through opacity-70" : ""}>
                                    {line}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </GlassCard>
      )}
    </div>
  );

  const renderFlow = () => {
    const todayKey = formatEtDayKey(Date.now());
    const todayLabel = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (activeFlowFillId) {
      const template = flowTemplates.find((t) => t.id === activeFlowFillId);
      if (!template) {
        setActiveFlowFillId(null);
        return null;
      }
      const draft = getFlowDraftOrInit(template.id);
      const alreadySubmittedToday = flowSubmissions.some(
        (s) => s.templateId === template.id && s.date === todayKey,
      );
      const Icon = MODEL_ICONS[template.iconId] ?? LucideBookOpen;

      const renderQuestionInput = (q: FlowQuestion) => {
        const value = draft.answers[q.id];
        if (q.type === "tags") {
          const tags = Array.isArray(value) ? value : [];
          const inputVal = flowTagDraftInput[q.id] ?? "";
          const addTag = (raw: string) => {
            const tag = raw.trim();
            if (!tag) return;
            if (tags.includes(tag)) return;
            updateFlowAnswer(template.id, q.id, [...tags, tag]);
          };
          return (
            <div className="flex flex-wrap gap-2 items-center bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-2 min-h-[48px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2e2e2e] text-white text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      updateFlowAnswer(
                        template.id,
                        q.id,
                        tags.filter((t) => t !== tag),
                      )
                    }
                    className="hover:text-red-300"
                    aria-label={`Remove ${tag}`}
                  >
                    <LucideX size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={inputVal}
                onChange={(e) =>
                  setFlowTagDraftInput((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(inputVal);
                    setFlowTagDraftInput((prev) => ({ ...prev, [q.id]: "" }));
                  } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
                    updateFlowAnswer(template.id, q.id, tags.slice(0, -1));
                  }
                }}
                onBlur={() => {
                  if (inputVal.trim()) {
                    addTag(inputVal);
                    setFlowTagDraftInput((prev) => ({ ...prev, [q.id]: "" }));
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-[#2e2e2e] dark:text-[#fafafa] placeholder:text-gray-400"
                placeholder={tags.length === 0 ? "Type and press Enter…" : ""}
              />
            </div>
          );
        }
        const textVal = typeof value === "string" ? value : "";
        return (
          <textarea
            value={textVal}
            onChange={(e) => updateFlowAnswer(template.id, q.id, e.target.value)}
            className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-light leading-relaxed min-h-[100px]"
            placeholder="Your answer…"
          />
        );
      };

      return (
        <div className="fade-in space-y-6 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-[#2e2e2e] dark:border-[#a1a1aa] flex items-center justify-center">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="display-font text-4xl text-[#2e2e2e] dark:text-[#fafafa]">
                  {template.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa] uppercase tracking-widest mt-1">
                  {todayLabel}
                  {alreadySubmittedToday && (
                    <span className="ml-2 text-[#42bda8] normal-case tracking-normal">
                      • already submitted today (resubmit to overwrite)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveFlowFillId(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-[#a1a1aa] hover:bg-white/40"
            >
              ← Back to Flows
            </button>
          </div>

          <GlassCard className="space-y-5">
            {template.questions.map((q) => (
              <div key={q.id}>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                  {q.prompt}
                </label>
                {renderQuestionInput(q)}
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-2 border-t border-white/60 dark:border-[#3f3f46]">
              <button
                type="button"
                onClick={() => setActiveFlowFillId(null)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/40"
              >
                Save draft &amp; exit
              </button>
              <button
                type="button"
                onClick={() => handleSubmitFlow(template.id)}
                className="px-5 py-2 rounded-xl text-sm font-semibold tracking-wide bg-[#2e2e2e] text-white hover:bg-black"
              >
                {alreadySubmittedToday ? "Resubmit" : "Submit"}
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return (
      <div className="fade-in space-y-8 max-w-4xl">
        <div>
          <h2 className="display-font text-5xl mb-2 text-[#2e2e2e] dark:text-[#fafafa]">Flow</h2>
          <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa] max-w-2xl">
            Build daily routines and journals. Each Flow is a reusable set of prompts you fill in
            for the current trading day. Submitted Flows attach to that day on the Calendar and
            contribute to your Discipline Index.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pb-2">
          <button
            type="button"
            onClick={() => {
              resetDraftFlow();
              setExpandedFlowId("new");
            }}
            className={`flex flex-col items-center justify-center w-[180px] h-[220px] min-w-[180px] flex-shrink-0 rounded-2xl border-2 border-dashed transition-colors px-3 text-center ${
              expandedFlowId === "new"
                ? "bg-white/80 dark:bg-[#27272a] border-[#98935c] text-[#2e2e2e] dark:text-[#fafafa]"
                : "border-gray-300 dark:border-[#3f3f46] bg-white/40 dark:bg-[#27272a] text-[#2e2e2e] dark:text-[#fafafa] hover:border-[#98935c] hover:bg-white/70 dark:hover:bg-[#3f3f46]"
            }`}
          >
            <div className="w-8 h-8 rounded-full border border-[#2e2e2e] dark:border-[#a1a1aa] flex items-center justify-center mb-2 text-2xl leading-none flex-shrink-0">
              +
            </div>
            <span className="block w-full text-sm font-semibold text-center">Create Flow</span>
          </button>

          {flowTemplates.map((template) => {
            const Icon = MODEL_ICONS[template.iconId] ?? LucideBookOpen;
            const submittedToday = flowSubmissions.some(
              (s) => s.templateId === template.id && s.date === todayKey,
            );
            const draft = flowDrafts[template.id];
            const draftActiveToday =
              !submittedToday &&
              draft &&
              draft.date === todayKey &&
              Object.values(draft.answers).some((v) =>
                typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) && v.length > 0,
              );
            const status: { label: string; cls: string } = submittedToday
              ? { label: "Submitted ✓", cls: "text-[#42bda8]" }
              : draftActiveToday
                ? { label: "Draft in progress", cls: "text-[#98935c]" }
                : { label: "Not started", cls: "text-gray-400" };

            return (
              <div
                key={template.id}
                className="relative w-[180px] h-[220px] min-w-[180px] flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setActiveFlowFillId(template.id)}
                  className="w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 transition-colors px-3 text-center bg-white/60 dark:bg-[#27272a] border-transparent text-[#2e2e2e] dark:text-[#fafafa] hover:border-[#98935c]/50"
                >
                  <div className="w-10 h-10 rounded-full border border-[#2e2e2e] dark:border-[#a1a1aa] flex items-center justify-center mb-3 flex-shrink-0">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <span className="block w-full min-w-0 text-xs font-semibold uppercase tracking-widest text-center break-words line-clamp-3">
                    {template.name}
                  </span>
                  <span className="block text-[10px] text-gray-500 dark:text-[#a1a1aa] mt-2">
                    {template.questions.length} question{template.questions.length === 1 ? "" : "s"}
                  </span>
                  <span className={`block text-[10px] font-semibold mt-1 ${status.cls}`}>
                    {status.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDraftFromFlowTemplate(template);
                    setExpandedFlowId("new");
                  }}
                  className="absolute top-2 right-9 p-1.5 rounded-lg text-gray-500 hover:bg-white/60 hover:text-[#2e2e2e] transition-colors"
                  title="Edit template"
                >
                  <LucidePencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFlowTemplate(template.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete template"
                >
                  <LucideTrash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {expandedFlowId === "new" && (
          <GlassCard className="space-y-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={draftFlowName}
                  onChange={(e) => setDraftFlowName(e.target.value)}
                  className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa] font-medium"
                  placeholder="e.g., Pre-market routine"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MODEL_ICONS).map(([id, IconComponent]) => {
                    const active = draftFlowIconId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDraftFlowIconId(id)}
                        className={`flex items-center justify-center rounded-xl border w-9 h-9 transition-colors ${
                          active
                            ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                            : "bg-white/50 dark:bg-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] border-white/60 dark:border-[#3f3f46] hover:border-[#98935c]"
                        }`}
                        title={id}
                      >
                        <IconComponent size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-white/60 dark:border-[#3f3f46] pt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Questions
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraftFlowQuestions((prev) => [
                      ...prev,
                      {
                        id: `q_${Date.now()}_${prev.length}`,
                        prompt: "",
                        type: "text",
                      },
                    ])
                  }
                  className="text-[11px] font-semibold uppercase tracking-widest text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
                >
                  + Add question
                </button>
              </div>

              {draftFlowQuestions.length === 0 && (
                <p className="text-xs text-gray-400">
                  Add the prompts a user should answer each day (e.g., &quot;What is my plan for
                  today?&quot;, &quot;Emotional state&quot;).
                </p>
              )}

              <div className="space-y-3">
                {draftFlowQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="space-y-2 p-3 rounded-xl bg-white/30 dark:bg-[#27272a] border border-white/50 dark:border-[#3f3f46]"
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] w-6">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={q.prompt}
                        onChange={(e) =>
                          setDraftFlowQuestions((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, prompt: e.target.value } : c,
                            ),
                          )
                        }
                        className="flex-1 bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#98935c]"
                        placeholder="Prompt (e.g., What is your plan today?)"
                      />
                      <select
                        value={q.type}
                        onChange={(e) =>
                          setDraftFlowQuestions((prev) =>
                            prev.map((c, i) =>
                              i === idx
                                ? { ...c, type: e.target.value as FlowQuestionType }
                                : c,
                            ),
                          )
                        }
                        className="bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#98935c]"
                      >
                        <option value="text">Text</option>
                        <option value="tags">Tags</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFlowQuestions((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-[11px] text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetDraftFlow();
                  setExpandedFlowId(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFlowTemplate}
                className="px-5 py-2 rounded-xl text-sm font-semibold tracking-wide bg-[#2e2e2e] text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={
                  !draftFlowName.trim() ||
                  draftFlowQuestions.filter((q) => q.prompt.trim()).length === 0
                }
              >
                Save Flow
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen min-h-dvh">
      {renderSidebar()}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {renderMobileNav()}
        <main className="flex-1 min-h-0 p-4 pt-14 sm:p-6 sm:pt-14 md:p-8 md:pt-8 lg:p-12 lg:pt-12 overflow-y-auto relative">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "import" && renderImportData()}
          {activeTab === "recap" && renderDailyRecap()}
          {activeTab === "calendar" && (
            <CalendarView
              trades={trades}
              setTrades={setTrades}
              setSelectedTrade={setSelectedTrade}
              viewMonth={calendarViewMonth}
              setViewMonth={setCalendarViewMonth}
              viewYear={calendarViewYear}
              selectedDate={calendarSelectedDate}
              setSelectedDate={setCalendarSelectedDate}
              isMobile={isMobile}
              flowSubmissions={flowSubmissions}
              flowTemplates={flowTemplates}
              todayKey={formatEtDayKey(Date.now())}
              onOpenFlow={(templateId) => {
                setActiveFlowFillId(templateId);
                setActiveTab("flow");
              }}
            />
          )}
          {activeTab === "discipline" && (
            <DisciplineTabContent
              selectedTag={disciplineSelectedTag}
              setSelectedTag={setDisciplineSelectedTag}
              selectedModelTag={disciplineSelectedModelTag}
              setSelectedModelTag={setDisciplineSelectedModelTag}
              trades={trades}
              metrics={metrics}
              setSelectedTrade={setSelectedTrade}
              disciplineNotes={disciplineNotes}
              setDisciplineNotes={setDisciplineNotes}
              coachFocusedTrade={coachFocusedTrade}
              setCoachFocusedTrade={setCoachFocusedTrade}
            />
          )}
          {activeTab === "strategy" && renderStrategy()}
          {activeTab === "flow" && renderFlow()}
        </main>
      </div>
      {selectedTrade && (
        <TradeDetailsModal
          trade={selectedTrade}
          allTags={(() => {
            const set = new Set<string>();
            trades.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
            return [...set].sort();
          })()}
          tagCounts={(() => {
            const counts: Record<string, number> = {};
            trades.forEach((t) => t.tags.forEach((tag) => { counts[tag] = (counts[tag] ?? 0) + 1; }));
            return counts;
          })()}
          modelTags={models.map((m) => m.name)}
          onClose={() => setSelectedTrade(null)}
          onSave={(updatedTrade) => {
            setTrades(trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
            setSelectedTrade(null);
          }}
          onDelete={(tradeId) => {
            setTrades((prev) => prev.filter((t) => t.id !== tradeId));
            setSelectedTrade(null);
          }}
          onUncombine={(tradeId) => {
            setTrades((prev) => {
              const target = prev.find((t) => t.id === tradeId);
              if (!target || !target.mergedSources || target.mergedSources.length === 0) return prev;
              const restored = target.mergedSources.map((src) => src as unknown as CalendarTrade);
              const without = prev.filter((t) => t.id !== tradeId);
              return [...without, ...restored].sort((a, b) => a.entryTime - b.entryTime);
            });
            setSelectedTrade(null);
          }}
        />
      )}
      {mappingModal && (
        <ImportMappingModal
          csv={mappingModal.csv}
          initialMapping={mappingModal.initialMapping}
          confidence={mappingModal.confidence}
          missing={mappingModal.missing}
          onCancel={() => {
            setMappingModal(null);
            setImportStatus("");
          }}
          onConfirm={(mapping, saveAs) => {
            try {
              const trades = parseWithMapping(mappingModal.csv, mapping, { tag: mappingModal.brokerTag });
              commitParsedTrades(trades, mappingModal.brokerTag);
              if (saveAs) {
                const tpl: ImportTemplate = {
                  id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  name: saveAs,
                  fingerprint: headerFingerprint(mappingModal.csv.headers),
                  mapping,
                  createdAt: Date.now(),
                };
                setImportTemplates((prev) => [tpl, ...prev]);
                setImportBroker(tpl.id);
              }
            } catch (err) {
              setImportStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
              setTimeout(() => setImportStatus(""), 4000);
            } finally {
              setMappingModal(null);
            }
          }}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---
type MetricsShape = {
  profitFactor: number;
  disciplineScore: number;
  totalTrades?: number;
  winRate?: number;
  bestTrade?: { instrument: string; entryTime: number; pnl: number };
  worstTrade?: { instrument: string; entryTime: number; pnl: number };
  [key: string]: unknown;
} | null;

// Build a short, coach-friendly summary of recent trades for context (not the main focus).
function buildTradesContext(
  trades: Array<{ id: string; instrument: string; entryTime: number; pnl: number; tags: string[]; notes?: string; strength?: number }>,
  max = 12
): string {
  if (!trades.length) return "No trades logged yet.";
  const sorted = [...trades].sort((a, b) => b.entryTime - a.entryTime).slice(0, max);
  return sorted
    .map((t, i) => {
      const date = formatEtShortDate(t.entryTime);
      const notesSnippet = (t.notes?.trim() ?? "").slice(0, 80);
      return `${i + 1}. ${t.instrument} | ${date} | PnL ${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)} | tags: ${(t.tags ?? []).join(", ") || "—"}${notesSnippet ? ` | notes: ${notesSnippet}${notesSnippet.length >= 80 ? "…" : ""}` : ""}`;
    })
    .join("\n");
}

type FocusedTradeForCoach = {
  id: string;
  instrument: string;
  entryTime: number;
  exitTime: number;
  pnl: number;
  tags: string[];
  notes?: string;
  strength?: number;
  modelTag?: string | null;
};

function buildFocusedTradeBlob(t: FocusedTradeForCoach): string {
  const entryDate = formatEtDateTime(t.entryTime);
  const exitDate = formatEtDateTime(t.exitTime);
  const notes = (t.notes?.trim() ?? "") || "—";
  const modelTag = (t as { modelTag?: string | null }).modelTag ?? "—";
  return `Instrument: ${t.instrument} | Entry: ${entryDate} | Exit: ${exitDate} | PnL: ${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)} | Tags: ${(t.tags ?? []).join(", ") || "—"} | Strategy: ${modelTag} | Strength (1-5): ${t.strength ?? "—"} | Notes: ${notes}`;
}

const AICoachPanel = ({
  metrics,
  trades = [],
  focusedTrade = null,
  onClearFocusedTrade,
  onPushNote,
}: {
  metrics: MetricsShape;
  trades?: Array<{ id: string; instrument: string; entryTime: number; pnl: number; tags: string[]; notes?: string; strength?: number }>;
  focusedTrade?: FocusedTradeForCoach | null;
  onClearFocusedTrade?: () => void;
  onPushNote: (note: string, tradeId?: string) => void;
}) => {
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = async () => {
    if (!input.trim() || loading || !metrics || typeof metrics.profitFactor !== "number") return;
    const userMsg = input;
    setInput("");
    setChat((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const tradesBlob = buildTradesContext(trades);
    const bestWorst =
      metrics.bestTrade && metrics.worstTrade
        ? ` Best trade: ${metrics.bestTrade.instrument} ${formatEtShortDate(metrics.bestTrade.entryTime)} PnL ${metrics.bestTrade.pnl.toFixed(2)}. Worst: ${metrics.worstTrade.instrument} ${formatEtShortDate(metrics.worstTrade.entryTime)} PnL ${metrics.worstTrade.pnl.toFixed(2)}.`
        : "";

    const focusedBlock = focusedTrade
      ? `\n\nThe user has selected a specific trade to discuss. Base your response on this trade; their question is about it.\nFOCUSED TRADE: ${buildFocusedTradeBlob(focusedTrade)}`
      : "";

    const sysInst = `You are a trading coach in "The Performance Lab". Synthesize the perspectives of Mark Douglas, Jim Simons, and Fabio Valentini—but do not name or cite them. Be direct, analytical, and concise.

Primary rule: Answer the trader's question directly and first. Address what they actually asked (e.g. a specific trade, psychology, execution, sizing, patterns). Do not default to discussing profit factor or discipline index unless the question is clearly about those metrics.${focusedBlock}

Use the following only as context when relevant to the question:
- Summary stats (use only when they support your answer): ${metrics.totalTrades ?? 0} trades, win rate ${(metrics.winRate ?? 0).toFixed(0)}%, profit factor ${metrics.profitFactor.toFixed(2)}, discipline score ${metrics.disciplineScore.toFixed(0)}%.${bestWorst}
- Recent trades (reference specific trades by instrument/date when the question is about what went wrong/right, patterns, or execution):
${tradesBlob}

When the question is about a specific trade or pattern, cite concrete examples from the trade list. When it's about mindset or process, focus on that. Keep responses substantive but focused; 1–2 paragraphs unless the question demands more.`;

    const response = await generateAIResponse(userMsg, sysInst);
    setChat((prev) => [...prev, { role: "ai", content: response }]);
    setLoading(false);
  };

  return (
    <GlassCard className="flex flex-col h-full min-h-[600px] max-md:max-h-[70vh] max-md:min-h-[320px]">
      <div className="flex items-center mb-4 pb-4 border-b border-white/50 dark:border-[#3f3f46]">
        <h3 className="display-font text-3xl text-[#2e2e2e] dark:text-[#fafafa]">Flow Lab</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {chat.length === 0 && (
          <div className="text-sm font-light text-gray-500 dark:text-[#a1a1aa] italic">
            Ask about a specific trade, execution, mindset, or patterns—the coach will answer directly and use your stats only when relevant.
          </div>
        )}
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed font-light ${msg.role === "user" ? "rounded-br-none" : "bg-white/60 dark:bg-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] rounded-bl-none"}`}
              style={msg.role === "user" ? { backgroundColor: COLORS.text, color: "white" } : undefined}
            >
              {msg.content}
            </div>
            {msg.role === "ai" && (
              <button
                onClick={() => onPushNote(msg.content)}
                className="text-[10px] font-semibold uppercase tracking-wider text-[#98935c] mt-2 hover:text-black transition-colors"
              >
                Push to Notes
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Processing variables...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {focusedTrade && onClearFocusedTrade && (
        <div className="flex items-center justify-between gap-2 mb-3 py-2 px-3 rounded-xl bg-[#98935c]/10 border border-[#98935c]/40">
          <span className="text-xs font-medium text-[#2e2e2e] dark:text-[#fafafa] truncate">
            Focusing on: {focusedTrade.instrument} · {formatEtShortDate(focusedTrade.entryTime)} · {focusedTrade.pnl >= 0 ? "+" : ""}{focusedTrade.pnl.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={onClearFocusedTrade}
            className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa] transition-colors"
          >
            Clear
          </button>
        </div>
      )}
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 min-w-0 bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-3 focus:outline-none text-sm font-medium text-[#2e2e2e] dark:text-[#fafafa]"
          placeholder={focusedTrade ? "Ask about this trade..." : "Ask the coach..."}
        />
        <button
          onClick={handleSend}
          className="bg-[#2e2e2e] dark:bg-[#3f3f46] text-white dark:text-[#fafafa] p-3 rounded-xl hover:bg-black dark:hover:bg-[#52525b] transition-colors shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </GlassCard>
  );
};

type Trade = ReturnType<typeof generateMockTrades>[0];

// Stable component so the Discipline tab doesn't remount on parent re-render (avoids visual blink).
type DisciplineTabContentProps = {
  selectedTag: string | null;
  setSelectedTag: (v: string | null) => void;
  selectedModelTag: string | null;
  setSelectedModelTag: (v: string | null) => void;
  trades: ReturnType<typeof generateMockTrades>;
  metrics: MetricsShape;
  setSelectedTrade: (t: Trade | null) => void;
  disciplineNotes: Record<string, string>;
  setDisciplineNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  coachFocusedTrade: Trade | null;
  setCoachFocusedTrade: (t: Trade | null) => void;
};

const DisciplineTabContent = memo(function DisciplineTabContent({
  selectedTag,
  setSelectedTag,
  selectedModelTag,
  setSelectedModelTag,
  trades,
  metrics,
  setSelectedTrade,
  disciplineNotes,
  setDisciplineNotes,
  coachFocusedTrade,
  setCoachFocusedTrade,
}: DisciplineTabContentProps) {
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach((t) => {
      t.tags.forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      });
    });
    return counts;
  }, [trades]);

  const modelTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach((t) => {
      const m = (t as { modelTag?: string | null }).modelTag;
      if (m && m.trim()) counts[m] = (counts[m] ?? 0) + 1;
    });
    return counts;
  }, [trades]);

  const sortedTags = useMemo(
    () => Object.entries(tagCounts).sort((a, b) => b[1] - a[1]),
    [tagCounts]
  );
  const sortedModelTags = useMemo(
    () => Object.entries(modelTagCounts).sort((a, b) => b[1] - a[1]),
    [modelTagCounts]
  );

  const filteredTrades = useMemo(() => {
    let list = trades;
    if (selectedTag) list = list.filter((t) => t.tags.includes(selectedTag));
    if (selectedModelTag) list = list.filter((t) => (t as { modelTag?: string | null }).modelTag === selectedModelTag);
    return list;
  }, [trades, selectedTag, selectedModelTag]);

  const notesKey = selectedModelTag ? `model:${selectedModelTag}` : selectedTag;
  const maxCount = sortedTags.length ? Math.max(...sortedTags.map(([, c]) => c)) : 1;
  const maxModelCount = sortedModelTags.length ? Math.max(...sortedModelTags.map(([, c]) => c)) : 1;

  return (
    <div className="space-y-6">
      <h2 className="display-font text-5xl text-[#2e2e2e] dark:text-[#fafafa]">Discipline</h2>
      <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa] max-w-xl">
        Filter by tag or strategy to review trades and work through discipline problems. Use Flow Lab to discuss the filtered set and attach notes.
      </p>

      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-[#a1a1aa]">Tags</span>
        <div className="flex flex-wrap gap-3 items-center">
          {sortedTags.length === 0 ? (
            <span className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No tags yet. Add tags to trades in trade details.</span>
          ) : (
            sortedTags.map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              const isHighCount = maxCount > 0 && count >= maxCount * 0.8;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(isSelected ? null : tag);
                    setSelectedModelTag(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-all focus:outline-none ${
                    isSelected
                      ? "bg-[#2e2e2e] text-white border-[#2e2e2e] font-semibold"
                      : "bg-white/40 dark:bg-[#27272a] border-white/60 dark:border-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] hover:bg-white/60 dark:hover:bg-[#3f3f46] hover:border-[#98935c]/50 " +
                        (isHighCount ? "font-semibold" : "font-medium")
                  }`}
                >
                  {tag}
                  <span className="ml-1.5 text-gray-500 dark:text-[#a1a1aa] font-normal">({count})</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-[#a1a1aa]">Models</span>
        <div className="flex flex-wrap gap-3 items-center">
          {sortedModelTags.length === 0 ? (
            <span className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No strategy tags yet. Assign a strategy in trade details.</span>
          ) : (
            sortedModelTags.map(([modelName, count]) => {
              const isSelected = selectedModelTag === modelName;
              const isHighCount = maxModelCount > 0 && count >= maxModelCount * 0.8;
              return (
                <button
                  key={modelName}
                  type="button"
                  onClick={() => {
                    setSelectedModelTag(isSelected ? null : modelName);
                    setSelectedTag(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-all focus:outline-none ${
                    isSelected
                      ? "bg-[#98935c] text-white border-[#98935c] font-semibold"
                      : "bg-white/40 dark:bg-[#27272a] border-white/60 dark:border-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] hover:bg-white/60 dark:hover:bg-[#3f3f46] hover:border-[#98935c]/50 " +
                        (isHighCount ? "font-semibold" : "font-medium")
                  }`}
                >
                  {modelName}
                  <span className={`ml-1.5 font-normal ${isSelected ? "text-white/80" : "text-gray-500 dark:text-[#a1a1aa]"}`}>({count})</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AICoachPanel
            metrics={metrics}
            trades={trades}
            focusedTrade={coachFocusedTrade}
            onClearFocusedTrade={() => setCoachFocusedTrade(null)}
            onPushNote={(note) => {
              if (selectedTag) {
                setDisciplineNotes((prev) => ({
                  ...prev,
                  [selectedTag]: (prev[selectedTag] ?? "").concat(prev[selectedTag] ? "\n\n" : "", note),
                }));
              }
            }}
          />
        </div>

        <div className="lg:col-span-2 space-y-6 min-h-0">
          {notesKey ? (
            <>
              <GlassCard>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                  Discipline notes — {selectedModelTag ? `Model: ${selectedModelTag}` : selectedTag}
                </label>
                <textarea
                  value={disciplineNotes[notesKey] ?? ""}
                  onChange={(e) =>
                    setDisciplineNotes((prev) => ({ ...prev, [notesKey]: e.target.value }))
                  }
                  placeholder="Reflections and actions for this tag. Use Flow Lab to push AI insights here."
                  className="w-full min-h-[120px] bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-sm font-light leading-relaxed text-[#2e2e2e] dark:text-[#fafafa]"
                />
              </GlassCard>

              <GlassCard>
                <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/50 dark:border-[#3f3f46]">
                  <h3 className="display-font text-2xl text-[#2e2e2e] dark:text-[#fafafa]">
                    Trades {selectedModelTag ? `model: "${selectedModelTag}"` : `tagged "${selectedTag}"`}
                  </h3>
                  <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa]">
                    {filteredTrades.length} {filteredTrades.length === 1 ? "trade" : "trades"}
                  </span>
                </div>
                {filteredTrades.length === 0 ? (
                  <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">No trades with this tag.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                    {filteredTrades.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTrade(t)}
                        className={`p-4 rounded-xl cursor-pointer border border-transparent hover:bg-white/50 dark:hover:bg-[#3f3f46] transition-colors ${
                          t.pnl >= 0 ? "hover:border-[#42bda8]/30" : "hover:border-[#f43636]/30"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-lg text-[#2e2e2e] dark:text-[#fafafa]">{formatSymbolDisplay(t.instrument)}</span>
                          <span
                            className="font-medium"
                            style={{ color: t.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                          >
                            {formatPnl(t.pnl, 2)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-[#a1a1aa]">
                          {formatEtTime(t.entryTime)} — {formatEtTime(t.exitTime)}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoachFocusedTrade(t);
                          }}
                          className="mt-3 w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#98935c]/60 text-[#98935c] hover:bg-[#98935c]/10 transition-colors"
                        >
                          Flow Lab
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          ) : (
            <GlassCard className="flex items-center justify-center min-h-[200px]">
              <p className="text-sm font-light text-gray-500 dark:text-[#a1a1aa]">Select a tag or strategy above to view trades and discipline notes.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
});

// Map broker/instrument symbol to TradingView widget symbol (exchange:symbol).
// Handles futures (CME_MINI continuous ES1!/NQ1!, CME, COMEX, CBOT), crypto (BINANCE), and US stocks.
function toTradingViewSymbol(instrument: string): string {
  const raw = (instrument || "").trim().toUpperCase();
  if (!raw) return "AMEX:SPY";

  // CME E-mini index futures: TradingView uses CME_MINI and continuous contract (ES1!, NQ1!) so chart always resolves.
  // Check longer roots first so MES/MNQ don't match ES/NQ.
  const cmeMiniRoots: [string, string][] = [
    ["M2K", "M2K1!"],
    ["MNQ", "MNQ1!"],
    ["MES", "MES1!"],
    ["RTY", "RTY1!"],
    ["ES", "ES1!"],
    ["NQ", "NQ1!"],
  ];
  for (const [root, continuous] of cmeMiniRoots) {
    if (raw === root || raw.startsWith(root)) return `CME_MINI:${continuous}`;
  }

  // Other futures: COMEX (GC, SI), CBOT (ZW, ZS, ZM), CME (CL, NG, etc.)
  const comexRoots = ["GC", "SI", "MGC", "SIL"];
  const cbotRoots = ["ZW", "ZS", "ZM", "ZN", "ZF", "ZB"];
  const cmeRoots = ["CL", "EC", "EMD", "MCL", "HG", "NG", "RB", "HO"];
  const monthCode = /^[A-Z]{2,4}[FGHJKMNQUVXZ]\d$/;
  const continuous = /^[A-Z]{2,4}1!$/;
  const isFuture =
    monthCode.test(raw) ||
    continuous.test(raw) ||
    comexRoots.some((r) => raw === r || raw.startsWith(r)) ||
    cbotRoots.some((r) => raw === r || raw.startsWith(r)) ||
    cmeRoots.some((r) => raw === r || raw.startsWith(r));
  if (isFuture) {
    if (cbotRoots.some((r) => raw.startsWith(r))) return `CBOT:${raw}`;
    if (comexRoots.some((r) => raw.startsWith(r))) return `COMEX:${raw}`;
    return `CME:${raw}`;
  }

  // Crypto: BTC, ETH, etc. or pair like BTCUSDT, ETHUSD
  const cryptoMatch = raw.match(/^([A-Z]{2,10})(USDT|USD|BUSD)?$/);
  const cryptoBase = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "LINK", "DOT", "MATIC", "UNI", "LTC", "BCH", "ATOM", "ETC", "XLM", "ALGO", "FIL", "APT", "ARB", "OP", "SUI", "SEI", "NEAR", "INJ", "TIA", "PEPE", "SHIB", "WIF"];
  if (cryptoMatch) {
    const base = cryptoMatch[1];
    const quote = (cryptoMatch[2] || "USDT").toUpperCase();
    if (cryptoBase.includes(base) || base.length <= 5) {
      const pair = quote === "USDT" ? `${base}USDT` : `${base}USD`;
      return `BINANCE:${pair}`;
    }
  }
  if (raw.includes("USDT") || raw.includes("USD")) {
    const base = raw.replace(/(USDT|USD)$/, "");
    if (base.length >= 2 && base.length <= 10) return `BINANCE:${raw}`;
  }

  // Stocks: default NASDAQ, common NYSE/AMEX tickers
  const nyseStocks = ["SPY", "QQQ", "IWM", "DIA", "BAC", "JPM", "XOM", "T", "VZ", "PFE", "WMT", "DIS", "GE"];
  const amexStocks = ["SPY", "IWM", "QQQ", "DIA"];
  if (amexStocks.includes(raw)) return `AMEX:${raw}`;
  if (nyseStocks.includes(raw)) return `NYSE:${raw}`;
  return `NASDAQ:${raw}`;
}

// TradingView widget — config must be script.textContent (not innerHTML). Mount only after container has layout.
function getWidgetConfig(symbol: string) {
  return {
    allow_symbol_change: false,
    calendar: false,
    details: false,
    hide_side_toolbar: true,
    hide_top_toolbar: true,
    hide_legend: true,
    hide_volume: true,
    hotlist: false,
    interval: "240",
    locale: "en",
    save_image: false,
    style: "1",
    symbol,
    theme: "light",
    timezone: "Etc/UTC",
    backgroundColor: "rgba(235, 235, 235, 1)",
    gridColor: "rgba(46, 46, 46, 0)",
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    autosize: true,
  };
}

function triggerChartResize(): void {
  window.dispatchEvent(new Event("resize"));
}

function tradingViewSymbolUrl(symbol: string): string {
  const slug = symbol.replace(":", "-");
  return `https://www.tradingview.com/symbols/${slug}/`;
}

const TradingViewWidget = memo(function TradingViewWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(symbol);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify(getWidgetConfig(tvSymbol));

    script.onload = () => {
      if (cancelled) return;
      triggerChartResize();
      timeouts.push(setTimeout(() => !cancelled && triggerChartResize(), 100));
      timeouts.push(setTimeout(() => !cancelled && triggerChartResize(), 300));
      timeouts.push(setTimeout(() => !cancelled && triggerChartResize(), 600));
    };
    node.appendChild(script);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      script.remove();
    };
  }, [tvSymbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height: "100%", width: "100%", minHeight: 0, overflow: "hidden" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%", minHeight: 0 }}
      />
      <div className="tradingview-widget-copyright">
        <a
          href={tradingViewSymbolUrl(tvSymbol)}
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">{symbol} chart</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
});

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const TradeDetailsModal = ({
  trade,
  allTags,
  tagCounts = {},
  modelTags,
  onClose,
  onSave,
  onDelete,
  onUncombine,
}: {
  trade: Trade;
  allTags: string[];
  tagCounts?: Record<string, number>;
  modelTags: string[];
  onClose: () => void;
  onSave: (t: Trade) => void;
  onDelete?: (tradeId: string) => void;
  onUncombine?: (tradeId: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState(trade.notes);
  const [tags, setTags] = useState<string[]>(trade.tags);
  const [modelTag, setModelTag] = useState<string | null>(trade.modelTag ?? null);
  const [chartImages, setChartImages] = useState<string[]>(
    trade.chartImages?.length ? trade.chartImages : trade.chartImage ? [trade.chartImage] : []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [sessionCustomTags, setSessionCustomTags] = useState<Set<string>>(new Set());
  const [chartLightboxOpen, setChartLightboxOpen] = useState(false);
  const [chartLightboxIndex, setChartLightboxIndex] = useState(0);
  const [strength, setStrength] = useState(trade.strength);
  const [editingNotes, setEditingNotes] = useState(!(trade.notes ?? "").trim());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotes(trade.notes);
    setEditingNotes(!(trade.notes ?? "").trim());
  }, [trade.id, trade.notes]);
  useEffect(() => {
    setStrength(trade.strength);
  }, [trade.id, trade.strength]);
  useEffect(() => {
    setModelTag(trade.modelTag ?? null);
  }, [trade.id, trade.modelTag]);

  const recentTags = useMemo(() => {
    const pool = new Set<string>([...allTags, ...sessionCustomTags]);
    const list = [...pool].filter((t) => !tags.includes(t));
    return list.sort((a, b) => {
      const countA = tagCounts[a] ?? 0;
      const countB = tagCounts[b] ?? 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });
  }, [allTags, sessionCustomTags, tags, tagCounts]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setTagDropdownOpen(false);
      setShowAllTags(false);
      setCustomTagInput("");
      return;
    }
    if (!allTags.includes(trimmed)) {
      setSessionCustomTags((prev) => new Set(prev).add(trimmed));
    }
    setTags((prev) => [...prev, trimmed]);
    setTagDropdownOpen(false);
    setShowAllTags(false);
    setCustomTagInput("");
  };
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
        setShowAllTags(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChartLightboxOpen(false);
    };
    if (chartLightboxOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [chartLightboxOpen]);

  const processFiles = (files: FileList | File[]) => {
    const toAdd: string[] = [];
    const pending = Array.from(files).filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (pending.length === 0) return;
    const maxSlots = 2;
    const doNext = (i: number) => {
      if (i >= pending.length) {
        setChartImages((prev) => [...prev, ...toAdd].slice(0, maxSlots));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        toAdd.push(reader.result as string);
        doNext(i + 1);
      };
      reader.readAsDataURL(pending[i]);
    };
    doNext(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) processFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeChartImageAt = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setChartImages((prev) => prev.filter((_, i) => i !== index));
    if (chartLightboxOpen) setChartLightboxOpen(false);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto !bg-[#ebebeb]/90 dark:!bg-[#27272a] relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 dark:text-[#a1a1aa] hover:text-black dark:hover:text-[#fafafa]"
        >
          <Icons.X />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-0 pb-3 pr-0">
          <div className="flex flex-col gap-1">
            <h2 className="display-font text-3xl sm:text-4xl text-[#2e2e2e] dark:text-[#fafafa]">{formatSymbolDisplay(trade.instrument)} Trade</h2>
            <div className="text-sm font-medium text-gray-500 dark:text-[#a1a1aa] mt-1 space-y-0.5 flex flex-col gap-1.5 pt-0 pb-0">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const isLong = trade.isLong ?? (trade.entryPrice != null && trade.exitPrice != null ? trade.exitPrice > trade.entryPrice : null);
                  return isLong != null && (
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${isLong ? "bg-emerald-500/20 text-emerald-700" : "bg-rose-500/20 text-rose-700"}`}>
                      {isLong ? "Long" : "Short"}
                    </span>
                  );
                })()}
                {trade.lotSize != null && trade.lotSize > 0 && (() => {
                  const qty = trade.lotSize!;
                  return (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-white/60 dark:bg-[#3f3f46] text-gray-600 dark:text-[#a1a1aa] border border-white/60 dark:border-[#3f3f46]">
                      {qty} {qty === 1 ? "contract" : "contracts"}
                    </span>
                  );
                })()}
                <span>
                Entry {trade.entryPrice != null ? `$${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                {trade.entryPrice != null && trade.exitPrice != null ? " → " : ""}
                Exit {trade.exitPrice != null ? `$${trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                </span>
              </div>
              <div>
                {formatEtDateTime(trade.entryTime)} – {formatEtDateTime(trade.exitTime)}
              </div>
              <div className="text-xs text-gray-500 dark:text-[#a1a1aa]">
                Time in trade: {formatDurationHMS(
                  typeof trade.timeInTradeMs === "number"
                    ? trade.timeInTradeMs
                    : Math.max(0, trade.exitTime - trade.entryTime)
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 h-fit">
            <div
              className="text-[64px] tracking-tight display-font h-fit flex flex-wrap pr-6"
              style={{ color: trade.pnl >= 0 ? COLORS.profit : COLORS.loss }}
            >
              {formatPnl(trade.pnl, 2)}
            </div>
          </div>
        </div>
        {/* Two-column row: narrow chart images | model + tags. Reduces vertical height so scrollbar may not appear. */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] gap-6 mb-6 items-start">
          <div className="min-w-0">
            <div className="mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-[#a1a1aa]">
                Chart Images
              </span>
            </div>
            {isMobile ? (
              <div className="space-y-2">
                {chartImages.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-[#a1a1aa]">No chart images.</p>
                ) : null}
                {chartImages.slice(0, 2).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 py-2 border-b border-white/40 dark:border-[#3f3f46] last:border-0">
                    <button
                      type="button"
                      onClick={() => { setChartLightboxIndex(idx); setChartLightboxOpen(true); }}
                      className="text-sm font-medium text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
                    >
                      View chart {idx + 1}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeChartImageAt(e, idx)}
                      className="text-xs text-gray-500 dark:text-[#a1a1aa] hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {chartImages.length < 2 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
                  >
                    + Add chart image
                  </button>
                )}
              </div>
            ) : (
              <div
                className="w-full bg-white/40 dark:bg-[#3f3f46] rounded-xl overflow-hidden relative"
                style={{ height: 280, maxWidth: "100%", minHeight: 0 }}
              >
                {chartImages.length > 0 ? (
                  <div className="w-full h-full min-h-0 flex flex-col bg-[#ebebeb]/50 dark:bg-[#18181b]/80 rounded-xl overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-auto p-2 flex gap-3">
                      {chartImages.slice(0, 2).map((src, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden bg-black/5 flex-1 min-w-0 w-1/2 aspect-video">
                          <img
                            src={src}
                            alt={`Chart ${idx + 1} for ${formatSymbolDisplay(trade.instrument)}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <button
                              type="button"
                              onClick={() => { setChartLightboxIndex(idx); setChartLightboxOpen(true); }}
                              className="px-2 py-1 rounded-md bg-white/90 text-[#2e2e2e] text-[10px] font-semibold uppercase tracking-widest hover:bg-white shadow-sm"
                            >
                              View full size
                            </button>
                            <button
                              type="button"
                              onClick={(e) => removeChartImageAt(e, idx)}
                              className="px-2 py-1 rounded-md bg-white/90 text-gray-600 text-[10px] font-semibold uppercase tracking-widest hover:text-red-600 hover:bg-white shadow-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {chartImages.length < 2 && (
                      <div className="p-2 border-t border-white/40">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-semibold uppercase tracking-widest text-[#98935c] hover:text-[#2e2e2e] dark:hover:text-[#fafafa]"
                        >
                          + Add more images
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      isDragging ? "border-[#98935c] bg-white/40" : "border-gray-300 bg-white/20 hover:border-gray-400 hover:bg-white/30"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      Drop chart images or click to upload
                    </span>
                    <span className="text-[10px] text-gray-400">JPEG, PNG, GIF, WebP — multiple allowed</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-[49px] min-w-0 h-fit pt-[31px]">
            <div className="h-fit">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Strategy
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                Which saved strategy was this trade executed with? (Separate from tags.)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModelTag(null)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#98935c] focus:ring-offset-1 ${
                    !modelTag
                      ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                      : "bg-white/80 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] hover:bg-white dark:hover:bg-[#3f3f46] hover:border-[#98935c]/50"
                  }`}
                >
                  None
                </button>
                {modelTags.map((name) => {
                  const selected = modelTag === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setModelTag(selected ? null : name)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#98935c] focus:ring-offset-1 ${
                        selected
                          ? "bg-[#98935c] text-white border-[#98935c]"
                          : "bg-white/80 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-[#2e2e2e] dark:text-[#fafafa] hover:bg-white dark:hover:bg-[#3f3f46] hover:border-[#98935c]/50"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative min-h-0 h-fit pb-0" ref={tagDropdownRef}>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#a1a1aa] mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-xs font-medium border border-gray-200 text-black"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-gray-200 text-gray-500 hover:text-[#2e2e2e] focus:outline-none"
                      aria-label={`Remove ${tag}`}
                    >
                      <Icons.X />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setTagDropdownOpen((o) => !o)}
                  className="px-3 py-1 bg-transparent border border-gray-400 rounded-full text-xs font-medium text-gray-500 hover:bg-white/50 focus:outline-none"
                >
                  +
                </button>
              </div>
              {tagDropdownOpen && (
                <div
                  className={`absolute left-0 bottom-full mb-2 w-56 overflow-y-auto bg-white/95 dark:bg-[#27272a] backdrop-blur border border-white/60 dark:border-[#3f3f46] rounded-xl shadow-lg z-10 py-2 ${showAllTags ? "max-h-[min(16rem,60vh)]" : "max-h-[14rem]"}`}
                >
                  {recentTags.length > 0 && (
                    <>
                      {(showAllTags ? recentTags : recentTags.slice(0, 5)).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-[#2e2e2e] dark:text-[#fafafa] hover:bg-[#98935c]/10 dark:hover:bg-[#98935c]/20 focus:outline-none"
                        >
                          {tag}
                        </button>
                      ))}
                      {recentTags.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTags((v) => !v)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#98935c] hover:bg-[#98935c]/10 dark:hover:bg-[#98935c]/20 focus:outline-none"
                        >
                          {showAllTags ? "Show less" : "Show all"}
                        </button>
                      )}
                      <div className="border-t border-gray-200 dark:border-[#3f3f46] my-1" />
                    </>
                  )}
                  <div className="px-4 py-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(customTagInput);
                        }
                      }}
                      placeholder="Custom tag..."
                      className="w-full bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] dark:text-[#fafafa]"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(customTagInput)}
                      className="mt-2 w-full py-1.5 text-xs font-semibold uppercase tracking-widest text-[#98935c] hover:text-black dark:hover:text-[#fafafa]"
                    >
                      Add custom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden
          multiple
        />
        {/* Trade notes: locked (read-only + Edit) when saved, else editable textarea */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2 block">
            Trade Notes & Coach Feedback
          </label>
          {(trade.notes ?? "").trim() && !editingNotes ? (
            <div className="flex flex-col gap-2">
              <div className="rounded-xl bg-white/30 dark:bg-[#3f3f46]/50 border border-white/60 dark:border-[#3f3f46] p-4 text-sm font-light leading-relaxed text-[#2e2e2e] dark:text-[#fafafa] whitespace-pre-wrap">
                {trade.notes}
              </div>
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest text-[#98935c] hover:bg-[#98935c]/10 dark:hover:bg-[#98935c]/20 transition-colors"
              >
                Edit
              </button>
            </div>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[120px] max-h-[250px] resize-y bg-white/50 dark:bg-[#3f3f46] border border-white/60 dark:border-[#3f3f46] rounded-xl p-4 focus:outline-none text-sm font-light leading-relaxed text-[#2e2e2e] dark:text-[#fafafa]"
              placeholder="Record emotional state and technical observations..."
              style={{ resize: "vertical" }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Trade Strength:
          </span>
          <StrengthMeter value={strength} onChange={setStrength} />
        </div>
        <div className="flex justify-between items-center gap-4 mt-2 w-full">
          <div className="flex items-center gap-2">
            {onDelete && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#f43636] hover:bg-[#f43636]/10 border border-transparent hover:border-[#f43636]/30"
                aria-label="Delete trade"
              >
                <LucideTrash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            {onDelete && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1aa]">Delete this trade? This cannot be undone.</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(trade.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f43636] text-white hover:bg-[#d62929]"
                >
                  Delete
                </button>
              </div>
            )}
            {onUncombine && trade.mergedSources && trade.mergedSources.length > 0 && !confirmDelete && (
              <button
                type="button"
                onClick={() => onUncombine(trade.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-[#fafafa] hover:bg-white/40 border border-gray-300 dark:border-[#3f3f46]"
                aria-label="Uncombine trade"
              >
                <LucideMerge className="w-4 h-4" />
                Uncombine ({trade.mergedSources.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/40"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ ...trade, notes, chartImages, tags, strength, modelTag: modelTag ?? undefined })}
              className="px-6 py-2 bg-[#2e2e2e] text-white rounded-xl text-sm font-semibold tracking-wide hover:bg-black"
            >
              Save
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
    {chartLightboxOpen && chartImages[chartLightboxIndex] && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Chart full size"
        onClick={() => setChartLightboxOpen(false)}
      >
        <button
          type="button"
          onClick={() => setChartLightboxOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors [&_svg]:w-5 [&_svg]:h-5"
          aria-label="Close"
        >
          <Icons.X />
        </button>
        <img
          src={chartImages[chartLightboxIndex]}
          alt={`Chart for ${formatSymbolDisplay(trade.instrument)} — full size`}
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
};
