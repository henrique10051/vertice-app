import { Link } from 'react-router-dom'
import { Mountain, ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background topo-lines p-4">
      <div className="w-full max-w-2xl mx-auto py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Mountain size={20} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vértice</h1>
        </div>

        <div className="bg-card rounded-2xl shadow-elevation p-8 border border-border/70 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold mb-1">Política de Privacidade e Termos de Uso</h2>
            <p className="text-muted-foreground">Última atualização: 22/07/2026</p>
          </div>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">1. Quem somos e o que fazemos</h3>
            <p>
              O Vértice é um aplicativo de organização pessoal (hábitos, finanças, saúde, agenda
              e um mentor com inteligência artificial). Ao criar uma conta, você concorda com os
              termos descritos abaixo, em conformidade com a Lei Geral de Proteção de Dados
              (LGPD — Lei 13.709/2018).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">2. Dados que coletamos</h3>
            <p>Coletamos apenas os dados necessários para o funcionamento do app:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados de cadastro: nome, e-mail, senha (armazenada de forma criptografada).</li>
              <li>
                Dados que você insere ao usar o produto: hábitos, transações financeiras, registros
                de saúde, tarefas de agenda, itens de estoque e conversas com o mentor de IA.
              </li>
              <li>Número de WhatsApp, caso você opte por ativar a integração (plano Premium).</li>
              <li>Dados de pagamento e status de assinatura, processados pelo Mercado Pago.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">3. Como usamos seus dados</h3>
            <p>
              Usamos seus dados exclusivamente para fornecer as funcionalidades do app: exibir seu
              progresso, gerar respostas personalizadas do mentor de IA, processar pagamentos e
              enviar notificações relevantes. Não vendemos seus dados a terceiros.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">4. Compartilhamento com terceiros</h3>
            <p>
              Compartilhamos dados apenas com prestadores de serviço estritamente necessários para
              a operação do app: Supabase (banco de dados e autenticação), OpenAI (respostas do
              mentor de IA) e Mercado Pago (processamento de pagamentos). Cada um desses
              prestadores possui suas próprias políticas de segurança e privacidade.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">5. Segurança</h3>
            <p>
              Seus dados são protegidos por políticas de acesso (Row Level Security) que garantem
              que apenas você pode ler ou modificar suas próprias informações. Senhas nunca são
              armazenadas em texto plano.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">6. Seus direitos</h3>
            <p>Conforme a LGPD, você pode a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Solicitar uma cópia de todos os seus dados (exportação em JSON).</li>
              <li>Solicitar a exclusão completa da sua conta e de todos os dados associados.</li>
              <li>Corrigir dados incorretos diretamente na tela de Perfil.</li>
            </ul>
            <p>
              Essas ações estão disponíveis diretamente na tela{' '}
              <Link to="/perfil" className="text-primary hover:underline">
                Perfil
              </Link>
              , na seção "Privacidade e dados".
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">7. Retenção e exclusão</h3>
            <p>
              Ao solicitar a exclusão da conta, todos os seus dados são removidos permanentemente
              do banco de dados de forma imediata e irreversível.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold">8. Contato</h3>
            <p>
              Dúvidas sobre privacidade ou seus dados podem ser enviadas para o e-mail de suporte
              indicado no app.
            </p>
          </section>
        </div>

        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mt-6"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
    </div>
  )
}
