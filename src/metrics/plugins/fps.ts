import type { MetricPlugin } from '../engine'

let raf = 0
let prev = 0

const plugin: MetricPlugin = {
  id: 'fps',
  series: [
    { key: 'fps.frame', units: 'ms' },
    { key: 'fps.value', units: 'hz' },
  ],
  start(push) {
    const loop = (t: number) => {
      if (prev) {
        const dt = t - prev
        push('fps.frame', t, dt)
        push('fps.value', t, 1000 / dt)
      }
      prev = t
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  },
  stop() {
    cancelAnimationFrame(raf)
    prev = 0
    raf = 0
  },
}

export default plugin

