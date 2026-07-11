import { useState, useEffect } from 'react'

export function createStore<T>(initialState: T) {
  let state = initialState
  const listeners = new Set<React.Dispatch<React.SetStateAction<T>>>()

  const get = () => state
  const set = (updater: T | ((prev: T) => T)) => {
    state = typeof updater === 'function' ? (updater as any)(state) : updater
    listeners.forEach((l) => l(state))
  }

  const useStore = () => {
    const [localState, setLocalState] = useState<T>(state)
    useEffect(() => {
      listeners.add(setLocalState)
      return () => {
        listeners.delete(setLocalState)
      }
    }, [])
    return [localState, set] as const
  }

  return { get, set, useStore }
}

const uiStore = createStore({ sidebarCollapsed: false })

export default function useMainStore() {
  const [state, setState] = uiStore.useStore()
  return {
    sidebarCollapsed: state.sidebarCollapsed,
    toggleSidebar: () => setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),
  }
}
