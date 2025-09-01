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

const registry: MetricPlugin[] = []

export function register(plugin: MetricPlugin) {
  registry.push(plugin)
}

function push(series: string, t: number, v: number | object) {
  pushMetric(series, t, v)
}

export function startAll() {
  registry.forEach((p) => {
    try {
      p.start(push)
    } catch {}
  })
}

export function stopAll() {
  registry.forEach((p) => {
    try {
      p.stop()
    } catch {}
  })
}

// Register built-in plugins
register(fpsPlugin)
