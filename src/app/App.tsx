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

function Dashboard({ isRunning }: { isRunning: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>FPS</div>
          <div style={{ fontSize: 24 }}>{isRunning ? '…' : '—'}</div>
        </div>
        <div style={{ flex: 1, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Heap (MB)</div>
          <div style={{ fontSize: 24 }}>{isRunning ? '…' : '—'}</div>
        </div>
        <div style={{ flex: 1, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Long tasks</div>
          <div style={{ fontSize: 24 }}>{isRunning ? '…' : 0}</div>
        </div>
      </div>

      <div style={{ height: 160, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666' }}>FPS (last N sec)</div>
        <div style={{ height: 120, display: 'grid', placeItems: 'center', color: '#999' }}>TinyLine placeholder</div>
      </div>

      <div style={{ height: 160, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666' }}>Commit time p95</div>
        <div style={{ height: 120, display: 'grid', placeItems: 'center', color: '#999' }}>TinyLine placeholder</div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Long Tasks (last 20)</div>
        <div style={{ color: '#999' }}>Table placeholder</div>
      </div>
    </div>
  )
}

export default function App() {
  const { scenario, updateScenario, reset } = useScenarioConfig()
  const [isRunning, setIsRunning] = useState(false)
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
  }

  // Orchestrate run start/stop with imperative mount into containerRef
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (isRunning) {
      startRun(scenario, el)
    } else {
      stopRun()
    }
    return () => {
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
        <Dashboard isRunning={isRunning} />

        <div style={{ border: '1px dashed #ccc', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Scenario Mount</div>
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  )
}
