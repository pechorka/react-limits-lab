import type { MetricPlugin } from '../engine'

// Memory metrics plugin
// - Prefers performance.measureUserAgentSpecificMemory() when available
// - Falls back to performance.memory (Chrome-specific, experimental)
// - Samples at ~1 Hz to avoid overhead

let intervalId: number | null = null
let inFlight = false
let uaStatus: 'unknown' | 'ok' | 'broken' = 'unknown'

function toMB(bytes: number) {
  return bytes / (1024 * 1024)
}

const plugin: MetricPlugin = {
  id: 'memory',
  series: [
    { key: 'memory.ua.bytes', units: 'bytes' },
    { key: 'memory.ua.mb', units: 'MB' },
    { key: 'memory.heap.used_mb', units: 'MB' },
    { key: 'memory.heap.total_mb', units: 'MB' },
    { key: 'memory.heap.limit_mb', units: 'MB' },
  ],
  start(push) {
    const perf: any = performance as any
    const hasUA = typeof perf.measureUserAgentSpecificMemory === 'function'
    const hasHeap = typeof perf.memory === 'object' && perf.memory

    const tick = async () => {
      const t = performance.now()
      let usedUA = false
      if (hasUA && uaStatus !== 'broken') {
        if (inFlight) return
        inFlight = true
        try {
          const fn = perf.measureUserAgentSpecificMemory as () => Promise<{ bytes: number; breakdown?: any }>
          const res = await fn()
          if (res && typeof res.bytes === 'number') {
            push('memory.ua.bytes', t, res.bytes)
            push('memory.ua.mb', t, toMB(res.bytes))
            uaStatus = 'ok'
            usedUA = true
          }
        } catch {
          // If UA path errors (e.g., not fully cross-origin isolated), mark broken and fall back
          uaStatus = 'broken'
        } finally {
          inFlight = false
        }
      }

      if (!usedUA && hasHeap) {
        // Chrome non-standard experimental API
        try {
          const mem = perf.memory as {
            usedJSHeapSize: number
            totalJSHeapSize: number
            jsHeapSizeLimit: number
          }
          if (mem && typeof mem.usedJSHeapSize === 'number') {
            push('memory.heap.used_mb', t, toMB(mem.usedJSHeapSize))
            push('memory.heap.total_mb', t, toMB(mem.totalJSHeapSize))
            push('memory.heap.limit_mb', t, toMB(mem.jsHeapSizeLimit))
          }
        } catch {
          // ignore
        }
      }
    }

    // Initial sample shortly after start to allow UI to show capability
    intervalId = window.setInterval(tick, 1000)
    // Kick once immediately
    void tick()
  },
  stop() {
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
    inFlight = false
    uaStatus = 'unknown'
  },
}

export default plugin
