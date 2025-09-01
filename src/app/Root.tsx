import { Profiler } from 'react'
import type { ReactNode } from 'react'

// Lightweight Profiler wrapper. Metrics wiring will be added later.
export function Root({ children }: { children: ReactNode }) {
  return (
    <Profiler
      id="scenario"
      onRender={(
        _id,
        _phase,
        _actualDuration,
        _baseDuration,
        _startTime,
        _commitTime,
      ) => {
        // Intentionally no-op for now; metrics engine hooks in later.
      }}
    >
      {children}
    </Profiler>
  )
}

export default Root
