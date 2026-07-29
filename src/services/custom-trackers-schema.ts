// Schema-Driven Custom Trackers Type Definitions (RoutineFlow Architecture)

export type FieldType =
  | 'string' // Texto simples
  | 'number' // Numérico
  | 'boolean' // Sim/Não
  | 'date' // Data YYYY-MM-DD
  | 'string[]' // Lista de etiquetas/chips de texto
  | 'number[]' // Lista de números
  | 'object[]' // Tabela/série dinâmica (ex: séries de academia)

export interface TrackerSubField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  required: boolean
}

export interface TrackerField {
  name: string
  label: string
  type: FieldType
  required: boolean
  subFields?: TrackerSubField[] // Required only if type === 'object[]'
}

export interface CustomTracker {
  id: string // UUID
  name: string
  category_id?: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | null
  validation: TrackerField[] // Schema-driven fields validation rules
  view_type: 'card' | 'list' | 'table'
  created_at: string
  updated_at: string
}

export interface CustomTrackerEntry {
  id: string // UUID
  tracker_id: string // Relates to CustomTracker
  task_id?: string | null // Optional AgendaTask binding
  date: string // YYYY-MM-DD
  values: Record<string, any> // Schema-validated dynamic inputs
  created_at: string
  updated_at: string
}
