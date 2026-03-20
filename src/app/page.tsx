'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Search, Bell, Shield, TrendingUp, ChevronRight, Menu, X,
  CheckCircle2, MapPin, Filter, Zap, Lock, Globe, ArrowRight, Star
} from 'lucide-react';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const router = useRouter();

  const handleCheckout = async () => {
    setLoadingCheckout(true);
    try {
      // Verifica se está logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'mensal-30',
          userId: session.user.id,
          userEmail: session.user.email || '',
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('Erro ao iniciar checkout. Tente novamente.');
      }
    } catch {
      alert('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const features = [
    {
      icon: <Search className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-500/10 border-purple-500/20',
      title: 'Busca Unificada',
      desc: 'Acesse licitações do PNCP e portais governamentais de todo o Brasil em um só lugar, sem precisar navegar em dezenas de sites.'
    },
    {
      icon: <Bell className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-500/10 border-blue-500/20',
      title: 'Alertas em Tempo Real',
      desc: 'Receba notificações instantâneas por e-mail quando novos editais compatíveis com seu perfil forem publicados.'
    },
    {
      icon: <Filter className="w-6 h-6 text-cyan-400" />,
      color: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Filtros Avançados',
      desc: 'Filtre por modalidade, UF, município, valor, órgão e palavras-chave. Encontre exatamente o que você precisa em segundos.'
    },
    {
      icon: <MapPin className="w-6 h-6 text-green-400" />,
      color: 'bg-green-500/10 border-green-500/20',
      title: 'Cobertura Nacional',
      desc: 'Monitoramos licitações de todos os 26 estados e Distrito Federal — municípios, estados e governo federal.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-yellow-400" />,
      color: 'bg-yellow-500/10 border-yellow-500/20',
      title: 'Dados Atualizados',
      desc: 'Nossa integração direta com a API oficial do PNCP garante que você veja as licitações mais recentes, publicadas hoje.'
    },
    {
      icon: <Lock className="w-6 h-6 text-rose-400" />,
      color: 'bg-rose-500/10 border-rose-500/20',
      title: 'Segurança e Privacidade',
      desc: 'Plataforma 100% brasileira, hospedada no Brasil, com dados protegidos conforme a LGPD.'
    },
  ];

  const steps = [
    { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se em menos de 1 minuto com seu e-mail ou Google.' },
    { num: '02', title: 'Configure seus filtros', desc: 'Defina palavras-chave, estados, municípios e modalidades do seu interesse.' },
    { num: '03', title: 'Receba os editais', desc: 'Acompanhe licitações em tempo real direto no dashboard ou via e-mail.' },
  ];

  const planItems = [
    'Acesso ilimitado a todas as licitações do PNCP',
    'Filtros avançados por modalidade, UF e valor',
    'Alertas automáticos por e-mail',
    'Dashboard com licitações em tempo real',
    'Favoritar e acompanhar editais específicos',
    'Cobertura de todo o território nacional',
    'Suporte via e-mail prioritário',
    'Plataforma 100% brasileira (.com.BR)',
  ];

  return (
    <div className="min-h-screen bg-[#060606] text-white selection:bg-purple-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">Q</div>
              <span className="text-xl font-bold tracking-tight">Quero Licitação</span>
              <span className="hidden sm:inline ml-1 text-[10px] font-bold text-purple-400 border border-purple-500/30 rounded px-1 py-0.5 tracking-widest">.COM.BR</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
              <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
              <a href="#plano" className="hover:text-white transition-colors">Plano</a>
              <Link href="/login" className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">Entrar</Link>
              <Link href="/register" className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-500/20">Criar Conta</Link>
            </div>
            <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-black/90 px-4 py-4 space-y-3">
            <a href="#recursos" className="block text-gray-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Recursos</a>
            <a href="#como-funciona" className="block text-gray-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Como Funciona</a>
            <a href="#plano" className="block text-gray-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Plano</a>
            <Link href="/login" className="block text-center py-3 rounded-xl border border-white/10 text-white" onClick={() => setMenuOpen(false)}>Entrar</Link>
            <Link href="/register" className="block text-center py-3 rounded-xl bg-purple-600 text-white font-bold" onClick={() => setMenuOpen(false)}>Criar Conta Grátis</Link>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-32 pb-24 lg:pt-52 lg:pb-36 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-700/20 blur-[140px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-700/20 blur-[140px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge .com.BR */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold mb-6 tracking-widest uppercase">
              <Globe className="w-3.5 h-3.5" />
              Plataforma 100% Brasileira · querolicitacao.com.br
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Encontre Licitações <br />
              <span className="gradient-text">antes da Concorrência</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Monitore editais do PNCP e portais governamentais de todo o Brasil em tempo real.
              Sua empresa no lugar certo, na hora certa.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                Criar Conta Gratuitamente <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#plano"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                Ver Plano <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Dashboard Preview */}
            <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl">
              <div className="rounded-xl overflow-hidden bg-[#0c0c0c] border border-white/5">
                <div className="h-10 border-b border-white/5 flex items-center px-4 gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded h-6 flex items-center px-2 text-[10px] text-gray-500">
                    querolicitacao.com.br/dashboard
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-white/10 rounded" />
                      <div className="h-7 w-52 bg-white/20 rounded" />
                    </div>
                    <div className="h-9 w-28 bg-purple-600/40 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['bg-purple-500/10','bg-blue-500/10','bg-green-500/10'].map((c, i) => (
                      <div key={i} className={`h-20 rounded-xl border border-white/5 ${c} flex flex-col justify-end p-3 gap-1`}>
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        <div className="h-5 w-10 bg-white/30 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-14 rounded-lg border border-white/5 bg-white/5 flex items-center px-4 gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-3/4 bg-white/20 rounded" />
                          <div className="h-2 w-1/2 bg-white/10 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-white/5 rounded-full border border-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PONTOS FORTES ── */}
        <section id="recursos" className="py-24 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <Star className="w-3.5 h-3.5" /> Recursos
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Por que o <span className="text-purple-400">querolicitacao.com.br</span>?
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Uma plataforma feita no Brasil, para empresas brasileiras que querem dominar o mercado de compras públicas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${f.color} hover:scale-[1.02] transition-all group`}>
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 border`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section id="como-funciona" className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Simples de <span className="text-purple-400">usar</span>
              </h2>
              <p className="text-gray-400">Comece a monitorar licitações em menos de 3 minutos.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="grid md:grid-cols-3 gap-10">
                {steps.map((s, i) => (
                  <div key={i} className="text-center relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl font-black text-purple-400">{s.num}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PLANO ── */}
        <section id="plano" className="py-24 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Um plano. <span className="text-purple-400">Sem surpresas.</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Tudo que você precisa para monitorar licitações por um preço justo.
              </p>
            </div>

            <div className="max-w-md mx-auto relative">
              {/* Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-30" />
              <div className="relative p-8 rounded-3xl border border-purple-500/40 bg-[#0e0e14]">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Plano Mensal</h3>
                    <p className="text-gray-400 text-sm">Acesso completo à plataforma</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500 text-xs font-bold uppercase tracking-wider">Popular</span>
                </div>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-black">R$30</span>
                  <div className="text-gray-400 text-sm">
                    <div>/mês</div>
                    <div className="text-xs">sem fidelidade</div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {planItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loadingCheckout ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" />
                  ) : (
                    <>Assinar com Mercado Pago <Zap className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500 uppercase tracking-wider">
                  <span>🔒 Pagamento Seguro</span>
                  <span>·</span>
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-700/15 blur-[120px] rounded-full" />
          </div>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-bold mb-6 uppercase tracking-widest">
              <Globe className="w-3 h-3" /> querolicitacao.com.br
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Pare de perder editais.<br />
              <span className="gradient-text">Comece a vencer.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              Crie sua conta agora e comece a monitorar licitações de todo o Brasil em minutos.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg transition-all shadow-2xl shadow-purple-500/30"
            >
              Criar Minha Conta Agora <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 bg-black/60">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">Q</div>
            <span className="font-bold tracking-tight text-lg">Quero Licitação</span>
            <span className="text-xs font-bold text-purple-400 border border-purple-500/30 rounded px-1 tracking-widest">.COM.BR</span>
          </div>
          <p className="text-gray-600 text-xs mb-4">Plataforma brasileira de monitoramento de licitações públicas</p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500 mb-6">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">Criar Conta</Link>
            <a href="#plano" className="hover:text-gray-300 transition-colors">Plano</a>
          </div>
          <p className="text-gray-600 text-xs">© 2026 querolicitacao.com.br — Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
