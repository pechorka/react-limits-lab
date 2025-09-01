import React, {
  createContext,
  memo,
  startTransition,
  StrictMode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from 'react'
import { createRoot, Root as DomRoot } from 'react-dom/client'
import type { Scenario } from '../types/scenario'

// Public API
// - ScenarioView: React component that renders a scenario tree.
// - mountScenario(container, scenario): imperatively mount a scenario and get an unmount handle.

// Pulse contexts used to drive churn across the tree without per-component timers
const StatePulseContext = createContext(0)

// Build an array of Contexts to form a provider chain. Each provider value is a number pulse.
function useContextFabric(count: number) {
  const contexts = useMemo(() => Array.from({ length: count }, () => createContext(0)), [count])
  return contexts
}

// Utility: schedule a state update possibly wrapped in startTransition based on ratio 0..1
function schedule(update: () => void, transitionRatio: number) {
  if (transitionRatio > 0 && Math.random() < transitionRatio) {
    startTransition(update)
  } else {
    update()
  }
}

// Hook factory: instantiate the requested counts of hooks within a component.
function useHookFactory(config: Scenario['hooks'], depsSeed: number, statePulse: number) {
  const { useStatePerComp, useEffectPerComp, useLayoutEffectPerComp, useMemoPerComp, useCallbackPerComp, useRefPerComp } =
    config

  // Refs
  const refs = useMemo(() => Array.from({ length: useRefPerComp }, (_, i) => i), [useRefPerComp])
  refs.forEach(() => useRef<number | null>(null))

  // States (keep a small array to optionally churn one of them on pulse)
  const stateSlots = useMemo(() => Array.from({ length: useStatePerComp }, (_, i) => i), [useStatePerComp])
  const states = stateSlots.map(() => useState(0)) // array of [value,setter]

  // Update exactly one state on each pulse to simulate state churn without exploding work
  useEffect(() => {
    if (stateSlots.length === 0) return
    const idx = statePulse % stateSlots.length
    const setter = states[idx][1]
    setter((v) => v + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statePulse])

  // Memo/callback deps strategy: half stable, half unstable on depsSeed
  const unstableCountMemo = Math.floor(useMemoPerComp / 2)
  const unstableCountCb = Math.floor(useCallbackPerComp / 2)

  for (let i = 0; i < useMemoPerComp; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => i * 2 + depsSeed, i < unstableCountMemo ? [depsSeed] : [])
  }
  for (let i = 0; i < useCallbackPerComp; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback(() => {}, i < unstableCountCb ? [depsSeed] : [])
  }

  // Effects: half depend on depsSeed, half empty
  for (let i = 0; i < useEffectPerComp; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return () => {}
    }, i % 2 === 0 ? [depsSeed] : [])
  }
  for (let i = 0; i < useLayoutEffectPerComp; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      return () => {}
    }, i % 2 === 0 ? [depsSeed] : [])
  }
}

// Leaf stubs
function TextLeaf({ domNodes, seed }: { domNodes: number; seed: number }) {
  const nodes = useMemo(() => Array.from({ length: domNodes }, (_, i) => i), [domNodes])
  return (
    <span>
      {nodes.map((i) => (
        <span key={i} style={{ padding: 2 }}>
          txt-{i}-{seed % 100}
        </span>
      ))}
    </span>
  )
}

function LayoutLeaf({ domNodes, seed }: { domNodes: number; seed: number }) {
  const boxes = useMemo(() => Array.from({ length: Math.max(1, domNodes) }, (_, i) => i), [domNodes])
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {boxes.map((i) => (
        <div key={i} style={{ width: 16 + ((seed + i) % 8), height: 16, background: '#eef', border: '1px solid #ccd' }} />
      ))}
    </div>
  )
}

function ListLeaf({ rows, virtualization, seed }: { rows: number; virtualization: boolean; seed: number }) {
  const visible = 40
  const start = virtualization ? Math.max(0, Math.min(Math.max(0, rows - visible), seed % Math.max(1, rows - visible))) : 0
  const end = virtualization ? Math.min(rows, start + visible) : rows
  const items = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows])
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      {items.slice(start, end).map((i) => (
        <div key={i} style={{ padding: '2px 4px', border: '1px solid #eee' }}>
          row {i} · {seed % 100}
        </div>
      ))}
    </div>
  )
}

type NodeProps = {
  level: number
  maxDepth: number
  breadth: number
  hooks: Scenario['hooks']
  componentTypes: Scenario['tree']['componentTypes']
  payload: Scenario['payload']
  depsSeed: number
  contextConsumersPerProvider: number
  providerContexts: React.Context<number>[]
}

const Node = memo(function Node(props: NodeProps) {
  const {
    level,
    maxDepth,
    breadth,
    hooks,
    componentTypes,
    payload,
    depsSeed,
    contextConsumersPerProvider,
    providerContexts,
  } = props

  const statePulse = useContext(StatePulseContext)
  useHookFactory(hooks, depsSeed, statePulse)

  const isLeaf = level >= maxDepth
  const type = componentTypes[(depsSeed + level) % Math.max(1, componentTypes.length)]

  const consumers = useMemo(
    () => Array.from({ length: contextConsumersPerProvider * Math.max(1, providerContexts.length) }, (_, i) => i),
    [contextConsumersPerProvider, providerContexts.length],
  )

  const Leaf = () => {
    switch (type) {
      case 'text':
        return <TextLeaf domNodes={payload.domNodesPerLeaf} seed={depsSeed} />
      case 'layout':
        return <LayoutLeaf domNodes={payload.domNodesPerLeaf} seed={depsSeed} />
      case 'list':
        return <ListLeaf rows={payload.listRows} virtualization={payload.virtualization} seed={depsSeed} />
      default:
        return null
    }
  }

  // Render consumers at leaves to spread them across the tree; cheap readers of context values
  const Consumers = () => (
    <>
      {consumers.map((i) => {
        const Ctx = providerContexts[i % Math.max(1, providerContexts.length)]
        const v = useContext(Ctx)
        return (
          <span key={i} data-consumer={i} style={{ display: 'none' }}>
            {v}
          </span>
        )
      })}
    </>
  )

  if (isLeaf) {
    return (
      <div>
        <Leaf />
        <Consumers />
      </div>
    )
  }

  const kids = useMemo(() => Array.from({ length: breadth }, (_, i) => i), [breadth])
  return (
    <div style={{ paddingLeft: 4 }}>
      {kids.map((i) => (
        <Node
          key={i}
          level={level + 1}
          maxDepth={maxDepth}
          breadth={breadth}
          hooks={hooks}
          componentTypes={componentTypes}
          payload={payload}
          depsSeed={depsSeed * 31 + i}
          contextConsumersPerProvider={contextConsumersPerProvider}
          providerContexts={providerContexts}
        />
      ))}
    </div>
  )
})

function ProviderChain({ contexts, value, children }: { contexts: React.Context<number>[]; value: number; children: React.ReactNode }) {
  // Nest providers sequentially
  return contexts.reduceRight((acc, Ctx, i) => <Ctx.Provider value={value + i}>{acc}</Ctx.Provider>, children as React.ReactNode)
}

export function ScenarioView({ scenario }: { scenario: Scenario }) {
  const { tree, hooks, context, churn, payload } = scenario

  const providerContexts = useContextFabric(context.providers)

  const [propSeed, setPropSeed] = useState(0)
  const [statePulse, setStatePulse] = useState(0)
  const [contextPulse, setContextPulse] = useState(0)

  // Tickers
  useEffect(() => {
    const timers: number[] = []
    const makeTimer = (hz: number, fn: () => void) => {
      if (hz > 0) {
        const interval = Math.max(1, Math.floor(1000 / hz))
        const id = window.setInterval(fn, interval)
        timers.push(id)
      }
    }
    makeTimer(churn.propHz, () => schedule(() => setPropSeed((s) => s + 1), churn.transitionRatio))
    makeTimer(churn.stateHz, () => schedule(() => setStatePulse((s) => s + 1), churn.transitionRatio))
    makeTimer(churn.contextHz || context.updateHz, () => schedule(() => setContextPulse((s) => s + 1), churn.transitionRatio))
    return () => {
      timers.forEach((t) => clearInterval(t))
    }
  }, [churn.propHz, churn.stateHz, churn.contextHz, churn.transitionRatio, context.updateHz])

  return (
    <StatePulseContext.Provider value={statePulse}>
      <ProviderChain contexts={providerContexts} value={contextPulse}>
        <Node
          level={0}
          maxDepth={tree.depth}
          breadth={tree.breadth}
          hooks={hooks}
          componentTypes={tree.componentTypes}
          payload={payload}
          depsSeed={propSeed}
          contextConsumersPerProvider={context.consumersPerProvider}
          providerContexts={providerContexts}
        />
      </ProviderChain>
    </StatePulseContext.Provider>
  )
}

export type MountHandle = { unmount: () => void; root: DomRoot }

export function mountScenario(container: HTMLElement, scenario: Scenario): MountHandle {
  const root = createRoot(container)
  const element = (
    <StrictMode>
      <ScenarioView scenario={scenario} />
    </StrictMode>
  )
  root.render(element)
  return { root, unmount: () => root.unmount() }
}
