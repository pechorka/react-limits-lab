import { useMemo, useState } from 'react'
import { useScenarioConfig } from '../state/config'
import type { Scenario } from '../types/scenario'
// Root Profiler is applied inside mountScenario for now
import { startRun, stopRun } from './runController'
import { useEffect, useRef } from 'react'

function SliderRow({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}) {
  const isFloat = step < 1
  const fmt = (n: number) => (isFloat ? n.toFixed(2) : Math.round(n))
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ flex: 1 }}>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 2 }}
      />
      <span style={{ width: 48, textAlign: 'right' }}>{fmt(value)}</span>
    </label>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid #eee' }}>
      <div style={{ fontWeight: 600, margin: '6px 0' }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </div>
  )
}

function ControlPanel({ scenario, updateScenario, onStart, onStop, onReset, isRunning, onPanic }: {
  scenario: Scenario
  updateScenario: (updater: (prev: Scenario) => Scenario) => void
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onPanic: () => void
  isRunning: boolean
}) {
  const toggleType = (type: 'text' | 'layout' | 'list') => {
    updateScenario((prev) => {
      const exists = prev.tree.componentTypes.includes(type)
      const next = exists
        ? prev.tree.componentTypes.filter((t) => t !== type)
        : [...prev.tree.componentTypes, type]
      return { ...prev, tree: { ...prev.tree, componentTypes: next } }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Section title="Tree">
        <SliderRow
          label="Depth"
          value={scenario.tree.depth}
          min={0}
          max={10}
          onChange={(v) => updateScenario((p) => ({ ...p, tree: { ...p.tree, depth: v } }))}
        />
        <SliderRow
          label="Breadth"
          value={scenario.tree.breadth}
          min={0}
          max={100}
          onChange={(v) => updateScenario((p) => ({ ...p, tree: { ...p.tree, breadth: v } }))}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Checkbox
            label="text"
            checked={scenario.tree.componentTypes.includes('text')}
            onChange={() => toggleType('text')}
          />
          <Checkbox
            label="layout"
            checked={scenario.tree.componentTypes.includes('layout')}
            onChange={() => toggleType('layout')}
          />
          <Checkbox
            label="list"
            checked={scenario.tree.componentTypes.includes('list')}
            onChange={() => toggleType('list')}
          />
        </div>
      </Section>

      <Section title="Hooks per component">
        <SliderRow label="useState" value={scenario.hooks.useStatePerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useStatePerComp: v } }))} />
        <SliderRow label="useEffect" value={scenario.hooks.useEffectPerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useEffectPerComp: v } }))} />
        <SliderRow label="useLayoutEffect" value={scenario.hooks.useLayoutEffectPerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useLayoutEffectPerComp: v } }))} />
        <SliderRow label="useMemo" value={scenario.hooks.useMemoPerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useMemoPerComp: v } }))} />
        <SliderRow label="useCallback" value={scenario.hooks.useCallbackPerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useCallbackPerComp: v } }))} />
        <SliderRow label="useRef" value={scenario.hooks.useRefPerComp} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, hooks: { ...p.hooks, useRefPerComp: v } }))} />
      </Section>

      <Section title="Context">
        <SliderRow label="Providers" value={scenario.context.providers} min={0} max={20} onChange={(v) => updateScenario((p) => ({ ...p, context: { ...p.context, providers: v } }))} />
        <SliderRow label="Consumers/provider" value={scenario.context.consumersPerProvider} min={0} max={50} onChange={(v) => updateScenario((p) => ({ ...p, context: { ...p.context, consumersPerProvider: v } }))} />
        <SliderRow label="Update Hz" value={scenario.context.updateHz} min={0} max={240} onChange={(v) => updateScenario((p) => ({ ...p, context: { ...p.context, updateHz: v } }))} />
      </Section>

      <Section title="Churn">
        <SliderRow label="Prop Hz" value={scenario.churn.propHz} min={0} max={240} onChange={(v) => updateScenario((p) => ({ ...p, churn: { ...p.churn, propHz: v } }))} />
        <SliderRow label="State Hz" value={scenario.churn.stateHz} min={0} max={240} onChange={(v) => updateScenario((p) => ({ ...p, churn: { ...p.churn, stateHz: v } }))} />
        <SliderRow label="Context Hz" value={scenario.churn.contextHz} min={0} max={240} onChange={(v) => updateScenario((p) => ({ ...p, churn: { ...p.churn, contextHz: v } }))} />
        <SliderRow
          label="Transition ratio"
          value={scenario.churn.transitionRatio}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateScenario((p) => ({ ...p, churn: { ...p.churn, transitionRatio: v } }))}
        />
      </Section>

      <Section title="Payload">
        <SliderRow label="DOM nodes/leaf" value={scenario.payload.domNodesPerLeaf} min={0} max={200} onChange={(v) => updateScenario((p) => ({ ...p, payload: { ...p.payload, domNodesPerLeaf: v } }))} />
        <SliderRow label="List rows" value={scenario.payload.listRows} min={0} max={20000} onChange={(v) => updateScenario((p) => ({ ...p, payload: { ...p.payload, listRows: v } }))} />
        <Checkbox label="Virtualization" checked={scenario.payload.virtualization} onChange={(v) => updateScenario((p) => ({ ...p, payload: { ...p.payload, virtualization: v } }))} />
      </Section>

      <Section title="React flags">
        <Checkbox label="StrictMode" checked={scenario.reactFlags.strictMode} onChange={(v) => updateScenario((p) => ({ ...p, reactFlags: { ...p.reactFlags, strictMode: v } }))} />
      </Section>

      <Section title="Run">
        <SliderRow label="Duration (sec)" value={scenario.durationSec} min={1} max={3600} onChange={(v) => updateScenario((p) => ({ ...p, durationSec: v }))} />

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={onStart} disabled={isRunning}>
            Start
          </button>
          <button onClick={onStop} disabled={!isRunning}>
            Stop
          </button>
          <button onClick={onReset} disabled={isRunning}>
            Reset
          </button>
          <button onClick={onPanic} style={{ marginLeft: 'auto', background: '#fee', borderColor: '#f66' }}>
            Panic
          </button>
        </div>
      </Section>
    </div>
  )
}

import { useSeries } from '../data/seriesStore'
import HeapGauge from '../ui/gauges/HeapGauge'

function Dashboard({ isRunning, runWindow }: { isRunning: boolean; runWindow: { start: number; end?: number } | null }) {
  const fpsSeries = useSeries('fps.value')
  const frameSeries = useSeries('fps.frame')
  const commitSeries = useSeries('profiler.commit')

  const windowMs = 3000
  const nowFps = fpsSeries.length ? fpsSeries[fpsSeries.length - 1].t : performance.now()
  const nowCommit = commitSeries.length ? commitSeries[commitSeries.length - 1].t : performance.now()

  function stats(series: { t: number; v: any }[], now: number) {
    const start = now - windowMs
    let min = Infinity,
      max = -Infinity,
      sum = 0,
      n = 0
    for (let i = series.length - 1; i >= 0; i--) {
      const p = series[i]
      if (p.t < start) break
      const val = typeof p.v === 'number' ? p.v : Number(p.v)
      if (!Number.isFinite(val)) continue
      if (val < min) min = val
      if (val > max) max = val
      sum += val
      n++
    }
    if (n === 0) return { avg: undefined as number | undefined, min: undefined as number | undefined, max: undefined as number | undefined, n }
    return { avg: sum / n, min, max, n }
  }

  const fpsStats = stats(fpsSeries, nowFps)
  const commitStats = stats(commitSeries, nowCommit)

  // Compute last run summary when stopped and we have a closed window
  const lastSummary = useMemo(() => {
    if (!runWindow || runWindow.end == null) return null
    const { start, end } = runWindow
    const inWindow = (p: { t: number }) => p.t >= start && p.t <= end

    function summarize(series: { t: number; v: any }[]) {
      const values: number[] = []
      for (let i = 0; i < series.length; i++) {
        const p = series[i]
        if (!inWindow(p)) continue
        const val = typeof p.v === 'number' ? p.v : Number(p.v)
        if (Number.isFinite(val)) values.push(val)
      }
      if (values.length === 0) return { count: 0, avg: NaN, p95: NaN, min: NaN, max: NaN }
      let sum = 0,
        min = Infinity,
        max = -Infinity
      for (const v of values) {
        sum += v
        if (v < min) min = v
        if (v > max) max = v
      }
      const sorted = values.slice().sort((a, b) => a - b)
      const idx95 = Math.max(0, Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1))))
      return { count: values.length, avg: sum / values.length, p95: sorted[idx95], min, max }
    }

    const frames = summarize(frameSeries)
    const fps = summarize(fpsSeries)
    const commits = summarize(commitSeries)

    // Jank thresholds: >16.7ms (60Hz) and >33ms (30Hz)
    let jank16 = 0,
      jank33 = 0
    for (let i = 0; i < frameSeries.length; i++) {
      const p = frameSeries[i]
      if (!inWindow(p)) continue
      const v = Number(p.v)
      if (!Number.isFinite(v)) continue
      if (v > 16.7) jank16++
      if (v > 33) jank33++
    }

    return {
      durationSec: (end - start) / 1000,
      avgFps: fps.count ? fps.avg : NaN,
      p95FrameMs: frames.count ? frames.p95 : NaN,
      avgCommitMs: commits.count ? commits.avg : NaN,
      p95CommitMs: commits.count ? commits.p95 : NaN,
      frames: frames.count,
      commits: commits.count,
      jank16,
      jank33,
    }
  }, [runWindow, frameSeries, fpsSeries, commitSeries])

  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#444' }
  const numStyle: React.CSSProperties = {
    fontSize: 24,
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum" 1',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#111',
  }
  const rowStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'baseline' }
  const cardStyle: React.CSSProperties = { padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#111' }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {!isRunning && lastSummary && (
        <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fafafa', color: '#111' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Last run summary</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontVariantNumeric: 'tabular-nums' }}>
            <div><span style={labelStyle}>Duration</span><div style={numStyle}>{lastSummary.durationSec.toFixed(1)}s</div></div>
            <div><span style={labelStyle}>Avg FPS</span><div style={numStyle}>{Number.isFinite(lastSummary.avgFps) ? lastSummary.avgFps.toFixed(1) : '—'}</div></div>
            <div><span style={labelStyle}>p95 frame</span><div style={numStyle}>{Number.isFinite(lastSummary.p95FrameMs) ? lastSummary.p95FrameMs.toFixed(2) : '—'} ms</div></div>
            <div><span style={labelStyle}>Avg commit</span><div style={numStyle}>{Number.isFinite(lastSummary.avgCommitMs) ? lastSummary.avgCommitMs.toFixed(2) : '—'} ms</div></div>
            <div><span style={labelStyle}>p95 commit</span><div style={numStyle}>{Number.isFinite(lastSummary.p95CommitMs) ? lastSummary.p95CommitMs.toFixed(2) : '—'} ms</div></div>
            <div><span style={labelStyle}>Frames</span><div style={numStyle}>{lastSummary.frames}</div></div>
            <div><span style={labelStyle}>Commits</span><div style={numStyle}>{lastSummary.commits}</div></div>
            <div><span style={labelStyle}>Jank &gt;16.7ms</span><div style={numStyle}>{lastSummary.jank16}</div></div>
            <div><span style={labelStyle}>Jank &gt;33ms</span><div style={numStyle}>{lastSummary.jank33}</div></div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={labelStyle}>FPS (avg/min/max, 3s)</div>
          <div style={rowStyle}>
            <span style={numStyle}>{isRunning ? (fpsStats.avg != null ? Math.round(fpsStats.avg) : '…') : '—'}</span>
            <span style={{ ...labelStyle, marginLeft: 'auto' }}>min</span>
            <span style={numStyle}>{isRunning ? (fpsStats.min != null ? Math.round(fpsStats.min) : '…') : '—'}</span>
            <span style={{ ...labelStyle }}>max</span>
            <span style={numStyle}>{isRunning ? (fpsStats.max != null ? Math.round(fpsStats.max) : '…') : '—'}</span>
          </div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={labelStyle}>Commit (ms avg/min/max, 3s)</div>
          <div style={rowStyle}>
            <span style={numStyle}>
              {isRunning ? (commitStats.avg != null ? commitStats.avg.toFixed(2) : '…') : '—'}
            </span>
            <span style={{ ...labelStyle, marginLeft: 'auto' }}>min</span>
            <span style={numStyle}>{isRunning ? (commitStats.min != null ? commitStats.min.toFixed(2) : '…') : '—'}</span>
            <span style={{ ...labelStyle }}>max</span>
            <span style={numStyle}>{isRunning ? (commitStats.max != null ? commitStats.max.toFixed(2) : '…') : '—'}</span>
          </div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={labelStyle}>Long tasks</div>
          <div style={numStyle}>{isRunning ? '…' : '0'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <HeapGauge />
        </div>
      </div>

      <div style={{ ...cardStyle, height: 160, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666' }}>FPS (last N sec)</div>
        <div style={{ height: 120, display: 'grid', placeItems: 'center', color: '#999' }}>TinyLine placeholder</div>
      </div>

      <div style={{ ...cardStyle, height: 160, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666' }}>Commit time p95</div>
        <div style={{ height: 120, display: 'grid', placeItems: 'center', color: '#999' }}>TinyLine placeholder</div>
      </div>

      <div style={{ ...cardStyle, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Long Tasks (last 20)</div>
        <div style={{ color: '#999' }}>Table placeholder</div>
      </div>
    </div>
  )
}

export default function App() {
  const { scenario, updateScenario, reset } = useScenarioConfig()
  const [isRunning, setIsRunning] = useState(false)
  const [runWindow, setRunWindow] = useState<{ start: number; end?: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const onStart = () => setIsRunning(true)
  const onStop = () => setIsRunning(false)
  const onReset = () => {
    if (!isRunning) reset()
  }
  const onPanic = () => {
    try {
      localStorage.removeItem('rlab.scenario.v1')
    } catch {}
    setIsRunning(false)
    stopRun()
    reset()
    setRunWindow(null)
  }

  // Orchestrate run start/stop with imperative mount into containerRef
  // Also enforce auto-stop based on scenario.durationSec
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let durationTimer: number | undefined

    if (isRunning) {
      startRun(scenario, el)
      setRunWindow({ start: performance.now() })
      const ms = Math.max(0, Math.floor(scenario.durationSec * 1000))
      if (ms > 0 && Number.isFinite(ms)) {
        durationTimer = window.setTimeout(() => {
          setIsRunning(false)
        }, ms)
      }
    } else {
      stopRun()
      // Close the run window if it's open
      setRunWindow((w) => (w && w.end == null ? { ...w, end: performance.now() } : w))
    }
    return () => {
      if (durationTimer) clearTimeout(durationTimer)
      // Ensure teardown if component unmounts while running
      stopRun()
    }
  }, [isRunning, scenario])

  const containerStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: '360px 1fr',
      gap: 16,
      height: '100%',
      padding: 16,
      boxSizing: 'border-box' as const,
    }),
    [],
  )

  return (
    <div style={containerStyle}>
      <div style={{ borderRight: '1px solid #eee', paddingRight: 16 }}>
        <ControlPanel
          scenario={scenario}
          updateScenario={updateScenario}
          onStart={onStart}
          onStop={onStop}
          onReset={onReset}
          onPanic={onPanic}
          isRunning={isRunning}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 16 }}>
        <Dashboard isRunning={isRunning} runWindow={runWindow} />

        <div style={{ border: '1px dashed #ccc', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Scenario Mount</div>
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  )
}
