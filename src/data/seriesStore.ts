import { useSyncExternalStore, useMemo } from 'react'

export type Point = { t: number; v: number | object }

const MAX = 5000
const store = new Map<string, Point[]>()

let dirty = false
const subscribers = new Set<() => void>()

function ensureArray(series: string) {
  let arr = store.get(series)
  if (!arr) {
    arr = []
    store.set(series, arr)
  }
  return arr
}

export function pushMetric(series: string, t: number, v: number | object) {
  const arr = ensureArray(series)
  arr.push({ t, v })
  if (arr.length > MAX) arr.splice(0, arr.length - MAX)
  dirty = true
}

function tick() {
  if (dirty) {
    dirty = false
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
  const get = () => ensureArray(series)
  return useSyncExternalStore(subscribe, get, get)
}

export function useLatest(series: string): Point | undefined {
  const arr = useSeries(series)
  return useMemo(() => (arr.length ? arr[arr.length - 1] : undefined), [arr])
}
