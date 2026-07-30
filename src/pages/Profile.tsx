import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getProfile, updateProfile, type Profile } from '@/services/profiles'
import { exportUserData, deleteAccount } from '@/services/privacy'
import {
  isPushSupported,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/services/push-subscriptions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  LogOut,
  Loader2,
  Save,
  Phone,
  Crown,
  Sparkles,
  Download,
  Trash2,
  ShieldCheck,
  Bell,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAiUsage } from '@/hooks/use-ai-usage'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const aiUsage = useAiUsage()

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

  useEffect(() => {
    if (!isPushSupported()) return
    getPushSubscription().then((sub) => setPushEnabled(!!sub))
  }, [])

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
      window.dispatchEvent(new Event('profile-updated'))
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' })
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleTogglePush = async (checked: boolean) => {
    if (!user) return
    setPushBusy(true)
    try {
      if (checked) {
        await subscribeToPush(user.id)
        setPushEnabled(true)
        toast({ title: 'Lembretes ativados', description: 'Você receberá notificações push.' })
      } else {
        await unsubscribeFromPush()
        setPushEnabled(false)
        toast({ title: 'Lembretes desativados' })
      }
    } catch (err) {
      toast({
        title: 'Não foi possível alterar as notificações',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setPushBusy(false)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    const { error } = await exportUserData()
    setExporting(false)
    if (error) {
      toast({ title: 'Erro ao exportar dados', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Exportação concluída', description: 'Seus dados foram baixados em JSON.' })
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const { error } = await deleteAccount()
    if (error) {
      setDeleting(false)
      toast({ title: 'Erro ao excluir conta', description: error.message, variant: 'destructive' })
      return
    }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Mentor IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiUsage.loading ? (
            <p className="text-sm text-muted-foreground">Carregando uso do mês...</p>
          ) : !aiUsage.status || aiUsage.status.limit === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                <Sparkles className="text-muted-foreground shrink-0" size={24} />
                <div>
                  <p className="font-semibold">Mentor IA é exclusivo dos planos pagos</p>
                  <p className="text-sm text-muted-foreground">
                    Assine o Pro ou Premium para conversar com o Mentor IA.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full gap-2">
                <Link to="/planos">
                  <Sparkles size={18} /> Ver planos
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mensagens usadas este mês</span>
                <span className="data-num font-semibold">
                  {aiUsage.status.used} / {aiUsage.status.limit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    aiUsage.status.used / aiUsage.status.limit >= 0.9
                      ? 'bg-destructive'
                      : 'bg-primary',
                  )}
                  style={{
                    width: `${Math.min((aiUsage.status.used / aiUsage.status.limit) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Renova todo início de mês · plano {aiUsage.status.planType}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Lembretes push</p>
              <p className="text-sm text-muted-foreground">
                Receba um aviso no horário marcado de cada hábito ou tarefa da agenda, mesmo com o
                app fechado.
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              disabled={pushBusy || !isPushSupported()}
              onCheckedChange={handleTogglePush}
            />
          </div>
          {!isPushSupported() && (
            <p className="text-xs text-muted-foreground mt-2">
              Seu navegador não suporta notificações push, ou o app ainda não foi instalado na tela
              de início (necessário no iPhone).
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            Privacidade e dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Conforme a LGPD, você pode baixar uma cópia de todos os seus dados ou excluir sua conta
            permanentemente. Leia a{' '}
            <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>

          <Button
            onClick={handleExportData}
            disabled={exporting}
            variant="outline"
            className="w-full gap-2"
          >
            {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Exportar meus dados
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
              >
                <Trash2 size={18} />
                Excluir minha conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sua conta permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os seus hábitos, transações, registros de saúde,
                  tarefas, conversas com o mentor e a assinatura serão apagados imediatamente e não
                  podem ser recuperados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-rose-500 hover:bg-rose-600 focus:ring-rose-500"
                >
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : 'Sim, excluir tudo'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
