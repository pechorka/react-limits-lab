// Minimal no-op metrics engine to allow runController wiring.
// Will be expanded with plugins in the Metrics task.
export interface MetricPlugin {
  id: string
  start: (push: (series: string, t: number, v: number | object) => void) => void
  stop: () => void
  series: { key: string; units?: string }[]
}

const registry: MetricPlugin[] = []

export function register(plugin: MetricPlugin) {
  registry.push(plugin)
}

function push(_series: string, _t: number, _v: number | object) {
  // Placeholder; will bridge to seriesStore later
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

