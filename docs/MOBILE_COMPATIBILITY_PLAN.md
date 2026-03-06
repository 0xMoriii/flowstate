# Mobile Compatibility Plan — Flowstate

This document outlines what needs to happen to make the Flowstate trading dashboard work well on mobile breakpoints. It incorporates your known requirements and adds recommendations from a pass over the codebase.

---

## 1. Navigation (sidebar → top bar + hamburger)

**Current:** Left sidebar (`renderSidebar`) is always visible with collapsible width (`w-64` / `w-20`), sticky, with nav items (Dashboard, Daily Recap, Calendar, Discipline, Models) and Import CSV at the bottom. A chevron toggle in the main area collapses/expands the sidebar.

**Planned changes:**

- **Breakpoint:** Use a single mobile breakpoint (e.g. `md` at 768px) so that below it we use the new layout; above it keep the current sidebar.
- **Mobile layout:**
  - **Top bar:** Full-width horizontal bar at the top containing:
    - Flowstate logo (small/icon version)
    - Hamburger button (right side) to open/close the menu
  - **Sidebar:** Hidden by default on mobile. When hamburger is tapped, show the same nav content (Dashboard, Daily Recap, Calendar, Discipline, Models, Import CSV) as a **dropdown or slide-over drawer** from the top (e.g. below the bar or as a full-screen overlay). Tapping a nav item should switch tab and close the menu.
- **Implementation notes:**
  - Reuse the same `activeTab` / `setActiveTab` and nav array; only the DOM structure and visibility change by breakpoint.
  - Use CSS (e.g. `hidden md:flex` for desktop sidebar, `md:hidden` for top bar + hamburger) and a mobile-only state for “menu open” (e.g. `mobileMenuOpen`).
  - The existing “toggle sidebar” chevron in `main` can be hidden on mobile (`hidden md:block`) since the sidebar is replaced by the hamburger menu.
- **Assets:** Ensure a compact logo (e.g. `FLOWSTATE Icon.svg`) is used in the top bar on mobile so the bar doesn’t feel cramped.

---

## 2. Dashboard — stack vertically on mobile

**Current:** Dashboard uses `grid grid-cols-1 md:grid-cols-4` for the four metric cards (Trader Score, Profit Factor, Discipline, Win Rate), then `grid grid-cols-1 md:grid-cols-2` for “Best trade” / “Worst trade”, and a full-width chart section. There’s already a `sm:flex-row` in the chart header.

**Planned changes:**

- **Metric cards:** Keep `grid-cols-1` on small screens so the four cards stack in one column. Already correct; verify spacing (e.g. `gap-6`) and that card content doesn’t overflow (e.g. long numbers, tooltips).
- **Best / Worst trade:** Already one column on small screens; ensure padding and touch targets are adequate.
- **Chart block:** The timeframe pills and chart container should stack or wrap cleanly; the existing `sm:flex-row` helps. Ensure the chart (e.g. Recharts) is responsive and doesn’t force horizontal scroll; consider reducing chart height on very small viewports if needed.
- **Headings:** Consider slightly smaller display font on mobile for “Dashboard” (e.g. `text-4xl md:text-6xl`) so the hero doesn’t dominate the screen.
- **Tooltips:** The Trader Score “Score Breakdown” tooltip is hover-based; on touch devices consider a tap-to-show tooltip or a small “(?)” that opens the same content in a small modal or popover so it’s usable without hover.

No structural redesign—only ensure layout is single-column and readable on mobile.

---

## 3. Trade Details modal — mobile variant (charts → links + lightbox)

**Current:** `TradeDetailsModal` has a large “Chart Images” section: either two inline thumbnails with “View full size” / “Remove” or a drop zone. “View full size” already opens a lightbox (`chartLightboxOpen`). Desktop behavior should remain unchanged.

**Planned changes:**

- **Detection:** Use a media query or a hook (e.g. `useMediaQuery` or Tailwind’s breakpoint) so the modal knows when it’s on “mobile” (e.g. width &lt; 768px).
- **Desktop (unchanged):** Keep the current layout: the chart images area with inline thumbnails, drop zone, and hover actions. No code removal; only branch the render.
- **Mobile:**
  - **Remove** the big chart-images block (the tall container with side-by-side thumbnails and drop zone).
  - **Replace** with a compact “Chart images” list:
    - If there are no images: show a single line, e.g. “No chart images” and optionally a text link “Add chart image” that triggers the same file input (no big drop zone).
    - If there are images: for each `chartImages[i]` show a text link like “View chart 1”, “View chart 2”. Tapping opens the **existing** lightbox at index `i` (`setChartLightboxIndex(i)`; `setChartLightboxOpen(true)`). Optionally add a “Remove” link per image that calls `removeChartImageAt(e, i)`.
  - **Lightbox:** Already implemented; ensure it’s touch-friendly (e.g. tap outside or a visible “Close” button) and that the image is scrollable/zoomable if needed (e.g. `max-w-[95vw] max-h-[95vh]` is already there).
- **Rest of modal:** Header (title, PnL, strength), Model, Notes, Tags, and Save/Cancel can stay as-is; consider stacking the two-column Notes/Tags layout on mobile (e.g. `grid-cols-1` on small, `md:grid-cols-2` on desktop) if not already. Modal padding and font sizes should be tuned so the form is usable on small screens (e.g. `p-4` on mobile, existing padding on desktop).

---

## 4. Calendar — mobile-friendly options

**Current:** `CalendarView` has a 7-day + “Weekly” column grid (`grid-cols-8`), month navigation, and a selected-day trade list. There’s already a `compactCalendar` mode driven by container width (`CALENDAR_FULL_MIN_WIDTH`), which shrinks day cells and shows “Wk” for the weekly column.

**Ideas for mobile:**

- **Option A — Keep grid, make it scrollable (minimal change):**  
  The calendar container already has `overflow-x-auto` and `min-w-[600px]`. On mobile, keep the 8-column grid but ensure horizontal scroll is obvious (e.g. a subtle shadow or “scroll →” hint). Reduce padding (e.g. `pl-4 pr-4` on mobile instead of `pl-8 pr-8`). Rely on `compactCalendar` so cells are small (e.g. `h-10`) and the weekly total is visible. Selected date’s trade list below stays as-is. Good if you want to keep the same mental model as desktop.

- **Option B — List / agenda view for small screens:**  
  Below a breakpoint, replace the grid with an **agenda-style list**: list each day that has trades (or each day of the month in a compact form), with date, day-of-week, and daily PnL. Tapping a row selects that date and shows the same “trades for selected date” list below. Month navigation (Prev/Next) stays at the top. This avoids horizontal scroll and is very thumb-friendly.

- **Option C — Week-at-a-time with swipe:**  
  Show one week (7 days) at a time with clear week dates (e.g. “Mar 2 – 8”). Prev/Next (or swipe) change the week. Selected date’s trades shown below. Requires a bit more state (current week offset) and possibly touch handlers or a small library for swipe.

- **Option D — Month grid with smaller cells and no “Weekly” column on mobile:**  
  Use a 7-column grid (Sun–Sat only) on mobile; show weekly totals in the selected-day panel or in a collapsible section below the grid instead of an 8th column. Reduces width and keeps the calendar look.

**Recommendation:** Start with **Option A** (scrollable grid + existing compact mode + reduced padding) for the least risk. If testing shows that horizontal scroll is awkward, add **Option B** as an alternative mobile view (e.g. toggle “Calendar” / “List” or switch automatically by breakpoint).

**Other calendar tweaks:**

- Month title and Monthly PnL: already adapt with `compactCalendar`; ensure on very small screens the “Prev / Next” and “Monthly PnL” don’t wrap badly (e.g. flex-wrap and gap).
- Selected date trade list: the list with “Combine” and trade cards should stack vertically; ensure touch targets and spacing are good. Consider making the combine controls (checkboxes + “Combine N trades” button) more prominent on mobile.

---

## 5. Other areas to address

- **Daily Recap**
  - Layout is `grid grid-cols-1 lg:grid-cols-3` with trade list in 2 columns and Flow Lab in 1. On mobile this already stacks; verify that the AI coach panel (Flow Lab) is below the list and has a sensible height (e.g. `max-h-[60vh]` or collapsible) so the page isn’t overwhelming.

- **Discipline**
  - Uses `grid grid-cols-1 lg:grid-cols-3` (notes + trade list | Flow Lab). Same as above: stacking is fine; ensure tag/model pills wrap and that the right column (Flow Lab) doesn’t dominate on small screens. Consider making the discipline notes and trade list the primary focus and Flow Lab a “tap to expand” or fixed height with scroll on mobile.

- **Models (Strategy)**
  - Horizontal scrolling strip of model cards (`flex flex-wrap gap-4`). On narrow screens, allow wrapping and ensure at least one card is fully visible; consider slightly smaller cards on mobile (e.g. `w-[160px]` and reduced height) so two can fit. The expanded checklist/editor should be full-width and scrollable; ensure inputs and buttons have good touch targets.

- **Trade Details modal — general**
  - Header row with title and PnL: on very small screens, stack the PnL and strength meter below the title instead of side-by-side to avoid cramming (e.g. `flex-col items-start` on mobile, `flex-row items-end` on desktop).
  - Save/Cancel: keep at the bottom; ensure full-width or large tap targets on mobile.

- **Main content area**
  - Current `p-8 lg:p-12` is good; consider `p-4 sm:p-6 md:p-8 lg:p-12` so mobile has less padding and more content space.
  - The sidebar toggle button (chevron) is `absolute top-3 left-3`; on mobile it’s hidden (see Nav), so no conflict.

- **Global**
  - **Viewport / meta:** Ensure `viewport` meta tag is set (Next.js default is usually fine).
  - **Touch targets:** Buttons and links should be at least ~44px in one dimension where possible.
  - **Font sizes:** Avoid tiny fixed font sizes; use responsive sizes (e.g. `text-sm` / `text-base`) so content stays readable.
  - **Overflow:** Avoid horizontal overflow on `body`/main; use `min-w-0` on flex children and `overflow-x-auto` only where intentional (e.g. calendar grid).

- **Flow Lab (AICoachPanel)**
  - Fixed height `h-[800px]` may be too tall on mobile; consider `max-h-[70vh]` or similar on small screens so the panel doesn’t push the rest of the page off-screen.

---

## 6. Suggested breakpoint and tech

- **Primary breakpoint:** Use Tailwind `md` (768px) for “mobile” vs “desktop” for nav, and optionally the same for Trade Details and calendar. Use `sm` (640px) where you need a finer step (e.g. chart header).
- **No new dependencies required:** Hamburger and dropdown/drawer can be implemented with conditional classes and state. If you later want swipe on calendar, consider a small touch utility or library.
- **Testing:** Manually test at 320px, 375px, and 414px width (typical phone widths) and in device emulation; verify tap targets and that no critical content is cut off or requires horizontal scroll (except the calendar grid if you keep Option A).

---

## 7. Implementation order

1. **Nav (top bar + hamburger)** — unblocks testing the rest of the app on mobile.
2. **Main content padding and sidebar toggle visibility** — quick win.
3. **Dashboard** — verify stacking and typography; fix tooltip for touch if needed.
4. **Trade Details** — mobile branch: chart images as links + lightbox; optional header/notes stacking.
5. **Calendar** — Option A (scroll + compact) first; Option B or D if needed.
6. **Daily Recap, Discipline, Models** — layout and Flow Lab height.
7. **Global pass** — touch targets, overflow, viewport.

---

## Summary table

| Area            | Action |
|-----------------|--------|
| **Nav**         | Top horizontal bar + hamburger; nav in dropdown/drawer on mobile; desktop sidebar unchanged. |
| **Dashboard**   | Keep vertical stack; tune headings and tooltips for mobile. |
| **Trade Details** | On mobile only: replace chart images section with “View chart 1/2” links opening existing lightbox; keep desktop as-is. |
| **Calendar**    | Use scrollable compact grid first; optional list/agenda view for small screens. |
| **Daily Recap / Discipline / Models** | Verify stacked layout and Flow Lab height on small screens. |
| **Global**       | Padding, viewport, touch targets, overflow. |

This plan keeps the desktop experience intact and adds a compatible mobile experience with minimal structural change. If you want, the next step can be implementing the nav (top bar + hamburger) and then the Trade Details mobile variant.
