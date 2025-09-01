// Minimal metrics engine with a simple plugin registry.
// Uses seriesStore to push measurements.
export interface MetricPlugin {
  id: string
  start: (push: (series: string, t: number, v: number | object) => void) => void
  stop: () => void
  series: { key: string; units?: string }[]
}

import { pushMetric } from '../data/seriesStore'
import fpsPlugin from './plugins/fps'
import memoryPlugin from './plugins/memory'

const registry: MetricPlugin[] = []
let started = false

export function register(plugin: MetricPlugin) {
  registry.push(plugin)
}

function push(series: string, t: number, v: number | object) {
  pushMetric(series, t, v)
}

export function startAll() {
  if (started) return
  started = true
  registry.forEach((p) => {
    try {
      p.start(push)
    } catch {}
  })
}

export function stopAll() {
  if (!started) return
  registry.forEach((p) => {
    try {
      p.stop()
    } catch {}
  })
  started = false
}

// Register built-in plugins
register(fpsPlugin)
register(memoryPlugin)
