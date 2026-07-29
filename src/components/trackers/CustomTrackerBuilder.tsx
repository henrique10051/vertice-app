import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCustomTrackersStore, sanitizeFieldName } from '@/stores/useCustomTrackersStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Settings, Grid, List, Table as TableIcon, Sparkles } from 'lucide-react'
import type { TrackerField, TrackerSubField, FieldType } from '@/services/custom-trackers-schema'

interface CustomTrackerBuilderProps {
  onSuccess?: () => void
}

export function CustomTrackerBuilder({ onSuccess }: CustomTrackerBuilderProps) {
  const { addCustomTracker, syncWithBackend } = useCustomTrackersStore()
  const { user } = useAuth()
  const { toast } = useToast()

  // Form State
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<
    'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | ''
  >('')
  const [viewType, setViewType] = useState<'card' | 'list' | 'table'>('card')
  const [fields, setFields] = useState<TrackerField[]>([
    { name: 'valor', label: 'Valor', type: 'number', required: true },
  ])

  // Field Add Form State
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('number')
  const [fieldRequired, setFieldRequired] = useState(true)

  // Subfield Builder State (only shown for 'object[]')
  const [subFields, setSubFields] = useState<TrackerSubField[]>([])
  const [subFieldLabel, setSubFieldLabel] = useState('')
  const [subFieldType, setSubFieldType] = useState<'string' | 'number' | 'boolean' | 'date'>(
    'number',
  )
  const [subFieldRequired, setSubFieldRequired] = useState(true)

  const handleAddSubField = () => {
    if (!subFieldLabel.trim()) {
      toast({
        title: 'Nome do subcampo obrigatório',
        description: 'Dê um nome para a coluna da tabela.',
        variant: 'destructive',
      })
      return
    }

    const subName = sanitizeFieldName(subFieldLabel)
    if (subFields.some((s) => s.name === subName)) {
      toast({
        title: 'Nome duplicado',
        description: 'Essa coluna já existe na tabela.',
        variant: 'destructive',
      })
      return
    }

    setSubFields([
      ...subFields,
      {
        name: subName,
        label: subFieldLabel.trim(),
        type: subFieldType,
        required: subFieldRequired,
      },
    ])
    setSubFieldLabel('')
    setSubFieldRequired(true)
  }

  const handleRemoveSubField = (index: number) => {
    setSubFields(subFields.filter((_, i) => i !== index))
  }

  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      toast({
        title: 'Rótulo obrigatório',
        description: 'Por favor, dê um rótulo ao campo de dados.',
        variant: 'destructive',
      })
      return
    }

    const cleanName = sanitizeFieldName(fieldLabel)
    if (fields.some((f) => f.name === cleanName)) {
      toast({
        title: 'Nome de campo já existe',
        description: 'Crie um campo com um nome diferente.',
        variant: 'destructive',
      })
      return
    }

    if (fieldType === 'object[]' && subFields.length === 0) {
      toast({
        title: 'Tabela sem colunas',
        description: 'Adicione pelo menos 1 subcampo de coluna para tabelas dinâmicas.',
        variant: 'destructive',
      })
      return
    }

    const newField: TrackerField = {
      name: cleanName,
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      subFields: fieldType === 'object[]' ? subFields : undefined,
    }

    setFields([...fields, newField])
    setFieldLabel('')
    setFieldType('number')
    setFieldRequired(true)
    setSubFields([])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSaveTracker = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Insira o nome do seu novo rastreador.',
        variant: 'destructive',
      })
      return
    }

    if (fields.length === 0) {
      toast({
        title: 'Sem campos de dados',
        description: 'Adicione pelo menos um campo de dados para criar o rastreador.',
        variant: 'destructive',
      })
      return
    }

    try {
      const created = await addCustomTracker({
        name: name.trim(),
        category_id: categoryId || null,
        view_type: viewType,
        validation: fields,
      })

      toast({
        title: 'Rastreador avançado criado! 🏆',
        description: `O esquema para "${created.name}" foi validado e salvo com sucesso localmente.`,
      })

      // Background synchronization
      if (user) {
        syncWithBackend(user.id)
      }

      onSuccess?.()
    } catch (err: any) {
      toast({
        title: 'Falha ao salvar',
        description: err.message || 'Ocorreu um erro ao persistir o rastreador.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Tracker Configuration Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 border border-border/60 rounded-xl">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="t-name">Nome do Rastreador Avançado *</Label>
          <Input
            id="t-name"
            placeholder="Ex: Treino de Corrida, Monitor de Sono, Hábitos de Estudo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="t-cat">Categoria Associada (Opcional)</Label>
          <Select value={categoryId} onValueChange={(v: any) => setCategoryId(v)}>
            <SelectTrigger id="t-cat">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessoal">Pessoal</SelectItem>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="saude">Saúde</SelectItem>
              <SelectItem value="financas">Finanças</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="t-layout">Visualização do Histórico</Label>
          <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
            <SelectTrigger id="t-layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">
                <span className="flex items-center gap-1.5">
                  <Grid size={13} /> Cards Grid
                </span>
              </SelectItem>
              <SelectItem value="list">
                <span className="flex items-center gap-1.5">
                  <List size={13} /> Linha do Tempo
                </span>
              </SelectItem>
              <SelectItem value="table">
                <span className="flex items-center gap-1.5">
                  <TableIcon size={13} /> Tabela Normalizada
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schema fields List */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Settings size={14} /> Esquema de Campos Ativo ({fields.length})
        </Label>

        {fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 border border-border/50 bg-card rounded-xl text-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{field.label}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-medium text-muted-foreground">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">Chave: {field.name}</p>

                  {/* Nest subfields preview */}
                  {field.subFields && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Colunas da Tabela:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {field.subFields.map((s, si) => (
                          <span
                            key={si}
                            className="text-[9px] bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 font-medium"
                          >
                            {s.label} ({s.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveField(idx)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic pl-1">
            Seu esquema está vazio. Adicione um campo abaixo.
          </p>
        )}
      </div>

      {/* Field Builder Form Box */}
      <div className="border border-border/60 rounded-xl p-4 bg-muted/15 space-y-4">
        <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Plus size={14} /> Incluir Campo de Dado ao Esquema
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-xs">Rótulo do Campo (Label)</Label>
            <Input
              placeholder="Ex: Distância Percorrida, Batimento Cardíaco"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-xs">Tipo de Dado</Label>
            <Select value={fieldType} onValueChange={(v: any) => setFieldType(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">Texto Simples</SelectItem>
                <SelectItem value="number">Número (Inteiro ou Decimal)</SelectItem>
                <SelectItem value="boolean">Chave Sim/Não (Toggle)</SelectItem>
                <SelectItem value="date">Data (Calendário)</SelectItem>
                <SelectItem value="string[]">Lista de Tags / Textos</SelectItem>
                <SelectItem value="number[]">Lista de Números</SelectItem>
                <SelectItem value="object[]">Tabela Dinâmica / Séries (Complexo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex items-center justify-between bg-card p-2 px-3 border border-border/40 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">Campo Obrigatório</Label>
              <p className="text-[10px] text-muted-foreground">
                O formulário não salvará se este campo estiver em branco.
              </p>
            </div>
            <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
          </div>
        </div>

        {/* Nest Tables col-builder inside builder (only if object[]) */}
        {fieldType === 'object[]' && (
          <div className="border border-primary/20 rounded-lg p-3.5 bg-primary/5 space-y-3.5">
            <div className="space-y-1">
              <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> Construtor de Tabela Dinâmica
              </h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Adicione colunas que estarão presentes em cada linha da sua tabela (ex: séries de
                exercícios).
              </p>
            </div>

            {/* List current columns */}
            {subFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subFields.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium"
                  >
                    {s.label} (
                    {s.type === 'number' ? 'Número' : s.type === 'boolean' ? 'Booleano' : s.type})
                    <button
                      onClick={() => handleRemoveSubField(idx)}
                      className="text-primary hover:text-rose-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Form row to add column */}
            <div className="grid grid-cols-2 gap-2 border-t border-primary/10 pt-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-primary">Nome da Coluna</Label>
                <Input
                  placeholder="Ex: Carga (kg), Repetições"
                  value={subFieldLabel}
                  onChange={(e) => setSubFieldLabel(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-primary">Tipo da Coluna</Label>
                <Select value={subFieldType} onValueChange={(v: any) => setSubFieldType(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Booleano (Toggle)</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center justify-between py-1 border-t border-primary/10 mt-1">
                <Label className="text-[10px] text-primary">Coluna Obrigatória?</Label>
                <Switch checked={subFieldRequired} onCheckedChange={setFieldRequired} size="sm" />
              </div>
              <Button
                onClick={handleAddSubField}
                size="sm"
                className="col-span-2 h-8 text-[11px]"
                variant="secondary"
              >
                Incluir Coluna
              </Button>
            </div>
          </div>
        )}

        {/* Add Field Button */}
        <Button onClick={handleAddField} variant="outline" size="sm" className="w-full text-xs">
          Incluir Campo no Esquema
        </Button>
      </div>

      {/* Trigger Saving entire Tracker */}
      <Button onClick={handleSaveTracker} className="w-full h-10 font-bold gap-2">
        <Sparkles size={16} /> Criar Modelo de Rastreador
      </Button>
    </div>
  )
}
