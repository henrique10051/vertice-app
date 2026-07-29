import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getTodayStr } from '@/lib/date-utils'
import { Save, Plus, Trash2, X, ClipboardList } from 'lucide-react'
import type { CustomTracker } from '@/services/custom-trackers-schema'

interface CustomTrackerEntryFormProps {
  tracker: CustomTracker
  taskId?: string | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomTrackerEntryForm({
  tracker,
  taskId,
  onSuccess,
  onCancel,
}: CustomTrackerEntryFormProps) {
  const { addTrackerEntry, syncWithBackend } = useCustomTrackersStore()
  const { user } = useAuth()
  const { toast } = useToast()

  const today = getTodayStr()
  const [date, setDate] = useState(today)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  // Subform lists state (for arrays)
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({})

  // Initialize fields on open
  useEffect(() => {
    const initial: Record<string, any> = {}
    tracker.validation.forEach((field) => {
      if (field.type === 'object[]') {
        // Initial empty row for tables
        initial[field.name] = [{}]
      } else if (field.type === 'string[]' || field.type === 'number[]') {
        initial[field.name] = []
      } else if (field.type === 'boolean') {
        initial[field.name] = false
      } else {
        initial[field.name] = ''
      }
    })
    setFormValues(initial)
  }, [tracker])

  // Handles standard field changes
  const handleValueChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  // Handle arrays tags/chips addition
  const handleAddTag = (fieldName: string, isNumber: boolean) => {
    const rawVal = arrayInputs[fieldName] || ''
    if (!rawVal.trim()) return

    const currentList = formValues[fieldName] || []

    if (isNumber) {
      const num = Number(rawVal)
      if (isNaN(num)) {
        toast({
          title: 'Apenas números',
          description: 'Este campo aceita apenas valores numéricos.',
          variant: 'destructive',
        })
        return
      }
      if (currentList.includes(num)) return
      handleValueChange(fieldName, [...currentList, num])
    } else {
      if (currentList.includes(rawVal.trim())) return
      handleValueChange(fieldName, [...currentList, rawVal.trim()])
    }

    setArrayInputs((prev) => ({ ...prev, [fieldName]: '' }))
  }

  const handleRemoveTag = (fieldName: string, index: number) => {
    const currentList = formValues[fieldName] || []
    handleValueChange(
      fieldName,
      currentList.filter((_: any, i: number) => i !== index),
    )
  }

  // Handle nested object[] (table row additions)
  const handleAddTableRow = (fieldName: string) => {
    const currentRows = formValues[fieldName] || []
    handleValueChange(fieldName, [...currentRows, {}])
  }

  const handleRemoveTableRow = (fieldName: string, rowIndex: number) => {
    const currentRows = formValues[fieldName] || []
    if (currentRows.length === 1) {
      toast({
        title: 'Mínimo de 1 linha',
        description: 'A tabela dinâmica necessita de pelo menos um registro preenchido.',
        variant: 'destructive',
      })
      return
    }
    handleValueChange(
      fieldName,
      currentRows.filter((_: any, i: number) => i !== rowIndex),
    )
  }

  const handleTableRowValueChange = (
    fieldName: string,
    rowIndex: number,
    subFieldName: string,
    val: any,
  ) => {
    const currentRows = [...(formValues[fieldName] || [])]
    currentRows[rowIndex] = {
      ...currentRows[rowIndex],
      [subFieldName]: val,
    }
    handleValueChange(fieldName, currentRows)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Validations and creation through store
      await addTrackerEntry(tracker.id, {
        task_id: taskId || null,
        date,
        values: formValues,
      })

      toast({
        title: 'Dados salvos! 📊',
        description: `As métricas do rastreador "${tracker.name}" foram registradas localmente.`,
      })

      // Background synchronization
      if (user) {
        syncWithBackend(user.id)
      }

      onSuccess?.()
    } catch (err: any) {
      toast({
        title: 'Erro de Validação',
        description: err.message || 'Por favor, revise o preenchimento dos campos.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="space-y-1.5 bg-muted/25 p-3 rounded-lg border border-border/50">
        <Label htmlFor="log-date" className="text-xs font-semibold">
          Data do Registro
        </Label>
        <Input
          id="log-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Render Dynamic Inputs based on Schema */}
      <div className="space-y-5">
        {tracker.validation.map((field) => {
          const isRequired = field.required

          return (
            <div
              key={field.name}
              className="space-y-2 border-b border-border/40 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`input-${field.name}`} className="font-semibold text-sm">
                  {field.label} {isRequired && <span className="text-destructive">*</span>}
                </Label>
              </div>

              {/* RENDER CASE 1: Boolean */}
              {field.type === 'boolean' && (
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id={`input-${field.name}`}
                    checked={!!formValues[field.name]}
                    onCheckedChange={(checked) => handleValueChange(field.name, checked)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formValues[field.name] ? 'Sim' : 'Não'}
                  </span>
                </div>
              )}

              {/* RENDER CASE 2: Text / String / Date */}
              {(field.type === 'string' || field.type === 'date' || field.type === 'number') && (
                <Input
                  id={`input-${field.name}`}
                  type={
                    field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
                  }
                  placeholder={
                    field.type === 'number' ? 'Insira um valor numérico' : 'Preencha aqui...'
                  }
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => handleValueChange(field.name, e.target.value)}
                />
              )}

              {/* RENDER CASE 3: Array List Tags (string[] or number[]) */}
              {(field.type === 'string[]' || field.type === 'number[]') && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        field.type === 'number[]' ? 'Adicionar número...' : 'Adicionar etiqueta...'
                      }
                      value={arrayInputs[field.name] ?? ''}
                      onChange={(e) =>
                        setArrayInputs({ ...arrayInputs, [field.name]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(field.name, field.type === 'number[]')
                        }
                      }}
                      className="h-9 flex-1"
                    />
                    <Button
                      onClick={() => handleAddTag(field.name, field.type === 'number[]')}
                      size="sm"
                      variant="outline"
                      className="h-9"
                    >
                      <Plus size={15} />
                    </Button>
                  </div>
                  {/* Chips Container */}
                  <div className="flex flex-wrap gap-1.5">
                    {(formValues[field.name] || []).map((tag: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border/50 rounded-full pl-2.5 pr-1 py-0.5"
                      >
                        {String(tag)}
                        <button
                          onClick={() => handleRemoveTag(field.name, idx)}
                          className="rounded-full w-4 h-4 flex items-center justify-center hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RENDER CASE 4: Advanced Table Spreadsheet Series Builder (object[]) */}
              {field.type === 'object[]' && field.subFields && (
                <div className="border border-border/70 rounded-xl overflow-hidden bg-muted/10">
                  <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={14} /> Tabela de Séries / Registros
                    </span>
                    <Button
                      onClick={() => handleAddTableRow(field.name)}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/5 flex items-center gap-1"
                    >
                      <Plus size={12} /> Adicionar Linha
                    </Button>
                  </div>

                  <div className="p-3 space-y-3">
                    {(formValues[field.name] || []).map((row: any, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="flex items-end gap-2.5 bg-background p-3 border border-border/40 rounded-lg shadow-sm relative group"
                      >
                        {/* Row index indicator */}
                        <div className="absolute top-2 left-2 text-[10px] font-bold text-muted-foreground font-mono">
                          #{rIdx + 1}
                        </div>

                        {/* Subfields inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 pt-3.5">
                          {field.subFields!.map((sub) => (
                            <div key={sub.name} className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-medium">
                                {sub.label}{' '}
                                {sub.required && <span className="text-destructive">*</span>}
                              </Label>
                              {sub.type === 'boolean' ? (
                                <div className="flex items-center gap-2 h-8">
                                  <Switch
                                    checked={!!row[sub.name]}
                                    onCheckedChange={(checked) =>
                                      handleTableRowValueChange(field.name, rIdx, sub.name, checked)
                                    }
                                    size="sm"
                                  />
                                  <span className="text-[11px] text-muted-foreground">
                                    {row[sub.name] ? 'Sim' : 'Não'}
                                  </span>
                                </div>
                              ) : (
                                <Input
                                  type={
                                    sub.type === 'number'
                                      ? 'number'
                                      : sub.type === 'date'
                                        ? 'date'
                                        : 'text'
                                  }
                                  placeholder={sub.type === 'number' ? '0' : 'Preencher...'}
                                  value={row[sub.name] ?? ''}
                                  onChange={(e) =>
                                    handleTableRowValueChange(
                                      field.name,
                                      rIdx,
                                      sub.name,
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Remove Row Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full self-center sm:self-end mt-2"
                          onClick={() => handleRemoveTableRow(field.name, rIdx)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4 mt-6">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={saving} className="gap-2 px-5 font-bold">
          <Save size={16} />
          {saving ? 'Registrando...' : 'Gravar Registro'}
        </Button>
      </div>
    </div>
  )
}
