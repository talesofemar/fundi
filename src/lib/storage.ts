import type { AppState } from '../types'
import { createSeedState } from '../data/seed'

const KEY = 'fundi_demo_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.workers?.length) return createSeedState()
    return parsed
  } catch {
    return createSeedState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetState(): AppState {
  const fresh = createSeedState()
  saveState(fresh)
  return fresh
}
