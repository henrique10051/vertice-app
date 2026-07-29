import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Calendar, Grid, List, Table as TableIcon, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomTracker } from '@/services/custom-trackers-schema'

interface CustomTrackerHistoryProps {
  tracker: CustomTracker
}

export function CustomTrackerHistory({ tracker }: CustomTrackerHistoryProps) {
  const { trackerEntries, deleteTrackerEntry, syncWithBackend } = useCustomTrackersStore()
  const { user } = useAuth()
  const { toast } = useToast()

  const entries = trackerEntries[tracker.id] || []
  const [layout, setLayout] = useState<'card' | 'list' | 'table'>(tracker.view_type || 'card')

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Tem certeza de que deseja deletar este registro de histórico?')) {
      try {
        await deleteTrackerEntry(tracker.id, entryId)
        toast({
          title: 'Registro excluído',
          description: 'Métricas apagadas localmente.',
        })

        if (user) {
          syncWithBackend(user.id)
        }
      } catch {
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível apagar o registro.',
          variant: 'destructive',
        })
      }
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
        <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground italic">
          Nenhum registro preenchido para este rastreador ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Layout Toggles */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Histórico ({entries.length})
        </span>
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
          <Button
            variant={layout === 'card' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-7 h-7 rounded"
            onClick={() => setLayout('card')}
            title="Exibir Cards"
          >
            <Grid size={13} />
          </Button>
          <Button
            variant={layout === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-7 h-7 rounded"
            onClick={() => setLayout('list')}
            title="Exibir Linha do Tempo"
          >
            <List size={13} />
          </Button>
          <Button
            variant={layout === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-7 h-7 rounded"
            onClick={() => setLayout('table')}
            title="Exibir Tabela"
          >
            <TableIcon size={13} />
          </Button>
        </div>
      </div>

      {/* CASE 1: Card View Layout */}
      {layout === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="shadow-sm hover:shadow relative group bg-card border-border/60"
            >
              <button
                onClick={() => handleDeleteEntry(entry.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
                title="Deletar registro"
              >
                <Trash2 size={13} />
              </button>
              <CardContent className="p-4 space-y-3">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>

                <div className="space-y-2">
                  {tracker.validation.map((field) => {
                    const value = entry.values[field.name]
                    if (value === undefined || value === null) return null

                    return (
                      <div key={field.name} className="text-xs space-y-1">
                        <span className="font-semibold text-muted-foreground">{field.label}:</span>
                        <div className="pl-1">
                          {field.type === 'boolean' && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                value
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-rose-500/10 text-rose-600',
                              )}
                            >
                              {value ? 'Sim' : 'Não'}
                            </span>
                          )}
                          {field.type === 'object[]' && field.subFields && (
                            <NestedTablePreview subFields={field.subFields} rows={value} />
                          )}
                          {(field.type === 'string[]' || field.type === 'number[]') && (
                            <div className="flex flex-wrap gap-1">
                              {value.map((tag: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/30"
                                >
                                  {String(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                          {field.type !== 'boolean' &&
                            field.type !== 'object[]' &&
                            field.type !== 'string[]' &&
                            field.type !== 'number[]' && (
                              <span className="text-foreground font-medium">{String(value)}</span>
                            )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CASE 2: List Timeline View Layout */}
      {layout === 'list' && (
        <div className="space-y-4 relative pl-4 border-l border-border/70 ml-2">
          {entries.map((entry) => (
            <div key={entry.id} className="relative space-y-2 pb-2 group">
              {/* Timeline dot */}
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
                  title="Deletar registro"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2 text-xs">
                {tracker.validation.map((field) => {
                  const value = entry.values[field.name]
                  if (value === undefined || value === null) return null

                  return (
                    <div key={field.name} className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                      <span className="font-semibold text-muted-foreground sm:col-span-1">
                        {field.label}:
                      </span>
                      <div className="sm:col-span-3">
                        {field.type === 'boolean' && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              value
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-rose-500/10 text-rose-600',
                            )}
                          >
                            {value ? 'Sim' : 'Não'}
                          </span>
                        )}
                        {field.type === 'object[]' && field.subFields && (
                          <NestedTablePreview subFields={field.subFields} rows={value} />
                        )}
                        {(field.type === 'string[]' || field.type === 'number[]') && (
                          <div className="flex flex-wrap gap-1">
                            {value.map((tag: any, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/30"
                              >
                                {String(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                        {field.type !== 'boolean' &&
                          field.type !== 'object[]' &&
                          field.type !== 'string[]' &&
                          field.type !== 'number[]' && (
                            <span className="text-foreground font-medium">{String(value)}</span>
                          )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CASE 3: Excel Grid Table Layout */}
      {layout === 'table' && (
        <div className="overflow-x-auto border border-border/60 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border/60 font-semibold text-muted-foreground">
                <th className="p-2.5 font-bold min-w-[90px]">Data</th>
                {tracker.validation.map((field) => (
                  <th key={field.name} className="p-2.5 font-bold">
                    {field.label}
                  </th>
                ))}
                <th className="p-2.5 text-right font-bold min-w-[50px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-2.5 font-semibold text-primary">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: '2-digit',
                    })}
                  </td>
                  {tracker.validation.map((field) => {
                    const value = entry.values[field.name]

                    return (
                      <td key={field.name} className="p-2.5 max-w-[200px]">
                        {value === undefined || value === null ? (
                          <span className="text-muted-foreground/30">-</span>
                        ) : (
                          <>
                            {field.type === 'boolean' && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                  value
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-600',
                                )}
                              >
                                {value ? 'Sim' : 'Não'}
                              </span>
                            )}
                            {field.type === 'object[]' && field.subFields && (
                              <span className="font-semibold text-primary flex items-center gap-1">
                                <ClipboardList size={12} />
                                {value.length} séries
                              </span>
                            )}
                            {(field.type === 'string[]' || field.type === 'number[]') && (
                              <span
                                className="truncate max-w-[150px] inline-block"
                                title={value.join(', ')}
                              >
                                {value.join(', ')}
                              </span>
                            )}
                            {field.type !== 'boolean' &&
                              field.type !== 'object[]' &&
                              field.type !== 'string[]' &&
                              field.type !== 'number[]' && (
                                <span className="text-foreground">{String(value)}</span>
                              )}
                          </>
                        )}
                      </td>
                    )
                  })}
                  <td className="p-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NestedTablePreview({ subFields, rows }: { subFields: TrackerSubField[]; rows: any[] }) {
  return (
    <div className="mt-1 border border-border/50 rounded-lg overflow-hidden bg-background max-w-full">
      <table className="w-full text-[10px] text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border/40 font-semibold text-muted-foreground">
            <th className="p-1 px-1.5 font-bold">#</th>
            {subFields.map((s) => (
              <th key={s.name} className="p-1 px-1.5 font-bold">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-muted/10">
              <td className="p-1 px-1.5 font-mono text-muted-foreground">#{idx + 1}</td>
              {subFields.map((s) => {
                const val = row[s.name]
                return (
                  <td key={s.name} className="p-1 px-1.5 font-medium">
                    {val === undefined || val === null ? (
                      <span className="text-muted-foreground/30">-</span>
                    ) : (
                      <>{s.type === 'boolean' ? (val ? 'Sim' : 'Não') : String(val)}</>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
