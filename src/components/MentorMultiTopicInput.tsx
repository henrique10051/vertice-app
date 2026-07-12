import { useState, useRef, useEffect } from 'react'
import { Plus, X, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MentorMultiTopicInputProps {
  options: string[]
  selectedTopics: string[]
  onToggleOption: (topic: string) => void
  onAddCustom: (topic: string) => void
  onRemoveTopic: (topic: string) => void
  onContinue: () => void
  isLoading: boolean
}

export function MentorMultiTopicInput({
  options,
  selectedTopics,
  onToggleOption,
  onAddCustom,
  onRemoveTopic,
  onContinue,
  isLoading,
}: MentorMultiTopicInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !selectedTopics.includes(trimmed)) {
      onAddCustom(trimmed)
    }
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="py-2 space-y-4">
      <p className="text-xs text-muted-foreground mb-2">
        Selecione um ou mais tópicos. Você pode adicionar quantos quiser!
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedTopics.includes(option)
          return (
            <button
              key={option}
              onClick={() => onToggleOption(option)}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-1.5',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              {isSelected && <Check size={14} />}
              {option}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Digite outro tópico (ex: Anatomia, Inglês...)"
          className="rounded-full"
          disabled={isLoading}
        />
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shrink-0"
          onClick={handleAdd}
          disabled={isLoading || !input.trim()}
        >
          <Plus size={18} />
        </Button>
      </div>

      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {selectedTopics.map((topic) => (
            <div
              key={topic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {topic}
              <button
                onClick={() => onRemoveTopic(topic)}
                className="hover:text-primary/70 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={onContinue}
        disabled={isLoading || selectedTopics.length === 0}
      >
        Continuar com {selectedTopics.length} tópico{selectedTopics.length !== 1 ? 's' : ''}
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  )
}
