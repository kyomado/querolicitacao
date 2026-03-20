'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Bell, User, ExternalLink, Calendar, MapPin, DollarSign, Loader2, Shield, LogOut, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { searchAllBiddings, BiddingOpportunity } from '@/lib/bidding-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MODALITIES_MAP = [
  { id: 1, name: "Leilão - Eletrônico" },
  { id: 2, name: "Diálogo Competitivo" },
  { id: 3, name: "Concurso" },
  { id: 4, name: "Concorrência - Eletrônica" },
  { id: 5, name: "Concorrência - Presencial" },
  { id: 6, name: "Pregão - Eletrônico" },
  { id: 7, name: "Pregão - Presencial" },
  { id: 8, name: "Dispensa" },
  { id: 9, name: "Inexigibilidade" },
  { id: 10, name: "Manifestação de Interesse" },
  { id: 11, name: "Pré-qualificação" },
  { id: 12, name: "Credenciamento" },
  { id: 13, name: "Leilão - Presencial" }
];
const ALL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA','PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].sort();

export default function DashboardPage() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };
  
  const [biddings, setBiddings] = useState<BiddingOpportunity[]>([]);
  const [favoriteBiddings, setFavoriteBiddings] = useState<BiddingOpportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'search' | 'favorites' | 'settings'>('search');
  const [sortOption, setSortOption] = useState<'date_asc' | 'date_desc' | 'value_asc' | 'value_desc'>('date_asc');
  const [daysFilter, setDaysFilter] = useState<number>(30);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [ufs, setUfs] = useState<string[]>([]);
  const [modalities, setModalities] = useState<number[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [munSearch, setMunSearch] = useState('');

  const [isPro, setIsPro] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Verifica se é email de admin (sempre liberado)
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
        const isAdmin = adminEmails.length > 0 && adminEmails.includes(session.user.email || '');

        if (isAdmin) {
          setIsSubscribed(true);
          setIsPro(true);
        } else {
          // Verifica assinatura ativa no Supabase
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
          setIsSubscribed(!!sub);
          setIsPro(!!sub);
        }
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (settings) {
          if (settings.default_keywords) {
            const keys = settings.default_keywords.split(',').filter(Boolean);
            setInterests(keys);
          }
          if (settings.default_ufs && settings.default_ufs.length > 0) {
            setUfs(settings.default_ufs);
          }
          if (settings.default_modalities && settings.default_modalities.length > 0) {
            setModalities(settings.default_modalities);
          }
          if (settings.default_days_range) {
            setDaysFilter(settings.default_days_range);
          }
        }
        
        const { data: saved } = await supabase.from('saved_biddings').select('*').eq('user_id', session.user.id);
        if (saved) {
          setSavedIds(new Set(saved.map((s: any) => s.bidding_id)));
          setFavoriteBiddings(saved.map((s: any) => ({
             id: s.bidding_id,
             source: s.source,
             title: s.title,
             description: s.description,
             agency: s.agency,
             location: s.location,
             editalNumber: s.edital_number,
             value: s.estimated_value,
             datePublished: s.date_published,
             startDate: s.start_date,
             endDate: s.end_date,
             modality: s.modality,
             link: s.link
          })));
        }
      } else {
        // Não logado → manda para login
        router.push('/login');
      }
      setLoadingSubscription(false);
    };
    fetchUserAndSettings();
  }, []);

  const toggleFavorite = async (bid: BiddingOpportunity) => {
    if (!user) return alert('Faça login para salvar licitações!');
    
    const isSaved = savedIds.has(bid.id);
    const newSaved = new Set(savedIds);
    let newFavArray = [...favoriteBiddings];
    
    if (isSaved) {
      newSaved.delete(bid.id);
      newFavArray = newFavArray.filter(f => f.id !== bid.id);
      setSavedIds(newSaved);
      setFavoriteBiddings(newFavArray);
      
      await supabase.from('saved_biddings').delete().eq('user_id', user.id).eq('bidding_id', bid.id);
    } else {
      newSaved.add(bid.id);
      newFavArray.push(bid);
      setSavedIds(newSaved);
      setFavoriteBiddings(newFavArray);
      
      await supabase.from('saved_biddings').insert({
        user_id: user.id,
        bidding_id: bid.id,
        source: bid.source,
        title: bid.title,
        description: bid.description,
        agency: bid.agency,
        location: bid.location,
        edital_number: bid.editalNumber,
        estimated_value: bid.value,
        date_published: bid.datePublished,
        start_date: bid.startDate,
        end_date: bid.endDate,
        modality: bid.modality,
        link: bid.link
      });
    }
  };

  const saveUserSettings = async () => {
    if (!user) return alert('Faça login para salvar configurações!');
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        default_keywords: interests.join(','),
        default_ufs: ufs,
        default_modalities: modalities,
        default_days_range: daysFilter,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
      alert('Seus filtros (Estados, Modalidades e Interesses) foram salvos como Padrão!');
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadBiddings = async (overrideTerm?: string) => {
    if (ufs.length === 0) {
      alert("Por favor, selecione pelo menos um estado.");
      return; 
    }

    // Cancela a requisição anterior se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const termToUse = typeof overrideTerm === 'string' ? overrideTerm : searchTerm;
      const data = await searchAllBiddings(ufs, termToUse, modalities, municipalities, controller.signal, daysFilter);
      setBiddings(data);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'AbortError') {
        console.log('Busca cancelada pelo usuário');
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleStopSync = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'silver_plan',
          userId: 'user_123',
          userEmail: 'cliente@exemplo.com'
        })
      });
      const data = await resp.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      alert('Erro ao iniciar checkout');
    }
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  useEffect(() => {
    // Busca inicial: usa o primeiro interesse como termo se houver, ou busca geral
    const initialKeyword = interests.length > 0 ? interests[0] : '';
    setSearchTerm(initialKeyword);
    loadBiddings(initialKeyword);
  }, []); // Só no montagem

  useEffect(() => {
    async function loadMuns() {
      if (ufs.length === 0) {
        setAvailableMunicipalities([]);
        setMunicipalities([]);
        return;
      }
      
      let allMuns: string[] = [];
      const reqs = ufs.map(uf => fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`).then(res => res.json()));
      try {
        const results = await Promise.all(reqs);
        results.forEach(data => {
          if (Array.isArray(data)) {
             allMuns.push(...data.map((m: any) => m.nome));
          }
        });
      } catch (err) {
        console.error('Failed to load municipalities');
      }
      allMuns.sort((a,b) => a.localeCompare(b));
      setAvailableMunicipalities(allMuns);
      // Mantem apenas os que ainda pertencem nos estados selecionados
      setMunicipalities(prev => prev.filter(m => allMuns.includes(m)));
    }
    loadMuns();
  }, [ufs]);

  useEffect(() => {
    // Carregamento inicial removido para respeitar formulário sob demanda sem UFs
  }, []); // Só no montagem

  return (
    <div className="min-h-screen bg-[#060606] text-white flex transition-all duration-500">

      {/* Paywall Overlay — exibe se logado mas sem assinatura */}
      {!loadingSubscription && !isSubscribed && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-40" />
            <div className="relative p-8 rounded-3xl border border-purple-500/40 bg-[#0e0e14] text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-black mb-2">Acesso Restrito</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                O dashboard é exclusivo para assinantes.<br />
                Assine o plano mensal por <span className="text-white font-bold">R$30/mês</span> e monitore licitações de todo o Brasil.
              </p>
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-5xl font-black">R$30</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                Assinar com Mercado Pago
              </button>
              <button
                onClick={handleLogout}
                className="mt-3 w-full py-3 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
            Q
          </div>
          <span className="text-xl font-bold tracking-tight">Quero Licitação</span>
        </div>
        
        <nav className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">Menu Principal</p>
            <button 
              onClick={() => setViewMode('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${viewMode === 'search' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Search className="w-4 h-4" /> Buscar Geral
            </button>
            <button 
              onClick={() => setViewMode('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${viewMode === 'favorites' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Bell className="w-4 h-4" /> Meus Alertas
            </button>
          </div>
        </nav>
        
        <div className="mt-8">
          {!isPro ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 mb-4 group hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <p className="text-xs font-bold text-purple-400 uppercase">Upgrade para Pro</p>
              </div>
              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">Libere acesso às licitações do Diário Oficial e alertas via E-mail.</p>
              <button 
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl bg-purple-600 text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
              >
                Assinar Pro - R$ 197
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
              <p className="text-xs font-bold text-green-400 uppercase">Plano Pro Ativo</p>
            </div>
          )}
          <button 
             onClick={() => setViewMode('settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium mb-1 ${viewMode === 'settings' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <User className="w-4 h-4" /> Configurações
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 text-sm hover:bg-red-500/10 rounded-xl transition-all mt-1"
          >
            <LogOut className="w-4 h-4" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="font-bold text-xl tracking-tight">Oportunidades de Negócio</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Buscador Inteligente em Tempo Real</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative group cursor-pointer">
               <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-600 rounded-full border-2 border-black animate-pulse" />
             </div>
             <div className="h-10 w-px bg-white/5" />
             <div className="flex items-center gap-3 group cursor-pointer">
               <div className="text-right">
                 <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                   {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Visitante'}
                 </p>
                 <p className="text-[10px] text-gray-500">Membro Premium</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[1px]">
                 <div className="w-full h-full rounded-full bg-[#060606] flex items-center justify-center font-bold text-xs uppercase">
                   {(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'V')}
                 </div>
               </div>
             </div>
          </div>
        </header>

        <section className="p-10 max-w-6xl mx-auto w-full">
          
          {viewMode === 'settings' ? (
            <div className="animate-fade-in space-y-8">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                   <User className="w-6 h-6 text-purple-400" />
                 </div>
                 <div>
                   <h2 className="font-bold text-2xl">Configurações Pessoais</h2>
                   <p className="text-gray-400 text-sm">Gerencie os padrões de pesquisa vinculados à sua conta.</p>
                 </div>
               </div>
               
               <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-8">
                  <div>
                    <h3 className="text-white font-bold mb-2">Janela de Tempo da Pesquisa</h3>
                    <p className="text-[11px] text-gray-400 mb-4">Selecione o limite retroativo de dias para varrer os editais publicados no PNCP e no Diário Oficial.</p>
                    <div className="flex flex-wrap gap-4">
                       {[30, 60, 90].map(days => (
                         <button 
                           key={days}
                           onClick={() => setDaysFilter(days)}
                           className={`px-6 py-3 rounded-xl text-[11px] uppercase font-bold transition-all border shadow-sm ${daysFilter === days ? 'bg-purple-600 border-purple-500 text-white shadow-purple-600/20' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}
                         >
                           Retroagir {days} Dias
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-white/5 pt-8">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                       <Search className="w-4 h-4 text-purple-500" />
                       Palavras-chave Salvas Padrão
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-4">Adicione os termos exatos que serão pré-carregados na sua barra central quando você abrir o site.</p>
                    <div className="flex flex-col gap-4">
                      {/* Interactive Tags */}
                      <div className="flex flex-wrap gap-2 min-h-12 p-4 bg-black/40 rounded-xl border border-white/5">
                        {interests.map((item, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2 font-bold shadow-sm">
                            {item}
                            <button onClick={() => setInterests(interests.filter((_, i) => i !== idx))} className="text-purple-400 hover:text-white hover:bg-purple-500/30 rounded-full w-4 h-4 flex items-center justify-center transition-colors">×</button>
                          </span>
                        ))}
                        {interests.length === 0 && <span className="text-[11px] text-gray-600 m-auto font-medium">Nenhum termo padrão salvo.</span>}
                      </div>
                      
                      {/* Input Add */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Digite um novo termo e aperte o '+'" 
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-purple-500/50 transition-all font-medium text-white"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                        />
                        <button onClick={addInterest} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                          <span className="text-purple-400 font-black">+</span> Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/5 pt-8 flex justify-end">
                    <button 
                      onClick={saveUserSettings}
                      disabled={isSaving || !user}
                      className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-sm font-bold transition-all shadow-xl shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 
                      Gravar Todos os Padrões
                    </button>
                  </div>
               </div>
            </div>
          ) : (
            <>
          {/* Filters Advanced */}
          <div className="flex flex-col gap-6 mb-10 bg-white/5 p-8 border border-white/10 rounded-3xl">
             <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-bold flex items-center gap-2"><Filter className="w-5 h-5 text-purple-500" /> Busca Avançada</h2>
             </div>
             
             {/* Keywords */}
             <div className="flex-1 relative group w-full mb-2">
               <label className="text-gray-300 text-sm font-medium mb-2 block">Palavras-chave</label>
               <div className="relative">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Qual o objeto? (ex: Compra de iPads, Limpeza...)" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && loadBiddings()}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all text-sm"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Modalities */}
               <div>
                  <label className="text-gray-300 text-sm font-medium mb-1 block">Modalidades</label>
                  <p className="text-[10px] text-gray-500 mb-3 block">Deixe em branco para buscar em todas.</p>
                  <div className="flex flex-wrap gap-2">
                    {MODALITIES_MAP.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setModalities(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                        className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                          modalities.includes(m.id) 
                            ? 'bg-purple-600 border-purple-500 text-white font-bold' 
                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-purple-500/50 hover:text-white'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
               </div>

               {/* States */}
               <div>
                  <label className="text-gray-300 text-sm font-medium mb-1 block">Estados (Obrigatório)</label>
                  <p className="text-[10px] text-gray-500 mb-3 block">Selecione um ou mais estados para sincronizar.</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATES.map(s => (
                      <button 
                        key={s}
                        onClick={() => setUfs(prev => prev.includes(s) ? prev.filter(uf => uf !== s) : [...prev, s])}
                        className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                          ufs.includes(s) 
                            ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/20' 
                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-blue-500/50 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
               </div>
             </div>

             {/* Municipalities */}
             <div className="mt-4">
                <label className="text-gray-300 text-sm font-medium mb-1 block">Municípios (Opcional)</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder={ufs.length === 0 ? "Selecione um estado primeiro para carregar os municípios..." : "Filtrar por nome do município..."}
                    disabled={ufs.length === 0}
                    value={munSearch}
                    onChange={e => setMunSearch(e.target.value)}
                    className="w-full xl:w-1/2 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all disabled:opacity-50"
                  />
                  {ufs.length > 0 && availableMunicipalities.length > 0 && (
                     <div className="h-44 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-3 flex flex-wrap gap-2 content-start custom-scrollbar">
                        {availableMunicipalities.filter(m => m.toLowerCase().includes(munSearch.toLowerCase())).map(m => (
                          <label key={m} className={`flex items-center select-none gap-2 text-[11px] px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                             municipalities.includes(m) ? 'bg-purple-600 border-purple-500 text-white font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={municipalities.includes(m)}
                              onChange={() => setMunicipalities(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                              className="hidden"
                            />
                            {m}
                          </label>
                        ))}
                     </div>
                  )}
                </div>
             </div>

             <div className="pt-6 mt-4 border-t border-white/10 flex justify-end gap-3">
                {loading ? (
                  <button 
                    onClick={handleStopSync}
                    className="px-8 py-3 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" /> Parar Busca
                  </button>
                ) : (
                  <button 
                    onClick={() => loadBiddings()}
                    disabled={ufs.length === 0}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all shadow-xl shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    <Search className="w-4 h-4" /> Pesquisar
                  </button>
                )}
             </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <h2 className="font-bold text-lg">Novas Oportunidades</h2>
               <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                 Real Time
               </div>
            </div>
            <div className="flex items-center gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
               <button 
                  onClick={() => setSortOption(sortOption === 'date_asc' ? 'date_desc' : 'date_asc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-sm transition-all ${
                    sortOption.startsWith('date') ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                  }`}
               >
                  Sessão {sortOption === 'date_asc' ? '↓' : sortOption === 'date_desc' ? '↑' : ''}
               </button>
               <button 
                  onClick={() => setSortOption(sortOption === 'value_desc' ? 'value_asc' : 'value_desc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-sm transition-all ${
                    sortOption.startsWith('value') ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                  }`}
               >
                  Valor {sortOption === 'value_desc' ? '↓' : sortOption === 'value_asc' ? '↑' : ''}
               </button>
            </div>
          </div>

          {/* Grid of Biddings */}
          <div className="space-y-5">
            {loading && viewMode === 'search' ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 w-full glass rounded-3xl border border-white/5 animate-pulse" />
              ))
            ) : (viewMode === 'favorites' ? favoriteBiddings : biddings).length > 0 ? (
              (() => {
                const arr = viewMode === 'favorites' ? favoriteBiddings : biddings;
                return [...arr].sort((a, b) => {
                  if (sortOption === 'date_asc') {
                    const timeA = a.endDate ? new Date(a.endDate).getTime() : (a.startDate ? new Date(a.startDate).getTime() : new Date(a.datePublished).getTime() + 99999999);
                    const timeB = b.endDate ? new Date(b.endDate).getTime() : (b.startDate ? new Date(b.startDate).getTime() : new Date(b.datePublished).getTime() + 99999999);
                    return timeA - timeB;
                  }
                  if (sortOption === 'date_desc') {
                    const timeA = a.endDate ? new Date(a.endDate).getTime() : (a.startDate ? new Date(a.startDate).getTime() : new Date(a.datePublished).getTime() - 99999999);
                    const timeB = b.endDate ? new Date(b.endDate).getTime() : (b.startDate ? new Date(b.startDate).getTime() : new Date(b.datePublished).getTime() - 99999999);
                    return timeB - timeA;
                  }
                  if (sortOption === 'value_asc') return (a.value || 0) - (b.value || 0);
                  if (sortOption === 'value_desc') return (b.value || 0) - (a.value || 0);
                  return 0;
                }).map((bid) => {
                  const isExpiringSoon = viewMode === 'favorites' && bid.endDate && (new Date(bid.endDate).getTime() - Date.now() <= 5 * 24 * 60 * 60 * 1000) && (new Date(bid.endDate).getTime() - Date.now() > 0);
                  
                  return (
                    <div 
                      key={bid.id} 
                      className={`group relative p-8 rounded-[2rem] border transition-all duration-300 hover:scale-[1.01] flex flex-col md:flex-row gap-6 ${
                        bid.source === 'DOU' && !isPro 
                        ? 'border-dashed border-purple-500/20 bg-purple-500/[0.02] overflow-hidden' 
                        : (isExpiringSoon ? 'border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50' : 'border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-purple-500/30')
                      }`}
                    >
                  {/* Lock Screen for Non-PRO showing DOU results */}
                  {bid.source === 'DOU' && !isPro && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[4px] bg-black/40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/50">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-sm mb-1">Apenas para Membros Pro</h4>
                      <p className="text-[10px] text-gray-400 mb-4 max-w-[200px]">Este edital exclusivo do Diário Oficial requer assinatura ativa.</p>
                      <button 
                        onClick={handleCheckout}
                        className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] font-bold border border-purple-500/40 transition-all uppercase tracking-wider"
                      >
                        Desbloquear Gritos
                      </button>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 relative pr-12">
                    <button 
                      onClick={(e) => { e.preventDefault(); toggleFavorite(bid); }}
                      className="absolute -top-1 right-0 p-2 rounded-full hover:bg-white/10 transition-colors z-20 group/fav"
                      title={savedIds.has(bid.id) ? "Remover dos Favoritos" : "Salvar Licitação"}
                    >
                      <Star 
                        className={`w-5 h-5 transition-all ${savedIds.has(bid.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 group-hover/fav:text-yellow-400'}`} 
                      />
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                       {isExpiringSoon && (
                         <span className="px-2.5 py-1 rounded-md bg-red-600/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                           🚨 Encerrando nos próximos 5 dias
                         </span>
                       )}
                       <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                         bid.source === 'PNCP' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-purple-600/20 text-purple-400 border border-purple-500/20'
                       }`}>
                         {bid.source}
                       </span>
                       <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                         {bid.modality || 'Licitação'}
                       </span>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-3 group-hover:text-purple-400 transition-colors leading-snug">
                      {bid.editalNumber ? `Edital Nº ${bid.editalNumber}` : `Licitação Nº ${bid.id}`}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      {bid.startDate && (
                        <div className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 w-fit px-3 py-1.5 rounded-lg border border-green-500/20">
                          <Calendar className="w-3.5 h-3.5" /> 
                          Início das Propostas: {format(new Date(bid.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                      {bid.endDate && (
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/10 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20">
                          <Calendar className="w-3.5 h-3.5" /> 
                          Data da Sessão: {format(new Date(bid.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> 
                        Publicado: {format(new Date(bid.datePublished), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" /> 
                        <span className="truncate max-w-[250px] font-medium">{bid.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <User className="w-3.5 h-3.5 text-gray-500" /> 
                        <span className="font-medium text-gray-300">{bid.agency}</span>
                      </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {bid.description}
                      </p>
                    </div>
                  </div>

                  <div className="md:w-48 lg:w-56 flex flex-col justify-between items-end gap-6 pt-4 md:pt-0">
                    {bid.value ? (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Estimativa</p>
                        <p className="text-xl font-black text-green-400 tracking-tight">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid.value)}
                        </p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Valor</p>
                        <p className="text-lg font-bold text-gray-600 italic">Sob Consulta</p>
                      </div>
                    )}

                    </div>
                  </div>
                );
              })})()
            ) : (
              <div className="py-32 text-center flex flex-col items-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Search className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="font-bold text-2xl mb-3 tracking-tight">Nada por aqui no momento</h3>
                <p className="text-gray-500 max-w-sm leading-relaxed">Não encontramos licitações para estes termos. Tente expandir sua busca ou alterar suas Modalidades/Estados.</p>
              </div>
            )}
          </div>
          </>
          )}
        </section>
      </main>
    </div>
  );
}
