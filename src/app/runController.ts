import type { Scenario } from '../types/scenario'
import { mountScenario, type MountHandle } from '../scenario/mountScenario'
import { startAll as startMetrics, stopAll as stopMetrics } from '../metrics/engine'
import { startAll as startWorkloads, stopAll as stopWorkloads } from '../workloads'

let handle: MountHandle | null = null
let running = false

export function startRun(scenario: Scenario, container: HTMLElement) {
  if (running) return
  running = true
  // Mount scenario first so metrics can see renders immediately.
  handle = mountScenario(container, scenario)
  // Start metrics and workloads
  try {
    startMetrics()
  } catch {}
  try {
    startWorkloads(scenario)
  } catch {}
}

export function stopRun() {
  if (!running) return
  running = false
  // Stop workloads and metrics
  try {
    stopWorkloads()
  } catch {}
  try {
    stopMetrics()
  } catch {}
  try {
    handle?.unmount()
  } finally {
    handle = null
  }
}

export function isRunning() {
  return running
}
