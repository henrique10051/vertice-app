import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { CustomTrackerBuilder } from '@/components/trackers/CustomTrackerBuilder'
import { CustomTrackerEntryForm } from '@/components/trackers/CustomTrackerEntryForm'
import { CustomTrackerHistory } from '@/components/trackers/CustomTrackerHistory'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Database,
  Calendar,
  Cloud,
  CloudLightning,
  Loader2,
  ListPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomTracker } from '@/services/custom-trackers-schema'

export default function Rastreadores() {
  const {
    customTrackers,
    trackerEntries,
    isDirty,
    loading,
    deleteCustomTracker,
    syncWithBackend,
    loadFromBackend,
  } = useCustomTrackersStore()

  const { user } = useAuth()
  const { toast } = useToast()

  // Navigation / Modal States
  const [builderOpen, setBuilderOpen] = useState(false)
  const [activeTracker, setActiveTracker] = useState<CustomTracker | null>(null)
  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Fetch from backend on load
  useEffect(() => {
    if (user) {
      loadFromBackend(user.id)
    }
  }, [user, loadFromBackend])

  const handleSync = async () => {
    if (!user) return
    setSyncing(true)
    const res = await syncWithBackend(user.id)
    setSyncing(false)

    if (res.success) {
      toast({
        title: 'Sincronização concluída! ☁️',
        description:
          'Seus rastreadores offline foram sincronizados com o servidor de forma segura.',
      })
    } else {
      toast({
        title: 'Erro na sincronização',
        description: res.error || 'Ocorreu um erro ao enviar os dados para a nuvem.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTracker = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening detail panel
    if (
      confirm(
        'Atenção: Deletar este rastreador excluirá permanentemente todos os registros de histórico vinculados a ele! Continuar?',
      )
    ) {
      try {
        await deleteCustomTracker(id)
        toast({
          title: 'Rastreador deletado',
          description: 'Rastreador e dados históricos apagados com sucesso.',
        })

        if (user) {
          syncWithBackend(user.id)
        }
      } catch {
        toast({
          title: 'Erro ao deletar',
          description: 'Não foi possível apagar o rastreador.',
          variant: 'destructive',
        })
      }
    }
  }

  const trackersList = Object.values(customTrackers)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Rastreamento Avançado
            </p>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            Rastreadores Customizados <Sparkles className="text-primary w-6 h-6 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Esquemas dinâmicos do RoutineFlow local-first com sincronização assíncrona na nuvem.
          </p>
        </div>

        {/* Sync & Action Row */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {/* Sincronização cloud indicator */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing || loading}
            className={cn(
              'h-9 text-xs rounded-full px-3 border border-border/60 shadow-soft gap-2',
              isDirty
                ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/15'
                : 'bg-muted/30 text-muted-foreground',
            )}
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isDirty ? (
              <CloudLightning className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>
              {syncing ? 'Sincronizando...' : isDirty ? 'Sincronizar Nuvem' : 'Sincronizado'}
            </span>
          </Button>

          <Button onClick={() => setBuilderOpen(true)} className="h-9 text-xs gap-1.5 font-bold">
            <Plus size={15} /> Novo Rastreador
          </Button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Carregando rastreadores local-first...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trackersList.length > 0 ? (
            trackersList.map((tracker) => {
              const entries = trackerEntries[tracker.id] || []

              return (
                <Card
                  key={tracker.id}
                  className="shadow-soft hover:shadow-elevation hover:border-primary/30 transition-all cursor-pointer flex flex-col justify-between border-border/70 group"
                  onClick={() => setActiveTracker(tracker)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                          <Database size={16} className="text-primary" />
                          {tracker.name}
                        </CardTitle>
                        <CardDescription className="text-[10px] mt-1">
                          Criado em {new Date(tracker.created_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive w-7 h-7 rounded-full transition-all"
                        onClick={(e) => handleDeleteTracker(tracker.id, e)}
                        title="Deletar Rastreador"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    {/* Fields summary */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Esquema ({tracker.validation.length} campos):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tracker.validation.slice(0, 4).map((f) => (
                          <span
                            key={f.name}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border/30 text-muted-foreground font-medium"
                          >
                            {f.label}
                          </span>
                        ))}
                        {tracker.validation.length > 4 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/5 text-primary font-bold">
                            +{tracker.validation.length - 4} mais
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-3 text-xs text-muted-foreground font-medium">
                      <span className="capitalize px-2 py-0.5 rounded bg-muted/60 text-[10px]">
                        Layout: {tracker.view_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {entries.length} registros
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="col-span-full border-2 border-dashed border-border/60 rounded-xl py-16 text-center flex flex-col items-center justify-center bg-card shadow-soft">
              <Database size={44} className="text-muted-foreground/40 mb-3 animate-pulse" />
              <h3 className="font-bold text-base">Crie seu primeiro Rastreador Dinâmico</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 px-4 leading-relaxed">
                Clique no botão "Novo Rastreador" para desenhar esquemas de validação sob medida
                (corridas, leitura, treinos, hábitos complexos).
              </p>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: Tracker Creation Builder --- */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Rastreador Avançado</DialogTitle>
          </DialogHeader>
          <CustomTrackerBuilder onSuccess={() => setBuilderOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: Tracker Detail & History Panel --- */}
      <Dialog open={!!activeTracker} onOpenChange={(open) => !open && setActiveTracker(null)}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          {activeTracker && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3 pr-6">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Database className="text-primary w-5 h-5" />
                    {activeTracker.name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modo de exibição padrão:{' '}
                    <span className="font-semibold capitalize text-foreground">
                      {activeTracker.view_type}
                    </span>
                  </p>
                </div>
                <Button
                  onClick={() => setEntryFormOpen(true)}
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <ListPlus size={13} /> Registrar Entrada
                </Button>
              </DialogHeader>

              {/* Entries list viewer */}
              <div className="py-4">
                <CustomTrackerHistory tracker={activeTracker} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: Dynamic Entry Form --- */}
      <Dialog open={entryFormOpen} onOpenChange={setEntryFormOpen}>
        <DialogContent className="sm:max-w-[460px]">
          {activeTracker && (
            <>
              <DialogHeader>
                <DialogTitle>Preencher: {activeTracker.name}</DialogTitle>
              </DialogHeader>
              <CustomTrackerEntryForm
                tracker={activeTracker}
                onSuccess={() => setEntryFormOpen(false)}
                onCancel={() => setEntryFormOpen(false)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
