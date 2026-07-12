import { useState, useRef } from 'react'
import { Camera, Search, Loader2, Utensils, Plus, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  uploadMealPhoto,
  analyzeFoodPhoto,
  analyzeFoodText,
  type FoodAnalysisResult,
} from '@/services/food-analysis'

interface FoodLoggerCardProps {
  onAddCalories: (cal: number) => void
}

export function FoodLoggerCard({ onAddCalories }: FoodLoggerCardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<FoodAnalysisResult | null>(null)
  const [added, setAdded] = useState(false)
  const [foodText, setFoodText] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setAdded(false)
  }

  const handleAnalyzePhoto = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setAnalyzing(true)
    setResult(null)
    setAdded(false)
    try {
      const imageUrl = await uploadMealPhoto(file)
      if (!imageUrl) throw new Error('upload-failed')
      const analysis = await analyzeFoodPhoto(imageUrl)
      setResult(analysis)
    } catch {
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar a foto. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyzeText = async () => {
    if (!foodText.trim()) return
    setAnalyzing(true)
    setResult(null)
    setAdded(false)
    try {
      const analysis = await analyzeFoodText(foodText)
      setResult(analysis)
    } catch {
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível estimar as calorias. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAdd = () => {
    if (!result) return
    onAddCalories(result.estimated_calories)
    setAdded(true)
    toast({
      title: 'Calorias adicionadas!',
      description: `${result.estimated_calories} kcal — ${result.food_description}`,
    })
    setTimeout(() => {
      setResult(null)
      setAdded(false)
      setFoodText('')
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 2000)
  }

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Utensils className="text-primary" />
          Registrar Refeição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 rounded-xl">
            <TabsTrigger value="photo" className="rounded-lg">
              Foto
            </TabsTrigger>
            <TabsTrigger value="text" className="rounded-lg">
              Buscar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Refeição" className="w-full h-40 object-cover" />
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera size={28} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tirar foto ou enviar</span>
              </button>
            )}
            {previewUrl && (
              <Button onClick={handleAnalyzePhoto} disabled={analyzing} className="w-full gap-2">
                {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                {analyzing ? 'Analisando...' : 'Analisar Foto'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 1 fatia de bolo de chocolate"
                value={foodText}
                onChange={(e) => setFoodText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeText()}
              />
              <Button
                onClick={handleAnalyzeText}
                disabled={analyzing || !foodText.trim()}
                size="sm"
                className="gap-1"
              >
                {analyzing ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-3 p-3 rounded-xl bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{result.food_description}</span>
              <span className="text-lg font-bold text-primary">
                {result.estimated_calories} kcal
              </span>
            </div>
            <Button onClick={handleAdd} disabled={added} className="w-full gap-2" size="sm">
              {added ? (
                <>
                  <Check size={14} /> Adicionado!
                </>
              ) : (
                <>
                  <Plus size={14} /> Adicionar Calorias
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
