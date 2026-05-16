export const ET_TZ = "America/New_York";

function etOffsetMinutes(utcMs: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TZ,
    timeZoneName: "shortOffset",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(tz);
  if (!m) return -300;
  const sign = m[1] === "+" ? 1 : -1;
  const h = parseInt(m[2], 10);
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (h * 60 + mm);
}

export function parseEt(input: string | number | null | undefined): number {
  if (input == null) return NaN;
  if (typeof input === "number") return input;
  const s = String(input).trim();
  if (!s) return NaN;

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? NaN : t;
  }

  const ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?(\s*[AaPp][Mm])?)?$/.exec(s);
  const mdy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?(\s*[AaPp][Mm])?)?$/.exec(s);

  let y: number, mo: number, d: number, hh = 0, mm = 0, ss = 0, ms = 0, ampm: string | null = null;
  if (ymd) {
    y = +ymd[1]; mo = +ymd[2]; d = +ymd[3];
    hh = +(ymd[4] ?? 0); mm = +(ymd[5] ?? 0); ss = +(ymd[6] ?? 0); ms = +(ymd[7] ?? 0);
    ampm = ymd[8] ?? null;
  } else if (mdy) {
    mo = +mdy[1]; d = +mdy[2]; y = +mdy[3];
    hh = +(mdy[4] ?? 0); mm = +(mdy[5] ?? 0); ss = +(mdy[6] ?? 0); ms = +(mdy[7] ?? 0);
    ampm = mdy[8] ?? null;
  } else {
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? NaN : t;
  }

  if (ampm) {
    const isPm = /p/i.test(ampm);
    if (isPm && hh < 12) hh += 12;
    if (!isPm && hh === 12) hh = 0;
  }

  const utcGuess = Date.UTC(y, mo - 1, d, hh, mm, ss, ms);
  const off1 = etOffsetMinutes(utcGuess);
  const utc1 = utcGuess - off1 * 60_000;
  const off2 = etOffsetMinutes(utc1);
  return utcGuess - off2 * 60_000;
}

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ET_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatEtDayKey(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  return dayKeyFmt.format(new Date(ms));
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ET_TZ,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export function formatEtTime(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  return `${timeFmt.format(new Date(ms))} ET`;
}

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ET_TZ,
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatEtDateTime(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  const parts = dateTimeFmt.formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const month = get("month");
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dp = get("dayPeriod");
  return `${weekday}, ${month} ${day}, ${year} · ${hour}:${minute} ${dp} ET`;
}

const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ET_TZ,
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

export function formatEtShortDate(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  return shortDateFmt.format(new Date(ms));
}

const weekdayShortDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ET_TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function formatEtWeekdayDate(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  return weekdayShortDateFmt.format(new Date(ms));
}

export function formatDurationHMS(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
