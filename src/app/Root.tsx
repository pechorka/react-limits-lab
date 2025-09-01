import { Profiler } from 'react'
import type { ReactNode } from 'react'
import { pushMetric } from '../data/seriesStore'

// Lightweight Profiler wrapper. Metrics wiring will be added later.
export function Root({ children }: { children: ReactNode }) {
  return (
    <Profiler
      id="scenario"
      onRender={(
        _id,
        _phase,
        actualDuration,
        _baseDuration,
        startTime,
        commitTime,
      ) => {
        const t = performance.now()
        pushMetric('profiler.actual', t, actualDuration)
        pushMetric('profiler.commit', t, commitTime - startTime)
      }}
    >
      {children}
    </Profiler>
  )
}

export default Root
