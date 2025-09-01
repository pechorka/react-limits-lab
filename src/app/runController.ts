import type { Scenario } from '../types/scenario'
import { mountScenario, type MountHandle } from '../scenario/mountScenario'

let handle: MountHandle | null = null
let running = false

export function startRun(scenario: Scenario, container: HTMLElement) {
  if (running) return
  running = true
  // Mount scenario first so metrics can see renders immediately.
  handle = mountScenario(container, scenario)
  // Start metrics and workloads (no-op if not implemented yet)
  import('../metrics/engine').then((m) => {
    try {
      m.startAll?.()
    } catch {}
  })
  import('../workloads').then((w) => {
    try {
      w.startAll?.(scenario)
    } catch {}
  })
}

export function stopRun() {
  if (!running) return
  running = false
  // Stop workloads and metrics if modules exist
  import('../workloads')
    .then((w) => w.stopAll?.())
    .catch(() => {})
  import('../metrics/engine')
    .then((m) => m.stopAll?.())
    .catch(() => {})
  try {
    handle?.unmount()
  } finally {
    handle = null
  }
}

export function isRunning() {
  return running
}
