import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getProfile, updateProfile, type Profile } from '@/services/profiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, LogOut, Loader2, Save, Phone, Crown, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(({ data }) => {
      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
        setPhoneNumber(data.phone_number || '')
      }
      setLoading(false)
    })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { data, error } = await updateProfile(user.id, {
      full_name: fullName,
      avatar_url: avatarUrl,
      phone_number: phoneNumber || null,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      setProfile(data)
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' })
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} className="text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage
                src={avatarUrl || 'https://img.usecurling.com/ppl/large?gender=male&seed=1'}
                alt="Avatar"
              />
              <AvatarFallback>{fullName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{fullName || 'Usuário Vértice'}</p>
                {profile?.is_premium && (
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
                    <Crown size={12} /> Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail size={14} />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label>URL do Avatar</Label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Phone size={14} /> Número de WhatsApp (E.164)
            </Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+5511999999999"
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional com código do país. Necessário para a integração WhatsApp.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown size={20} className="text-amber-500" />
            Status Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.is_premium ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="text-amber-500 shrink-0" size={24} />
              <div>
                <p className="font-semibold text-amber-600">Você é Premium! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  Integração com WhatsApp está ativa. Envie "Help" no WhatsApp para ver os comandos.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                <Crown className="text-muted-foreground shrink-0" size={24} />
                <div>
                  <p className="font-semibold">Plano Gratuito</p>
                  <p className="text-sm text-muted-foreground">
                    Faça upgrade para Premium para gerenciar hábitos via WhatsApp.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Link to="/planos">
                  <Crown size={18} /> Upgrade para Premium
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardContent className="p-6">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
          >
            <LogOut size={18} />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
