import { useSyncExternalStore, useMemo } from 'react'

export type Point = { t: number; v: number | object }

const MAX = 5000
// Mutable data arrays per series
const data = new Map<string, Point[]>()
// Immutable snapshots per series (used by getSnapshot)
const snapshots = new Map<string, Point[]>()

// Track which series have changed since last tick
const dirtySeries = new Set<string>()
const subscribers = new Set<() => void>()

function ensureArray(series: string) {
  let arr = data.get(series)
  if (!arr) {
    arr = []
    data.set(series, arr)
    snapshots.set(series, arr)
  }
  return arr
}

export function pushMetric(series: string, t: number, v: number | object) {
  const arr = ensureArray(series)
  arr.push({ t, v })
  if (arr.length > MAX) arr.splice(0, arr.length - MAX)
  dirtySeries.add(series)
}

function tick() {
  if (dirtySeries.size) {
    // Commit new immutable snapshots only for changed series
    dirtySeries.forEach((s) => {
      const arr = data.get(s)!
      // Create a shallow copy to change identity
      snapshots.set(s, arr.slice())
    })
    dirtySeries.clear()
    subscribers.forEach((fn) => {
      try {
        fn()
      } catch {}
    })
  }
  requestAnimationFrame(tick)
}

// Start the dispatcher loop once
requestAnimationFrame(tick)

function subscribe(cb: () => void) {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

export function useSeries(series: string): Point[] {
  const get = () => snapshots.get(series) ?? ensureArray(series)
  return useSyncExternalStore(subscribe, get, get)
}

export function useLatest(series: string): Point | undefined {
  const arr = useSeries(series)
  return useMemo(() => (arr.length ? arr[arr.length - 1] : undefined), [arr])
}
