"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
};

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
    notes: string;
    strength: number;
    modelAdherence: number;
    entryPrice?: number;
    exitPrice?: number;
    isLong?: boolean;
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
        notes: "",
        strength: 0,
        modelAdherence: Math.random() > 0.3 ? 1 : 0,
        entryPrice,
        exitPrice,
        isLong: pnl > 0,
      });
    }
  }
  return trades.reverse();
};

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

const playPCM16Audio = (base64Data: string, sampleRate: number) => {
  if (typeof window === "undefined") return;
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const pcm16Data = new Int16Array(bytes.buffer);

  const AudioCtxConstructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioCtxConstructor) return;
  const audioCtx = new AudioCtxConstructor();
  const audioBuffer = audioCtx.createBuffer(1, pcm16Data.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < pcm16Data.length; i++) {
    channelData[i] = pcm16Data[i] / 32768.0;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();
};

const generateAIAudio = async (text: string) => {
  const response = await fetch("/api/gemini/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName: "Charon" }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }
  const { data: base64Data, sampleRate } = await response.json();
  if (base64Data && sampleRate) {
    playPCM16Audio(base64Data, sampleRate);
  }
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
    className={`bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-2xl p-6 ${className}`}
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

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trades, setTrades] = useState<ReturnType<typeof generateMockTrades>>([]);
  const [selectedTrade, setSelectedTrade] = useState<(typeof trades)[0] | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [quote] = useState(
    () => MARK_DOUGLAS_QUOTES[Math.floor(Math.random() * MARK_DOUGLAS_QUOTES.length)]
  );

  const [dashboardInsight, setDashboardInsight] = useState("");
  const [isAnalyzingDashboard, setIsAnalyzingDashboard] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState("ALL");
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [isReadingAssessment, setIsReadingAssessment] = useState(false);

  const [isGeneratingStrat, setIsGeneratingStrat] = useState(false);
  const [stratName, setStratName] = useState("");
  const [stratContext, setStratContext] = useState("");
  const [stratTrigger, setStratTrigger] = useState("");

  useEffect(() => {
    setTrades(generateMockTrades());
  }, []);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Parsing Tradovate...");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        if (lines.length < 2) throw new Error("File empty or missing data rows.");

        const headers = lines[0].toLowerCase().split(",");
        const pnlIdx = headers.indexOf("pnl");
        const instIdx = headers.indexOf("symbol");
        const boughtIdx = headers.indexOf("boughttimestamp");
        const soldIdx = headers.indexOf("soldtimestamp");
        const buyPriceIdx = headers.indexOf("buyprice");
        const sellPriceIdx = headers.indexOf("sellprice");

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

        const parsedTrades: Array<{
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
          notes: string;
          strength: number;
          modelAdherence: number;
        }> = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (row.length < headers.length) continue;

          const rawPnl = row[pnlIdx] ?? "";
          const isNegative = rawPnl.includes("(") && rawPnl.includes(")");
          const cleanPnl = parseFloat(rawPnl.replace(/[^0-9.]/g, ""));
          if (isNaN(cleanPnl)) continue;
          const pnl = isNegative ? -cleanPnl : cleanPnl;

          const t1 = new Date(row[boughtIdx].replace(/"/g, "")).getTime();
          const t2 = new Date(row[soldIdx].replace(/"/g, "")).getTime();
          if (isNaN(t1) || isNaN(t2)) continue;

          const buyPrice = parseFloat(row[buyPriceIdx]);
          const sellPrice = parseFloat(row[sellPriceIdx]);

          const isLong = t1 < t2;
          const entryTime = Math.min(t1, t2);
          const exitTime = Math.max(t1, t2);
          const entryPrice = isLong ? buyPrice : sellPrice;
          const exitPrice = isLong ? sellPrice : buyPrice;

          parsedTrades.push({
            id: `csv_${Date.now()}_${i}`,
            instrument: row[instIdx].replace(/"/g, "") || "UNKNOWN",
            entryTime,
            exitTime,
            entryPrice,
            exitPrice,
            isLong,
            pnl,
            tags: ["Tradovate Import"],
            notes: "",
            strength: 0,
            modelAdherence: 1,
          });
        }

        parsedTrades.sort((a, b) => a.entryTime - b.entryTime);
        let currentCapital = 50000;
        const withCapital = parsedTrades.map((t) => {
          currentCapital += t.pnl;
          return { ...t, capitalAfter: currentCapital };
        });

        setTrades(withCapital.reverse() as ReturnType<typeof generateMockTrades>);
        setImportStatus(`Successfully imported ${parsedTrades.length} Tradovate executions.`);
        setTimeout(() => setImportStatus(""), 4000);
      } catch (err) {
        setImportStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        setTimeout(() => setImportStatus(""), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const metrics = useMemo(() => {
    if (!trades.length) return null;
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl <= 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    const expectedReturn = (grossProfit - grossLoss) / trades.length;
    const sharpeMock = (expectedReturn / (Math.random() * 50 + 10)).toFixed(2);
    const disciplineScore = (trades.filter((t) => t.modelAdherence).length / trades.length) * 100;

    const pfComponent = Math.min(profitFactor, 3) / 3 * 40;
    const discComponent = disciplineScore * 0.4;
    const baseBuffer = 20;
    const score = Math.min(100, Math.max(0, pfComponent + discComponent + baseBuffer));

    const bestTrade = trades.reduce((prev, current) => (prev.pnl > current.pnl ? prev : current));
    const worstTrade = trades.reduce((prev, current) => (prev.pnl < current.pnl ? prev : current));

    return {
      profitFactor,
      sharpeMock,
      disciplineScore,
      score,
      totalTrades: trades.length,
      winRate: (wins.length / trades.length) * 100,
      bestTrade,
      worstTrade,
      components: { pfComponent, discComponent, baseBuffer },
      trends: { hasPrevData: false, score: 0, profitFactor: 0, disciplineScore: 0 },
    };
  }, [trades]);

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

  const handleAnalyzeDashboard = async () => {
    if (!metrics) return;
    setIsAnalyzingDashboard(true);
    const prompt = `Review my overall trading performance based on these metrics: Trader Score: ${metrics.score.toFixed(1)} out of 100, Profit Factor: ${metrics.profitFactor.toFixed(2)}, Discipline Index: ${metrics.disciplineScore.toFixed(0)}%, Sharpe (Est): ${metrics.sharpeMock}, Total Executions: ${metrics.totalTrades}. Give me a direct, 3-sentence macro assessment in the style of Mark Douglas. Point out what the numbers suggest about my psychology. No fluff.`;
    const sysInst =
      "You are a brutal, analytical trading coach. Synthesize Mark Douglas and Jim Simons. Speak directly to the trader.";
    const response = await generateAIResponse(prompt, sysInst);
    setDashboardInsight(response);
    setIsAnalyzingDashboard(false);
  };

  const handleReadAssessment = async () => {
    if (!dashboardInsight) return;
    setIsReadingAssessment(true);
    try {
      await generateAIAudio(dashboardInsight);
    } catch (err) {
      console.error("Audio generation failed:", err);
    }
    setIsReadingAssessment(false);
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrat(true);
    const prompt = `Acting as a professional quantitative trading architect, flesh out a trading strategy.
    If the user provided clues, build on them: Name: "${stratName}", Context: "${stratContext}", Trigger: "${stratTrigger}".
    If they are completely blank, invent a highly robust, institutional-grade day-trading strategy from scratch.
    
    Format your response STRICTLY as exactly three lines separated by the pipe character '|' with NO prefixes, markdown, or extra text.
    Example format:
    London Breakout | Look for tight consolidation between 2AM and 4AM EST. Price must be above the 200 EMA on the 15m timeframe. | Enter on the first 5m candle close outside the pre-London range. Stop loss at the opposite end of the range.
    `;
    const sysInst = "You are a quantitative modeling architect. Output data strictly formatted as requested.";

    const response = await generateAIResponse(prompt, sysInst);
    const parts = response.split("|").map((p: string) => p.trim());

    if (parts.length >= 3) {
      setStratName(parts[0]);
      setStratContext(parts[1]);
      setStratTrigger(parts[2]);
    } else {
      setStratContext("AI Synthesis Error. Try generating again or provide more context cues.");
    }

    setIsGeneratingStrat(false);
  };

  const renderSidebar = () => (
    <div
      className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 h-screen sticky top-0 bg-white/30 backdrop-blur-xl border-r border-white/50 flex flex-col p-4 shrink-0 z-20`}
    >
      <div className="flex items-center justify-between mb-8 mt-4">
        {sidebarOpen ? (
          <div className="flex items-center w-full pr-2">
            <img
              src="https://placehold.co/150x40/transparent/98935c?text=Trader+Lab&font=Inter"
              alt="Trader Lab Full Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <img
              src="https://placehold.co/32x32/transparent/98935c?text=TL&font=Inter"
              alt="Trader Lab Icon"
              className="h-8 w-8 object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-md hover:bg-white/50 text-gray-500 transition-colors hidden md:block shrink-0"
          title="Toggle Sidebar"
        >
          {sidebarOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
        </button>
      </div>

      <div className="mb-6 relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="hidden"
          id="csv-upload-sidebar"
        />
        <label
          htmlFor="csv-upload-sidebar"
          className={`flex items-center ${sidebarOpen ? "justify-start px-4" : "justify-center"} py-3 bg-[#2e2e2e] text-white rounded-xl cursor-pointer hover:bg-black transition-all text-sm font-medium shadow-md hover:shadow-lg`}
        >
          <Icons.Upload /> {sidebarOpen && <span className="ml-3 whitespace-nowrap">Import CSV</span>}
        </label>
        {importStatus && (
          <div
            className={`absolute top-14 ${sidebarOpen ? "left-0 w-full" : "left-14 w-48"} z-50 bg-white/90 backdrop-blur-md shadow-lg border border-white/60 rounded-lg p-2 text-xs text-center`}
          >
            {importStatus}
          </div>
        )}
      </div>

      <nav className="flex flex-col space-y-3">
        {[
          { id: "dashboard", icon: Icons.Home, label: "Dashboard" },
          { id: "recap", icon: Icons.List, label: "Daily Recap" },
          { id: "calendar", icon: Icons.Calendar, label: "Calendar" },
          { id: "strategy", icon: Icons.Target, label: "Models" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center p-3 rounded-xl transition-all ${activeTab === item.id ? "bg-[#98935c]/20 shadow-inner" : "hover:bg-white/40"}`}
          >
            <span style={{ color: activeTab === item.id ? COLORS.accent : "#6b7280" }}>
              <item.icon />
            </span>
            {sidebarOpen && <span className="ml-4 font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-10 fade-in pb-12">
      <div className="mb-4">
        <h2 className="display-font text-6xl text-[#2e2e2e] tracking-tight">Dashboard</h2>
        <p className="text-sm text-gray-500 italic mt-4 border-l-2 border-[#98935c] pl-4 font-light">
          &quot;{quote}&quot; <span className="font-semibold">— Mark Douglas</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex flex-col p-6 bg-white/30 rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Trader Score
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {metrics?.score.toFixed(1)}
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
          <div className="absolute top-[105%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-200 pb-2">
              Score Breakdown
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Profit Factor (Max 40)</span>
                <span className="text-sm font-semibold text-[#2e2e2e]">
                  {metrics?.components.pfComponent.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Discipline (Max 40)</span>
                <span className="text-sm font-semibold text-[#2e2e2e]">
                  {metrics?.components.discComponent.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Base Buffer</span>
                <span className="text-sm font-semibold text-[#2e2e2e]">
                  {metrics?.components.baseBuffer.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 bg-white/30 rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Profit Factor
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {metrics?.profitFactor.toFixed(2)}
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
          <div className="absolute top-[105%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-200 pb-2">
              Calculation
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e]">Gross Profit ÷ Gross Loss</p>
              <p className="text-[11px] font-light text-gray-500 leading-relaxed">
                Values greater than 1.0 indicate profitability. A factor above 2.0 is considered
                exceptional institutional performance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 bg-white/30 rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Discipline Index
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {metrics?.disciplineScore.toFixed(0)}%
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
          <div className="absolute top-[105%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-200 pb-2">
              Measurement
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e]">% of Executions on Model</p>
              <p className="text-[11px] font-light text-gray-500 leading-relaxed">
                Tracks adherence to your predefined Model Architectures. Untagged, rogue, or impulsive
                trades drop this score.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 bg-white/30 rounded-[2rem] relative group cursor-help transition-colors hover:bg-white/40">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Sharpe (Est.)
          </div>
          <div className="display-font text-7xl text-[#2e2e2e] tracking-tight leading-none transition-colors duration-300 group-hover:text-[#98935c]">
            {metrics?.sharpeMock}
          </div>
          <div className="absolute top-[105%] right-0 w-64 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-200 pb-2">
              Estimation Notice
            </h4>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2e2e2e]">Expected Return ÷ Variance</p>
              <p className="text-[11px] font-light text-gray-500 leading-relaxed">
                Calculated on an intraday sample set without a standard risk-free rate. Treat as a
                directional indicator, not a strict institutional Sharpe.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => metrics?.bestTrade && setSelectedTrade(metrics.bestTrade)}
          className="flex flex-col p-6 bg-white/30 rounded-[2rem] cursor-pointer hover:bg-white/50 transition-colors border border-transparent hover:border-[#42bda8]/30"
        >
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Best Execution
          </div>
          {metrics?.bestTrade ? (
            <div className="flex justify-between items-end">
              <div>
                <div className="text-lg font-semibold text-[#2e2e2e]">{metrics.bestTrade.instrument}</div>
                <div className="text-xs font-medium text-gray-500 mt-1">
                  {new Date(metrics.bestTrade.entryTime).toLocaleDateString()}
                </div>
              </div>
              <div className="display-font text-5xl tracking-tight" style={{ color: COLORS.profit }}>
                +${metrics.bestTrade.pnl.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-sm font-light text-gray-500">No data</div>
          )}
        </div>

        <div
          onClick={() => metrics?.worstTrade && setSelectedTrade(metrics.worstTrade)}
          className="flex flex-col p-6 bg-white/30 rounded-[2rem] cursor-pointer hover:bg-white/50 transition-colors border border-transparent hover:border-[#f43636]/30"
        >
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-3">
            Worst Execution
          </div>
          {metrics?.worstTrade ? (
            <div className="flex justify-between items-end">
              <div>
                <div className="text-lg font-semibold text-[#2e2e2e]">
                  {metrics.worstTrade.instrument}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-1">
                  {new Date(metrics.worstTrade.entryTime).toLocaleDateString()}
                </div>
              </div>
              <div className="display-font text-5xl tracking-tight" style={{ color: COLORS.loss }}>
                ${metrics.worstTrade.pnl.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-sm font-light text-gray-500">No data</div>
          )}
        </div>
      </div>

      <div className="flex flex-col p-8 bg-[#98935c]/10 rounded-[2rem] border border-[#98935c]/30 relative overflow-hidden transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="display-font text-4xl text-[#2e2e2e] flex items-center gap-3">
            <Icons.Brain /> Coach&apos;s Assessment
          </h3>
          <div className="flex items-center gap-3">
            {dashboardInsight && (
              <button
                onClick={handleReadAssessment}
                disabled={isReadingAssessment}
                className="flex items-center gap-2 px-4 py-2 bg-[#2e2e2e] hover:bg-black text-white border border-transparent rounded-xl transition-all text-sm font-semibold shadow-sm"
              >
                {isReadingAssessment ? "🔊 Synthesizing Audio..." : "🔊 Read Aloud"}
              </button>
            )}
            <button
              onClick={handleAnalyzeDashboard}
              disabled={isAnalyzingDashboard}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white/90 border border-white/60 rounded-xl transition-all text-sm font-semibold text-[#2e2e2e] shadow-sm"
            >
              {isAnalyzingDashboard ? "Synthesizing Data..." : "✨ Request Assessment"}
            </button>
          </div>
        </div>
        <p
          className={`text-[#2e2e2e] text-base leading-loose ${dashboardInsight ? "font-light" : "italic text-gray-500 font-light"}`}
        >
          {dashboardInsight ||
            "Click 'Request Assessment' to have the AI analyze your current performance matrix and identify macro patterns in your execution."}
        </p>
      </div>

      <div className="h-[450px] w-full p-8 bg-white/30 rounded-[2rem] relative flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-4">
          <div>
            <h3 className="display-font text-3xl text-[#2e2e2e]">Net Profit</h3>
            <div
              className="display-font text-5xl mt-1 tracking-tight"
              style={{ color: filteredChartData.isPositive ? COLORS.profit : COLORS.loss }}
            >
              {filteredChartData.isPositive ? "+" : ""}${filteredChartData.currentNet.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-1 bg-white/50 p-1 rounded-xl border border-white/60">
            {["1W", "1M", "3M", "YTD", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${chartTimeframe === tf ? "bg-[#2e2e2e] text-white shadow-sm" : "text-gray-500 hover:text-[#2e2e2e]"}`}
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
                    ? new Date(t).toLocaleDateString(undefined, { weekday: "short" })
                    : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
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
                labelFormatter={(l) => new Date(l).toLocaleString()}
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
    </div>
  );

  const renderDailyRecap = () => {
    const today = new Date().toDateString();
    const todaysTrades = trades.filter((t) => new Date(t.entryTime).toDateString() === today);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="display-font text-5xl mb-6 text-[#2e2e2e]">Daily Recap</h2>
          {todaysTrades.length === 0 ? (
            <GlassCard>
              <p className="text-sm font-light text-gray-500">No trades recorded today.</p>
            </GlassCard>
          ) : (
            todaysTrades.map((trade) => (
              <GlassCard
                key={trade.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedTrade(trade)}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-lg text-[#2e2e2e]">{trade.instrument}</span>
                  <span
                    className="font-medium"
                    style={{ color: trade.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-500 mb-4">
                  {new Date(trade.entryTime).toLocaleTimeString()} -{" "}
                  {new Date(trade.exitTime).toLocaleTimeString()}
                </div>
                <div className="flex gap-2 mb-4">
                  {trade.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/50 rounded-full text-xs font-medium border border-gray-200 text-[#2e2e2e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/50 flex items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-widest text-gray-500">
                    Execution Strength:
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
        <div className="lg:col-span-1">
          <AICoachPanel
            activeTrades={todaysTrades}
            metrics={metrics}
            onPushNote={(note, tradeId) => {
              if (!tradeId && todaysTrades.length > 0) tradeId = todaysTrades[0].id;
              if (tradeId)
                setTrades(
                  trades.map((t) =>
                    t.id === tradeId ? { ...t, notes: t.notes + "\n\nAI Coach: " + note } : t
                  )
                );
            }}
          />
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const now = new Date();
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [viewYear, setViewYear] = useState(now.getFullYear());

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);

    let totalMonthlyPnL = 0;
    const weeks: { days: (null | { date: number; fullDate: string; trades: typeof trades; pnl: number })[]; weeklyPnL: number }[] = [];
    let currentWeek: { days: (null | { date: number; fullDate: string; trades: typeof trades; pnl: number })[]; weeklyPnL: number } = {
      days: Array(firstDayOfMonth).fill(null),
      weeklyPnL: 0,
    };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(viewYear, viewMonth, d).toDateString();
      const dayTrades = trades.filter((t) => new Date(t.entryTime).toDateString() === dateStr);
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

    const tradesForSelectedDate = selectedDate
      ? trades.filter((t) => new Date(t.entryTime).toDateString() === selectedDate)
      : [];

    return (
      <div className="fade-in space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="display-font text-5xl text-[#2e2e2e]">
              {new Date(viewYear, viewMonth).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="text-sm font-medium text-gray-500 mt-2 flex gap-4">
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
          <div className="text-right">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
              Net Monthly
            </div>
            <div
              className="display-font text-5xl tracking-tight"
              style={{ color: totalMonthlyPnL >= 0 ? COLORS.profit : COLORS.loss }}
            >
              {totalMonthlyPnL >= 0 ? "+" : ""}${totalMonthlyPnL.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="w-full">
            <div className="grid grid-cols-8 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "W-Net"].map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider ${i === 7 ? "text-[#2e2e2e]" : ""}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-8 gap-2 mb-2">
                {week.days.map((day, dIdx) => (
                  <GlassCard
                    key={dIdx}
                    onClick={() => day && setSelectedDate(day.fullDate)}
                    className={`min-h-[80px] p-2 flex flex-col justify-between cursor-pointer hover:bg-white/60 transition-colors
                      ${!day ? "invisible" : ""} 
                      ${day?.fullDate === selectedDate ? "ring-2 ring-[#98935c]" : ""}
                      ${(day?.pnl ?? 0) > 0 ? "border-b-4 border-b-[#42bda8]" : (day?.pnl ?? 0) < 0 ? "border-b-4 border-b-[#f43636]" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <div className="text-xs font-medium text-gray-500">{day.date}</div>
                        {day.trades.length > 0 && (
                          <div
                            className="text-right text-sm font-semibold"
                            style={{ color: day.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                          >
                            {day.pnl >= 0 ? "+" : ""}${day.pnl.toFixed(0)}
                          </div>
                        )}
                      </>
                    )}
                  </GlassCard>
                ))}
                <div
                  className="flex items-center justify-center rounded-xl bg-white/20 text-sm font-semibold"
                  style={{ color: week.weeklyPnL >= 0 ? COLORS.profit : COLORS.loss }}
                >
                  {week.weeklyPnL >= 0 ? "+" : ""}${week.weeklyPnL.toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          {selectedDate && (
            <div className="w-full fade-in pb-8">
              <GlassCard>
                <div className="flex justify-between items-end mb-6 border-b border-white/50 pb-4">
                  <h3 className="display-font text-3xl text-[#2e2e2e]">
                    {new Date(selectedDate).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <span className="text-sm font-medium text-gray-500">
                    {tradesForSelectedDate.length} Executions
                  </span>
                </div>
                {tradesForSelectedDate.length === 0 ? (
                  <p className="text-sm font-light text-gray-500">No executions recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tradesForSelectedDate.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTrade(t)}
                        className="p-4 bg-white/50 rounded-xl cursor-pointer hover:bg-white/80 border border-white/60 transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-lg text-[#2e2e2e]">{t.instrument}</span>
                          <span
                            className="font-medium"
                            style={{ color: t.pnl >= 0 ? COLORS.profit : COLORS.loss }}
                          >
                            {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {new Date(t.entryTime).toLocaleTimeString()} -{" "}
                          {new Date(t.exitTime).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStrategy = () => (
    <div className="fade-in max-w-2xl">
      <h2 className="display-font text-5xl mb-6 text-[#2e2e2e]">Model Architecture</h2>

      <button
        onClick={handleGenerateStrategy}
        disabled={isGeneratingStrat}
        className="w-full mb-6 bg-white/60 text-[#2e2e2e] border border-white/80 shadow-sm rounded-xl p-4 font-semibold tracking-wide hover:bg-white/90 transition-colors flex justify-center items-center gap-2"
      >
        {isGeneratingStrat ? "Architecting Framework..." : "✨ Auto-Complete Framework with AI"}
      </button>

      <GlassCard>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Model Name
            </label>
            <input
              type="text"
              value={stratName}
              onChange={(e) => setStratName(e.target.value)}
              className="w-full bg-white/50 border border-white/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] font-medium"
              placeholder="e.g., London Breakout"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Context / Setup
            </label>
            <textarea
              value={stratContext}
              onChange={(e) => setStratContext(e.target.value)}
              className="w-full bg-white/50 border border-white/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] font-light leading-relaxed min-h-[100px]"
              placeholder="HTF trend alignment, Time of day..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Entry Trigger
            </label>
            <input
              type="text"
              value={stratTrigger}
              onChange={(e) => setStratTrigger(e.target.value)}
              className="w-full bg-white/50 border border-white/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#98935c] text-[#2e2e2e] font-medium"
              placeholder="Order block touch, 5m close..."
            />
          </div>
          <button className="w-full bg-[#2e2e2e] text-white rounded-xl p-4 font-semibold tracking-wide hover:bg-black transition-colors">
            Save Model Framework
          </button>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {renderSidebar()}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "recap" && renderDailyRecap()}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "strategy" && renderStrategy()}
      </main>
      {selectedTrade && (
        <TradeDetailsModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onSave={(updatedTrade) => {
            setTrades(trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
            setSelectedTrade(null);
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
  [key: string]: unknown;
} | null;

const AICoachPanel = ({
  activeTrades,
  metrics,
  onPushNote,
}: {
  activeTrades: Array<{ id: string; notes: string }>;
  metrics: MetricsShape;
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

    const sysInst = `You are a trading coach in "The Performance Lab". Synthesize Mark Douglas, Jim Simons, and Fabio Valentini. Be direct, analytical, devoid of emotional cushioning. Address the user as Ryon. Metrics: PF: ${metrics.profitFactor.toFixed(2)}, Discipline: ${metrics.disciplineScore.toFixed(0)}%.`;
    const response = await generateAIResponse(userMsg, sysInst);
    setChat((prev) => [...prev, { role: "ai", content: response }]);
    setLoading(false);
  };

  return (
    <GlassCard className="flex flex-col h-[600px]">
      <div className="flex items-center mb-4 pb-4 border-b border-white/50">
        <h3 className="display-font text-3xl text-[#2e2e2e]">Flow Lab</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {chat.length === 0 && (
          <div className="text-sm font-light text-gray-500 italic">
            Initiate sequence. State your psychological hurdle.
          </div>
        )}
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed font-light ${msg.role === "user" ? "rounded-br-none" : "bg-white/60 text-[#2e2e2e] rounded-bl-none"}`}
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
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-white/50 border border-white/60 rounded-xl p-3 focus:outline-none text-sm font-medium"
          placeholder="Query the coach..."
        />
        <button
          onClick={handleSend}
          className="bg-[#2e2e2e] text-white p-3 rounded-xl hover:bg-black transition-colors"
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

const TradeDetailsModal = ({
  trade,
  onClose,
  onSave,
}: {
  trade: Trade;
  onClose: () => void;
  onSave: (t: Trade) => void;
}) => {
  const [notes, setNotes] = useState(trade.notes);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleGeneratePostMortem = async () => {
    setIsGeneratingNote(true);
    const durationMins = ((trade.exitTime - trade.entryTime) / 60000).toFixed(1);
    const prompt = `Analyze this execution: Instrument: ${trade.instrument}, PnL: $${trade.pnl.toFixed(2)}, Duration: ${durationMins} minutes. Provide a 2-sentence, clinical post-mortem on what this result and hold time implies about the execution.`;
    const sysInst =
      "You are an institutional trading coach. Be objective, clinical, and brief. No pleasantries.";
    const response = await generateAIResponse(prompt, sysInst);

    setNotes((prev) => prev + (prev ? "\n\n" : "") + "✨ AI Post-Mortem: " + response);
    setIsGeneratingNote(false);
  };

  useEffect(() => {
    let chart: { remove: () => void } | undefined;

    const renderChart = () => {
      if (!chartContainerRef.current || typeof window === "undefined") return;
      const LW = (window as unknown as { LightweightCharts?: { createChart: (el: HTMLElement, opts: object) => { addLineSeries: (opts: object) => { setData: (d: object) => void; setMarkers: (m: object) => void }; timeScale: () => { fitContent: () => void }; remove: () => void } } }).LightweightCharts;
      if (!LW) return;
      chartContainerRef.current.innerHTML = "";

      const chartInstance = LW.createChart(chartContainerRef.current, {
        layout: {
          background: { type: "solid", color: "transparent" },
          textColor: "#2e2e2e",
          fontFamily: "Inter",
        },
        grid: {
          vertLines: { color: "rgba(0,0,0,0.05)" },
          horzLines: { color: "rgba(0,0,0,0.05)" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        timeScale: { timeVisible: true, secondsVisible: true },
      });
      chart = chartInstance;

      const lineSeries = chartInstance.addLineSeries({
        color: COLORS.accent,
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });

      const entryT = Math.floor(trade.entryTime / 1000);
      const exitT = Math.floor(trade.exitTime / 1000);

      const startPrice = trade.entryPrice ?? (trade.pnl > 0 ? 4000 : 4050);
      const endPrice = trade.exitPrice ?? startPrice + (trade.pnl > 0 ? 10 : -10);

      const data = [
        { time: entryT - 600, value: startPrice },
        { time: entryT, value: startPrice },
        { time: exitT, value: endPrice },
        { time: exitT + 600, value: endPrice },
      ];

      lineSeries.setData(data);

      lineSeries.setMarkers([
        {
          time: entryT,
          position: trade.isLong ? "belowBar" : "aboveBar",
          color: trade.isLong ? "#42bda8" : "#f43636",
          shape: trade.isLong ? "arrowUp" : "arrowDown",
          text: `Entry: ${startPrice}`,
        },
        {
          time: exitT,
          position: trade.isLong ? "aboveBar" : "belowBar",
          color: "#2e2e2e",
          shape: trade.isLong ? "arrowDown" : "arrowUp",
          text: `Exit: ${endPrice}`,
        },
      ]);

      chartInstance.timeScale().fitContent();
    };

    if (typeof window === "undefined") return;
    if (!(window as unknown as { LightweightCharts?: unknown }).LightweightCharts) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js";
      script.async = true;
      script.onload = renderChart;
      document.body.appendChild(script);
    } else {
      renderChart();
    }

    return () => {
      if (chart && "remove" in chart) chart.remove();
    };
  }, [trade]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto !bg-[#ebebeb]/90 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-black"
        >
          <Icons.X />
        </button>
        <div className="flex items-end justify-between mb-8 pr-12">
          <div>
            <h2 className="display-font text-4xl text-[#2e2e2e]">{trade.instrument} Execution</h2>
            <div className="text-sm font-medium text-gray-500 mt-1">
              {new Date(trade.entryTime).toLocaleString()}
            </div>
          </div>
          <div
            className="text-5xl tracking-tight display-font"
            style={{ color: trade.pnl >= 0 ? COLORS.profit : COLORS.loss }}
          >
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
          </div>
        </div>
        <div
          className="w-full h-[300px] bg-white/40 rounded-xl mb-6 overflow-hidden relative"
          ref={chartContainerRef}
        ></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Trade Notes & Coach Feedback
              </label>
              <button
                onClick={handleGeneratePostMortem}
                disabled={isGeneratingNote}
                className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1 text-[#98935c] hover:text-black transition-colors bg-white/50 px-2 py-1 rounded-md border border-white/60"
              >
                {isGeneratingNote ? "Synthesizing..." : "✨ Auto Post-Mortem"}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 w-full min-h-[160px] bg-white/50 border border-white/60 rounded-xl p-4 focus:outline-none text-sm font-light leading-relaxed text-[#2e2e2e]"
              placeholder="Record emotional state and technical observations..."
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Media Attachment
              </label>
              <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-white/20">
                Mock S3 Upload
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {trade.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/80 rounded-full text-xs font-medium border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
                <button className="px-3 py-1 bg-transparent border border-gray-400 rounded-full text-xs font-medium text-gray-500 hover:bg-white/50">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white/40"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...trade, notes })}
            className="px-6 py-2 bg-[#2e2e2e] text-white rounded-xl text-sm font-semibold tracking-wide hover:bg-black"
          >
            Save Parameters
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
