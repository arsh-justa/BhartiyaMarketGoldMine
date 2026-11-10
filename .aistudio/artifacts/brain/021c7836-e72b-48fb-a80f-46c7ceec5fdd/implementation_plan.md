# Automated & On-Demand Stock Market Data Sync (Yahoo Finance)

This plan integrates live and monthly-scheduled financial market synchronization using Yahoo Finance (`yahoo-finance2`), a top-left floating refresh action pill with real-time sync indicators and last-updated timestamps, and automated detection for 1st-of-the-month updates.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following architectural and visual specifications during Phase 1:
> - **Live Data Source**: Yahoo Finance (`yahoo-finance2` Node.js integration) queried via server proxy routes to fetch real-time quotes, market capitalization, and latest financial filings for NSE/BSE tickers (`.NS` / `.BO`).
> - **Refresh Control & Status**: Top-left floating action pill with a dedicated manual refresh button, spinning synchronization feedback, and clear "Last updated: [Date & Time]" timestamp.
> - **Automated Monthly Cadence**: Automatic detection on the 1st of every month to refresh the monthly/quarterly financial benchmark cache.

---

## 1. Overview & Core Concept

- **What It Does**: 
  - Adds a server-side proxy route `/api/stock/sync` and `/api/stock/quote` using `yahoo-finance2` to securely fetch live quotes and financial updates for Indian listed equities without CORS or rate-limit issues in the browser.
  - Implements an automated monthly check that verifies if the current date is on or after the 1st of the current month and has not yet been synced for the current month.
  - Embeds a sleek, non-intrusive floating control pill on the top-left of the viewport with a one-click manual refresh button, live synchronization spinner, and human-readable last updated indicator (`e.g., Synced: Today at 10:45 AM` or `Synced: 1st Nov 2026`).
- **Target Audience**: Indian equity analysts, corporate researchers, and retail investors requiring up-to-date market capitalization and profit after tax figures.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Initial Page Visit / 1st of Month Auto-Check**:
   - The app reads the cached sync timestamp from local storage / server state.
   - If the current month has turned (1st of month reached since last sync), the top-left indicator shows "Auto-syncing monthly data..." with a subtle pulsing blue ring and automatically fetches latest figures.
2. **On-Demand Manual Refresh (Top-Left Pill)**:
   - User hovers or taps the top-left floating action pill.
   - User clicks the refresh icon (`RefreshCw`).
   - The pill transitions into an active syncing state (`animate-spin`), fetches live market cap and recent financial updates from `/api/stock/sync`, and recalculates trailing figures.
   - Upon completion, the pill transitions to a quiet green checkmark and updates the timestamp (`Last updated: Just now`).

### Visual Identity & Theme
- **Placement**: Fixed floating element at `top-4 left-4 z-40`, carefully aligned with the layout so it does not obstruct brand titles or main navigation.
- **Aesthetic**: Slate-950 backdrop with subtle hairline border (`border border-slate-800`), backdrop blur (`backdrop-blur-md`), and high-contrast typography (`Plus Jakarta Sans` + `JetBrains Mono` for timestamps).
- **Zero Pill Clutter Compliance**: Unboxed metadata separators with quiet states (`Synced 1st of month · 09:15 IST`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Yahoo Finance Proxy vs Direct Browser Fetch**:
  - *Chosen Approach*: Server-side route in `server.ts` using `express` and `yahoo-finance2`.
  - *Why*: Yahoo Finance blocks direct cross-origin browser fetch requests via CORS and requires header normalization. A backend endpoint provides robust caching, graceful fallbacks for NSE scrip suffixes (`.NS`), and resilient rate-limit shielding.
  - *Alternatives Considered*: Client-side scraping (blocked by CORS) or unverified third-party free proxies (unreliable and brittle).

- **Decision 2: Hybrid Client-Server Monthly Trigger**:
  - *Chosen Approach*: Client checks `lastMonthlySyncTimestamp` stored in `localStorage` upon load; if current month > last synced month (or day $\ge 1$), it triggers an automatic background sync.
  - *Why*: AI Studio dev environment runs server processes on demand. Client-triggered state checking guarantees that whenever the user opens the application on or after the 1st of the month, the data is guaranteed to refresh immediately.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                       │
│                                                             │
│  ┌──────────────────────┐      ┌─────────────────────────┐  │
│  │ Top-Left Action Pill │      │ Dual-Axis Chart & Views │  │
│  │ • Refresh Button     │      │ • Quarterly / Yearly    │  │
│  │ • Monthly Indicator  │      │ • Peer Benchmark        │  │
│  │ • Last Synced Time   │      │ • All >500 Cr Companies │  │
│  └──────────┬───────────┘      └────────────▲────────────┘  │
│             │                               │               │
│             ▼                               │               │
│  ┌──────────────────────────────────────────┴────────────┐  │
│  │ Data Store (Cache + Synced State)                     │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP /api/stock/sync
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (Express + tsx)                   │
│                                                             │
│  ┌─────────────────────────┐      ┌──────────────────────┐  │
│  │ /api/stock/sync Proxy   │─────▶│ yahoo-finance2       │  │
│  │ Rate limiting & cache   │      │ (NSE: .NS / BSE: .BO)│  │
│  └─────────────────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component & State Mapping
- `server.ts`: Express backend mounting Vite middleware in development and serving `/api/stock/sync` and `/api/stock/quote/:symbol`.
- `src/components/SyncStatusPill.tsx`: Floating top-left action pill with refresh trigger, monthly schedule status, and manual sync handler.
- `src/utils/marketSync.ts`: Client sync manager that orchestrates automated 1st-of-month checks and dispatches batch quote updates to the active dataset.
