import React from 'react';
import Link from 'next/link';
import { Search, Bell, Shield, TrendingUp, ChevronRight, Menu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060606] text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                Q
              </div>
              <span className="text-xl font-bold tracking-tight">Quero Licitação</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <Link href="#features" className="hover:text-white transition-colors">Recursos</Link>
              <Link href="#how-it-works" className="hover:text-white transition-colors">Como Funciona</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Planos</Link>
              <Link href="/login" className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">Entrar</Link>
              <Link href="/register" className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-500/20">Começar Agora</Link>
            </div>
            <div className="md:hidden">
              <Menu className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-medium mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Inteligência em Licitações
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Encontre Todas as <br />
              <span className="gradient-text">Licitações do Brasil</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Nossa tecnologia varre APIs oficiais e Diários Oficiais em tempo real para que você nunca perca uma oportunidade de negócio com o governo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2">
                Experimentar Gratuitamente <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="#demo" className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 text-white font-semibold transition-all">
                Ver Demonstração
              </Link>
            </div>

            {/* Mockup Dashboard Preview */}
            <div className="mt-20 relative px-4">
              <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl">
                <div className="rounded-xl overflow-hidden glass aspect-video flex flex-col">
                  <div className="h-12 border-b border-white/10 flex items-center px-4 gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-md h-7 flex items-center px-3 text-[10px] text-gray-500">
                      app.querolicitacao.com.br/dashboard
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-8 w-48 bg-white/20 rounded" />
                      </div>
                      <div className="h-10 w-32 bg-purple-600/50 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-xl border border-white/5 bg-white/5 animate-pulse" />
                      ))}
                    </div>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 rounded-lg border border-white/5 bg-white/5 flex items-center px-4 gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/10" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 bg-white/20 rounded" />
                            <div className="h-2 w-1/2 bg-white/10 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Tecnologia que <span className="text-purple-500">Gera Vendas</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Tudo o que você precisa para dominar o mercado de compras públicas.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">Busca Multicanal</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Integramos PNCP, Compras.gov e Diários Oficiais em uma única interface inteligente de pesquisa.</p>
              </div>

              <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">Alertas em Tempo Real</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Receba notificações instantâneas via e-mail sobre novos editais que batem com o seu perfil de interesse.</p>
              </div>

              <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">Análise de IA</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Nossa IA analisa os editais e resume os pontos mais importantes, economizando horas de leitura manual.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos <span className="text-purple-500">Sob Medida</span></h2>
              <p className="text-gray-400">Comece a escalar sua empresa vendendo para o maior comprador do Brasil.</p>
            </div>

            <div className="max-w-md mx-auto p-8 rounded-3xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full bg-purple-500 text-xs font-bold uppercase tracking-wider">Popular</span>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Plano Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold italic">R$ 197</span>
                  <span className="text-gray-400 text-sm">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Acesso ilimitado a todas licitações',
                  'Filtros avançados por UF e Valor',
                  'Leitura automática de Diários Oficiais',
                  'Alertas diários por e-mail',
                  'Suporte via WhatsApp especializado'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Shield className="w-4 h-4 text-purple-500" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                Assinar com Mercado Pago <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest">Garantia de 7 dias ou seu dinheiro de volta</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center font-bold text-sm text-white">Q</div>
            <span className="text-md font-bold tracking-tight">Quero Licitação</span>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2026 Quero Licitação - Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
