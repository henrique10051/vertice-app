import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type {
  CustomTracker,
  CustomTrackerEntry,
  TrackerField,
} from '@/services/custom-trackers-schema'

// Sanitize fields helper
export function sanitizeFieldName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9_]/g, '_') // Substitui caracteres especiais/espaços por sublinhado
    .replace(/_+/g, '_') // Remove sublinhados duplicados
}

interface CustomTrackersState {
  customTrackers: Record<string, CustomTracker>
  trackerEntries: Record<string, CustomTrackerEntry[]> // trackerId -> Entry[]
  isDirty: boolean
  loading: boolean

  // Template Actions
  addCustomTracker: (
    tracker: Omit<CustomTracker, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<CustomTracker>
  updateCustomTracker: (
    id: string,
    updates: Partial<Omit<CustomTracker, 'id' | 'created_at'>>,
  ) => Promise<void>
  deleteCustomTracker: (id: string) => Promise<void>

  // Entry Actions
  addTrackerEntry: (
    trackerId: string,
    entry: Omit<CustomTrackerEntry, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<CustomTrackerEntry>
  deleteTrackerEntry: (trackerId: string, entryId: string) => Promise<void>

  // Sync Logic
  setClean: () => void
  syncWithBackend: (userId: string) => Promise<{ success: boolean; error: string | null }>
  loadFromBackend: (userId: string) => Promise<void>
}

export const useCustomTrackersStore = create<CustomTrackersState>()(
  persist(
    (set, get) => ({
      customTrackers: {},
      trackerEntries: {},
      isDirty: false,
      loading: false,

      // --- TEMPLATES ---
      addCustomTracker: async (trackerData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()

        // Sanitize field names in validation schema
        const sanitizedValidation: TrackerField[] = trackerData.validation.map((field) => ({
          ...field,
          name: sanitizeFieldName(field.name),
          subFields: field.subFields?.map((sub) => ({
            ...sub,
            name: sanitizeFieldName(sub.name),
          })),
        }))

        const newTracker: CustomTracker = {
          ...trackerData,
          id,
          validation: sanitizedValidation,
          created_at: now,
          updated_at: now,
        }

        set((state) => ({
          customTrackers: { ...state.customTrackers, [id]: newTracker },
          isDirty: true,
        }))

        return newTracker
      },

      updateCustomTracker: async (id, updates) => {
        const existing = get().customTrackers[id]
        if (!existing) return

        const sanitizedValidation = updates.validation
          ? updates.validation.map((field) => ({
              ...field,
              name: sanitizeFieldName(field.name),
              subFields: field.subFields?.map((sub) => ({
                ...sub,
                name: sanitizeFieldName(sub.name),
              })),
            }))
          : existing.validation

        const updated: CustomTracker = {
          ...existing,
          ...updates,
          validation: sanitizedValidation,
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          customTrackers: { ...state.customTrackers, [id]: updated },
          isDirty: true,
        }))
      },

      deleteCustomTracker: async (id) => {
        set((state) => {
          const trackersCopy = { ...state.customTrackers }
          delete trackersCopy[id]

          const entriesCopy = { ...state.trackerEntries }
          delete entriesCopy[id] // Cascade delete logs

          return {
            customTrackers: trackersCopy,
            trackerEntries: entriesCopy,
            isDirty: true,
          }
        })

        // Fire deletion in background on Supabase if authenticated
        try {
          await supabase.from('custom_trackers').delete().eq('id', id)
        } catch {
          // Silent catch for offline resiliency
        }
      },

      // --- ENTRIES ---
      addTrackerEntry: async (trackerId, entryData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const tracker = get().customTrackers[trackerId]

        if (!tracker) {
          throw new Error('Rastreador não encontrado para associar dados.')
        }

        // Validate and sanitize values against Schema
        const sanitizedValues: Record<string, any> = {}
        tracker.validation.forEach((field) => {
          const rawVal = entryData.values[field.name]

          if (rawVal === undefined || rawVal === null || rawVal === '') {
            if (field.required) {
              throw new Error(`O campo "${field.label}" é obrigatório.`)
            }
            return
          }

          if (field.type === 'number') {
            const num = Number(rawVal)
            if (isNaN(num)) {
              throw new Error(`O campo "${field.label}" deve ser um número válido.`)
            }
            sanitizedValues[field.name] = num
          } else if (field.type === 'number[]') {
            const arr = Array.isArray(rawVal) ? rawVal.map(Number) : []
            if (arr.some(isNaN)) {
              throw new Error(`O campo "${field.label}" deve conter apenas números.`)
            }
            sanitizedValues[field.name] = arr
          } else if (field.type === 'string[]') {
            sanitizedValues[field.name] = Array.isArray(rawVal) ? rawVal.map(String) : []
          } else if (field.type === 'boolean') {
            sanitizedValues[field.name] = !!rawVal
          } else if (field.type === 'object[]' && field.subFields) {
            if (!Array.isArray(rawVal)) {
              sanitizedValues[field.name] = []
              return
            }

            sanitizedValues[field.name] = rawVal.map((row, idx) => {
              const sanitizedRow: Record<string, any> = {}
              field.subFields!.forEach((sub) => {
                const subVal = row[sub.name]
                if (sub.required && (subVal === undefined || subVal === null || subVal === '')) {
                  throw new Error(`Linha ${idx + 1}: O campo "${sub.label}" é obrigatório.`)
                }

                if (subVal === undefined || subVal === null || subVal === '') return

                if (sub.type === 'number') {
                  const subNum = Number(subVal)
                  if (isNaN(subNum)) {
                    throw new Error(`Linha ${idx + 1}: O campo "${sub.label}" deve ser um número.`)
                  }
                  sanitizedRow[sub.name] = subNum
                } else if (sub.type === 'boolean') {
                  sanitizedRow[sub.name] = !!subVal
                } else {
                  sanitizedRow[sub.name] = String(subVal)
                }
              })
              return sanitizedRow
            })
          } else {
            // string, date
            sanitizedValues[field.name] = String(rawVal)
          }
        })

        const newEntry: CustomTrackerEntry = {
          ...entryData,
          id,
          tracker_id: trackerId,
          values: sanitizedValues,
          created_at: now,
          updated_at: now,
        }

        set((state) => {
          const currentList = state.trackerEntries[trackerId] || []
          return {
            trackerEntries: {
              ...state.trackerEntries,
              [trackerId]: [newEntry, ...currentList],
            },
            isDirty: true,
          }
        })

        return newEntry
      },

      deleteTrackerEntry: async (trackerId, entryId) => {
        set((state) => {
          const currentList = state.trackerEntries[trackerId] || []
          return {
            trackerEntries: {
              ...state.trackerEntries,
              [trackerId]: currentList.filter((e) => e.id !== entryId),
            },
            isDirty: true,
          }
        })

        // Background deletes on server if online
        try {
          await supabase.from('custom_tracker_entries').delete().eq('id', entryId)
        } catch {
          // Offline-friendly silent catch
        }
      },

      setClean: () => set({ isDirty: false }),

      // --- SYNC API & MERGE RESOLUTION ---
      syncWithBackend: async (userId) => {
        if (!get().isDirty) return { success: true, error: null }

        try {
          // Build payload
          const trackersArray = Object.values(get().customTrackers).map((t) => ({
            ...t,
            user_id: userId,
          }))

          const entriesArray = Object.values(get().trackerEntries)
            .flat()
            .map((e) => ({
              ...e,
              user_id: userId,
            }))

          // 1. Upsert templates
          if (trackersArray.length > 0) {
            const { error: tErr } = await supabase
              .from('custom_trackers')
              .upsert(trackersArray, { onConflict: 'id' })
            if (tErr) throw tErr
          }

          // 2. Upsert entries
          if (entriesArray.length > 0) {
            const { error: eErr } = await supabase
              .from('custom_tracker_entries')
              .upsert(entriesArray, { onConflict: 'id' })
            if (eErr) throw eErr
          }

          set({ isDirty: false })
          return { success: true, error: null }
        } catch (err: any) {
          return { success: false, error: err.message || 'Erro durante a sincronização.' }
        }
      },

      loadFromBackend: async (userId) => {
        set({ loading: true })
        try {
          const [trackersRes, entriesRes] = await Promise.all([
            supabase.from('custom_trackers').select('*').eq('user_id', userId),
            supabase.from('custom_tracker_entries').select('*').eq('user_id', userId),
          ])

          if (trackersRes.error) throw trackersRes.error
          if (entriesRes.error) throw entriesRes.error

          const fetchedTrackers: Record<string, CustomTracker> = {}
          trackersRes.data.forEach((t) => {
            fetchedTrackers[t.id] = t as CustomTracker
          })

          const fetchedEntries: Record<string, CustomTrackerEntry[]> = {}
          entriesRes.data.forEach((e) => {
            const entry = e as CustomTrackerEntry
            if (!fetchedEntries[entry.tracker_id]) {
              fetchedEntries[entry.tracker_id] = []
            }
            fetchedEntries[entry.tracker_id].push(entry)
          })

          // Sort entries by date descending
          Object.keys(fetchedEntries).forEach((key) => {
            fetchedEntries[key].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
          })

          set({
            customTrackers: fetchedTrackers,
            trackerEntries: fetchedEntries,
            isDirty: false,
          })
        } catch {
          // Fail silent, fallback to local storage values
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'vertice-advanced-trackers-local-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
