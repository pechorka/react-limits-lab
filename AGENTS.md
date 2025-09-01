# agents.md — React Limits Lab (minimal scope)

**Goal:** a fun, local-only React app that mounts synthetic trees from “knobs” and shows real-time metrics (FPS, render timings, long tasks, memory).
**Out of scope:** tests, docs, CI, pre-commit hooks, contribution templates.
**Tooling:** Vite + React + TypeScript + basic ESLint. No extra libs unless noted as optional.

## Implementation instructions

After you complete a task, mark is as completed in this file with [x], and commit your changes with a descriptive message.

## 1) Project structure

* [x] Create folders:

```
/src
  /app
  /state
  /scenario
  /metrics
  /workloads
  /data
  /ui
```

---

## 2) Types & config (Scenario schema)

* [x] `src/types/scenario.ts`

```ts
export type Scenario = {
  tree: { depth: number; breadth: number; componentTypes: ("text"|"layout"|"list")[] };
  hooks: { useStatePerComp: number; useEffectPerComp: number; useLayoutEffectPerComp: number; useMemoPerComp: number; useCallbackPerComp: number; useRefPerComp: number };
  context: { providers: number; consumersPerProvider: number; updateHz: number };
  churn: { propHz: number; stateHz: number; contextHz: number; transitionRatio: number }; // 0..1
  payload: { domNodesPerLeaf: number; listRows: number; virtualization: boolean };
  reactFlags: { strictMode: boolean };
  durationSec: number;
};
```

* [x] `src/state/config.ts` — keep scenario in React state (no 3rd-party store).

  * [x] `useScenarioConfig()` (useReducer) + localStorage persistence.
  * [x] Optional: URL param import/export helpers.

---

## 3) App shell (UI skeleton)

* [x] `src/app/App.tsx`

  * [x] Left: **Control Panel** (sliders/inputs for knobs, Start/Stop/Reset).
  * [x] Right: **Dashboard** (gauges + tiny charts + logs).
  * [x] **Panic button** clears everything and unmounts scenario.
* [x] `src/app/Root.tsx`

  * [x] Wrap generated tree with `<React.Profiler onRender={...}>`.

---

## 4) Scenario engine (mount/unmount)

* [x] `src/scenario/mountScenario.tsx`

  * [x] **Component factory**: produce components that instantiate the requested counts of hooks (`useState`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`, `useRef`).
  * [x] **Deps strategy**: some memos/callbacks stable, some unstable (invalidations).
  * [x] **Tickers**: timers to trigger state/prop/context churn at given Hz.
  * [x] **Context fabric**: chain N providers; consumers spread across the tree.
  * [x] **Tree shaper**: breadth × depth with leaves of type `text|layout|list`.
  * [x] **startTransition**: apply to a fraction of updates (`transitionRatio`).
  * [x] **Teardown**: return a disposer that clears all timers/rAF and signals unmount.

*Stub leaf kinds*

* `text`: spans with minor text churn
* `layout`: simple flex boxes with measured layout
* `list`: render N rows; simple virtualization flag to toggle slicing

---

## 5) Metrics engine (no dependencies)

* [x] `src/metrics/engine.ts`

  * [x] Simple **plugin contract**:

    ```ts
    export interface MetricPlugin {
      id: string;
      start(push: (series: string, t: number, v: number | object) => void): void;
      stop(): void;
      series: { key: string; units?: string }[];
    }
    ```
  * [x] Registry: `startAll()`, `stopAll()`.
* [ ] Built-in plugins:

  * [x] **Profiler**: from `<Profiler onRender>` push `{ actualDuration, baseDuration, commitTime }`.
  * [x] **FPS**: rAF loop, compute FPS + frame time; count jank (frame > 16.7/33ms).
  * [ ] **LongTasks**: `PerformanceObserver('longtask')`, push `{ duration }` + attribution if present.
  * [x] **Memory**: feature-detect `performance.measureUserAgentSpecificMemory()`; fallback to `performance.memory` with “experimental” label.
  * [ ] **UserTiming**: wrapper utils `mark(name)`, `measure(name, from, to)` + observer.

---

## 6) Data buffers (ring buffers)

* [x] `src/data/seriesStore.ts`

  * [x] Per-series circular buffer: `Array<{t:number,v:number|object}>` with max length (e.g., 5k).
  * [x] Single **animation-tick** dispatcher that flushes new points to UI state to avoid thrash.
  * [ ] Rolling percentiles helper (p50/p95) for frame/commit times.

---

## 7) Workloads (toggleable)

* [ ] `src/workloads/cpu.ts` — periodic JSON stringify/parse, sort/merge loops (intensity from knobs).
* [ ] `src/workloads/domList.ts` — mount big list/grid; toggle virtualization (slice).
* [ ] `src/workloads/contextStorm.ts` — drive context updates at `contextHz`.
* [ ] Start/stop integrated with scenario lifecycle.

---

## 8) Dashboard UI (no chart lib)

* [ ] `src/ui/gauges/FpsGauge.tsx` — current FPS + p95 frame time.
* [ ] `src/ui/gauges/HeapGauge.tsx` — MB (or “N/A” when unsupported).
* [ ] `src/ui/charts/TinyLine.tsx` — **Canvas 2D** line renderer (single series, fixed max points).

  * [ ] Props: `{ data: {t:number,v:number}[], yLabel?: string }`
  * [ ] Simple min/max autoscale; draw last N seconds.
* [ ] `src/ui/logs/LongTasksTable.tsx` — last 20 long tasks.

---

## 9) Start/Stop lifecycle glue

* [ ] `src/app/runController.ts`

  * [ ] `startRun(scenario)`: mount scenario → start metrics → start workloads.
  * [ ] `stopRun()`: stop workloads → stop metrics → unmount scenario → clear buffers.
  * [ ] Guard against double-start/stop.

---

## 10) Dev server headers for memory API (optional but useful)

* [ ] `vite.config.ts`: add COOP/COEP so `measureUserAgentSpecificMemory()` works in Chromium.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
})
```

* [ ] In UI, show capability badges: Memory ✓/—, LongTasks ✓/—.

---

## 11) Presets (seed scenarios)

* [ ] `src/app/presets.ts` with a few objects:

  * [ ] `idle`
  * [ ] `hookHeavy` (lots of memos/callbacks with unstable deps)
  * [ ] `contextStorm`
  * [ ] `listHeavy`
  * [ ] `cpuSpikes`
* [ ] Control Panel: dropdown to load preset; “Save current to localStorage”.

---

## 12) Minimal file checklist

* [ ] `src/main.tsx` — mount `<App />`
* [x] `src/app/App.tsx` — layout, control panel, dashboard, start/stop logic
* [x] `src/app/Root.tsx` — `<Profiler>` wrapper
* [ ] `src/state/config.ts` — scenario state + persistence
* [ ] `src/types/scenario.ts` — Scenario type
* [ ] `src/scenario/mountScenario.tsx` — generator + teardown
* [ ] `src/metrics/engine.ts` and `/metrics/plugins/*`
* [ ] `src/data/seriesStore.ts` + simple `percentiles.ts`
* [ ] `src/workloads/*`
* [ ] `src/ui/gauges/*`, `src/ui/charts/TinyLine.tsx`, `src/ui/logs/LongTasksTable.tsx`
* [ ] `vite.config.ts`, `.eslintrc.cjs`, `tsconfig.json`

---

## 13) Order of work (step-by-step)

1. [ ] Bootstrap repo + ESLint + scripts.
2. [ ] Implement Scenario type + basic Control Panel UI (inputs only, no run).
3. [ ] Implement Scenario engine (mount a tiny tree; add hook counts; add teardown).
4. [ ] Add Profiler plugin → show commit durations as numbers (no charts yet).
5. [ ] Add FPS loop → show FPS gauge.
6. [ ] Implement ring buffers → pipe Profiler + FPS into buffers.
7. [ ] Build `TinyLine` canvas component → plot FPS and commit p95.
8. [ ] Add LongTasks observer → table + count/min sparkline.
9. [ ] Add Context chain + churn knobs → verify impact in charts.
10. [ ] Add Memory plugin + capability badge + Vite headers.
11. [ ] Add List workload with virtualization toggle; add CPU workload.
12. [ ] Presets + Save/Load; Panic button polish; idle sanity check.

---

## 14) Tiny code stubs (just enough to start)

**Profiler hook-in**

```tsx
// src/app/Root.tsx
import { Profiler, ReactNode } from 'react'
import { pushMetric } from '../data/seriesStore'

export function Root({ children }: { children: ReactNode }) {
  return (
    <Profiler id="scenario" onRender={(_,phase,actualDuration,baseDuration,startTime,commitTime) => {
      const t = performance.now()
      pushMetric('profiler.actual', t, actualDuration)
      pushMetric('profiler.commit', t, commitTime - startTime)
    }}>
      {children}
    </Profiler>
  )
}
```

**FPS loop**

```ts
// src/metrics/plugins/fps.ts
let raf = 0, prev = 0
export function startFPS(push:(s:string,t:number,v:number)=>void){
  const loop = (t:number) => {
    if (prev) {
      const dt = t - prev
      push('fps.frame', t, dt)
      push('fps.value', t, 1000 / dt)
    }
    prev = t
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
}
export function stopFPS(){ cancelAnimationFrame(raf); prev = 0 }
```

**Ring buffer (simple)**

```ts
// src/data/seriesStore.ts
const MAX = 5000
const store = new Map<string, {t:number;v:any}[]>()

export function pushMetric(series:string, t:number, v:any){
  const arr = store.get(series) ?? []
  arr.push({t,v}); if (arr.length > MAX) arr.shift()
  store.set(series, arr)
}
export function useSeries(series:string){ /* expose via React state bridge */ }
```
