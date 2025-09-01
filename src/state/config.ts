import { useCallback, useEffect, useReducer } from 'react'
import { Scenario, defaultScenario } from '../types/scenario'

const STORAGE_KEY = 'rlab.scenario.v1'
const URL_PARAM = 'scenario'

type Action =
  | { type: 'set'; payload: Scenario }
  | { type: 'update'; updater: (prev: Scenario) => Scenario }
  | { type: 'reset' }

function reducer(state: Scenario, action: Action): Scenario {
  switch (action.type) {
    case 'set':
      return action.payload
    case 'update':
      return action.updater(state)
    case 'reset':
      return defaultScenario
    default:
      return state
  }
}

function loadFromStorage(): Scenario | null {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Scenario
  } catch {
    return null
  }
}

function saveToStorage(s: Scenario) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    }
  } catch {
    // ignore persistence errors
  }
}

function tryImportFromUrl(): Scenario | null {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const param = url.searchParams.get(URL_PARAM)
  if (!param) return null
  try {
    // Prefer base64-encoded JSON, fallback to plain JSON in param
    let json: string
    try {
      json = atob(param)
    } catch {
      json = param
    }
    const parsed = JSON.parse(json) as Scenario
    return parsed
  } catch {
    return null
  }
}

function buildExportUrl(s: Scenario): string {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  const encoded = btoa(JSON.stringify(s))
  url.searchParams.set(URL_PARAM, encoded)
  return url.toString()
}

export function useScenarioConfig(initial?: Scenario) {
  const [scenario, dispatch] = useReducer(
    reducer,
    undefined as unknown as Scenario,
    () => tryImportFromUrl() || loadFromStorage() || initial || defaultScenario,
  )

  useEffect(() => {
    saveToStorage(scenario)
  }, [scenario])

  const setScenario = useCallback((next: Scenario) => {
    dispatch({ type: 'set', payload: next })
  }, [])

  const updateScenario = useCallback((updater: (prev: Scenario) => Scenario) => {
    dispatch({ type: 'update', updater })
  }, [])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const exportToUrl = useCallback(() => buildExportUrl(scenario), [scenario])

  const importFromUrl = useCallback(() => {
    const parsed = tryImportFromUrl()
    if (parsed) {
      dispatch({ type: 'set', payload: parsed })
      return true
    }
    return false
  }, [])

  return { scenario, setScenario, updateScenario, reset, exportToUrl, importFromUrl }
}

