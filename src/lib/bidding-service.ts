/**
 * Utilitários para integração com APIs de licitação
 */

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';

export interface BiddingOpportunity {
  id: string;
  source: 'PNCP' | 'DOU';
  title: string;
  description: string;
  agency: string;
  location: string;
  editalNumber?: string;
  value?: number;
  datePublished: string;
  startDate?: string;
  endDate?: string;
  modality?: string;
  link: string;
}

const MODALIDADES = {
  1: "Leilão - Eletrônico",
  2: "Diálogo Competitivo",
  3: "Concurso",
  4: "Concorrência - Eletrônica",
  5: "Concorrência - Presencial",
  6: "Pregão - Eletrônico",
  7: "Pregão - Presencial",
  8: "Dispensa",
  9: "Inexigibilidade",
  10: "Manifestação de Interesse",
  11: "Pré-qualificação",
  12: "Credenciamento",
  13: "Leilão - Presencial"
};

// Remove acentos para busca flexível, igual ao SQLite do programa local
function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Busca licitações no PNCP (Portal Nacional de Contratações Públicas)
 */
export async function fetchPNCPBiddings(ufs: string[] = [], keywords: string = '', modalities: number[] = [], municipalities: string[] = [], signal?: AbortSignal, daysFilter: number = 30): Promise<BiddingOpportunity[]> {
  if (ufs.length === 0) return []; // Obrigatório ter estado
  
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysFilter);

    const dateStart = start.toISOString().split('T')[0].replace(/-/g, '');
    const dateEnd = end.toISOString().split('T')[0].replace(/-/g, '');
    
    // Modalidades que mais costumam ter licitações no dia a dia
    // De 1 a 13 (Conforme o programa desktop validado pelo usuário)
    // Definir as modalidades
    const modsToSearch = modalities.length > 0 ? modalities : [6, 8, 4, 1, 2, 3, 5, 7, 9, 10, 11, 12, 13];
    
    // Configura os termos da busca (divididos por vírgula)
    const searchTerms = keywords.split(',').map(t => removeAccents(t.trim())).filter(t => t.length > 0);
    
    // Gerar combinações de UF e Modalidade
    const pairs: {uf: string, mod: number}[] = [];
    ufs.forEach(uf => {
      modsToSearch.forEach(mod => pairs.push({ uf, mod }));
    });

    let allItems: any[] = [];

    // Busca de 4 em 4 requisições combinadas (UF + Mod)
    for (let i = 0; i < pairs.length; i += 4) {
      if (signal?.aborted) throw new Error('AbortError');
      const batch = pairs.slice(i, i + 4);
      const requests = batch.map(async ({ uf, mod }) => {
        const ufParam = `&uf=${uf}`;
        const targetUrl = `${PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dateStart}&dataFinal=${dateEnd}${ufParam}&codigoModalidadeContratacao=${mod}&pagina=1&tamanhoPagina=50`;
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
        
        const localController = new AbortController();
        const timeoutId = setTimeout(() => localController.abort(), 12000); // 12s máximo por requisição

        const onParentAbort = () => localController.abort();
        if (signal) {
          signal.addEventListener('abort', onParentAbort);
          if (signal.aborted) localController.abort();
        }

        try {
          const response = await fetch(proxyUrl, { signal: localController.signal });
          if (response.ok) {
            const text = await response.text();
            if (text) {
              const data = JSON.parse(text);
              return data.data || data.items || [];
            }
          }
        } catch (err: any) {
          if (signal?.aborted) throw new Error('AbortError');
        } finally {
          clearTimeout(timeoutId);
          if (signal) signal.removeEventListener('abort', onParentAbort);
        }
        return [];
      });

      const results = await Promise.all(requests);
      allItems.push(...results.flat());

      // Pausa entre lotes
      if (i + 4 < pairs.length) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    // Filtra apenas licitações que estão com prazo aberto (data de encerramento da proposta de hoje para frente)
    const hoje = new Date();
    // Zerar as horas para garantir que o que vence hoje ainda apareça durante o dia
    hoje.setHours(0, 0, 0, 0);

    allItems = allItems.filter(item => {
      // Se não houver data de encerramento definida, mantemos o item na lista por segurança
      if (!item.dataEncerramentoProposta) return true;
      const dataEncerramento = new Date(item.dataEncerramentoProposta);
      return dataEncerramento >= hoje;
    });

    // Aplica filtro de municípios caso o usuário tenha selecionado
    if (municipalities.length > 0) {
      const normalMuns = municipalities.map(m => removeAccents(m));
      allItems = allItems.filter(item => {
        const itemMun = removeAccents(item.unidadeOrgao?.municipioNome || '');
        return normalMuns.some(m => m === itemMun || m.includes(itemMun) || itemMun.includes(m));
      });
    }

    // Aplica o filtro local caso o usuário tenha digitado palavras
    if (searchTerms.length > 0) {
      allItems = allItems.filter(item => {
        const objetoNormalizado = removeAccents(item.objetoCompra || item.objeto || '');
        // Se a busca tiver termos, deve bater com pelo menos um termo (OR logic como no Python)
        return searchTerms.some(term => objetoNormalizado.includes(term));
      });
    }

    return allItems.map((item: any) => ({
      id: item.numeroControlePNCP,
      source: 'PNCP',
      title: item.objetoCompra || item.objeto || 'Sem título',
      description: item.objetoCompra || item.objeto || '',
      agency: item.orgaoEntidade?.razaoSocial || 'Órgão não informado',
      location: item.unidadeOrgao?.municipioNome ? `${item.unidadeOrgao.municipioNome} - ${item.unidadeFederativa?.sigla || item.unidadeOrgao?.ufSigla}` : (item.unidadeFederativa?.sigla || item.unidadeOrgao?.ufSigla || 'Brasil'),
      editalNumber: item.anoCompra && item.numeroCompra ? `${item.numeroCompra}/${item.anoCompra}` : (item.numeroCompra || item.numeroControlePNCP),
      value: item.valorTotalEstimado || item.valorEstimado,
      datePublished: item.dataPublicacaoPncp,
      startDate: item.dataAberturaProposta,
      endDate: item.dataEncerramentoProposta,
      modality: item.modalidadeNome || 'Não informada',
      link: item.linkSistemaOrigem || `https://pncp.gov.br/app/editais?q=${item.numeroControlePNCP}`,
    }));
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'AbortError') throw error;
    console.error('Erro ao buscar dados do PNCP:', error);
    return [];
  }
}

/**
 * Busca licitações no Diário Oficial da União (via API própria)
 */
export async function fetchDOUBiddings(ufs: string[] = [], keywords: string = '', signal?: AbortSignal, daysFilter: number = 30): Promise<BiddingOpportunity[]> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysFilter);

    const dateStart = start.toISOString().split('T')[0].replace(/-/g, '');
    const dateEnd = end.toISOString().split('T')[0].replace(/-/g, '');

    const searchTerm = keywords || 'Aviso de Licitação';
    // s=do3 especifica a Seção 3 (Contratos, Editais)
    const targetUrl = `https://www.in.gov.br/o/buscadou/select?q=${encodeURIComponent(searchTerm)}&s=do3&wt=json&start=0&rows=30&sort=data_publicacao+desc&fq=data_publicacao:[${dateStart} TO ${dateEnd}]`;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    
    const localController = new AbortController();
    const timeoutId = setTimeout(() => localController.abort(), 12000);

    const onParentAbort = () => localController.abort();
    if (signal) {
      signal.addEventListener('abort', onParentAbort);
      if (signal.aborted) localController.abort();
    }

    try {
      const response = await fetch(proxyUrl, { signal: localController.signal });

      if (!response.ok) return [];

      const text = await response.text();
      if (!text) return [];
      
      const data = JSON.parse(text);
      const docs = data.response?.docs || [];

      return docs.map((doc: any) => ({
        id: doc.id,
        source: 'DOU',
        title: doc.title || 'Aviso de Licitação',
        description: doc.content || doc.title,
        agency: doc.orgao || 'Órgão não informado',
        location: doc.unidade_federativa || 'Brasil',
        editalNumber: undefined,
        value: undefined, 
        datePublished: doc.data_publicacao,
        startDate: undefined,
        endDate: undefined,
        modality: 'Aviso DOU',
        link: `https://www.in.gov.br/web/dou/-/${doc.urlTitle}`,
      }));
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onParentAbort);
    }
  } catch (error: any) {
    if (signal?.aborted) throw new Error('AbortError');
    // Omit logs explicitly for DOU if it's failing on the backend so it doesn't pollute
    return [];
  }
}

/**
 * Busca combinada (PNCP + DOU)
 */
export async function searchAllBiddings(
  ufs: string[] = [],
  keywords: string = '',
  modalities: number[] = [],
  municipalities: string[] = [],
  signal?: AbortSignal,
  daysFilter: number = 30
): Promise<BiddingOpportunity[]> {
  const [pncp, dou] = await Promise.all([
    fetchPNCPBiddings(ufs, keywords, modalities, municipalities, signal, daysFilter).catch(e => {
      if (e.message !== 'AbortError') console.error('Erro no PNCP:', e);
      if (e.message === 'AbortError') throw e;
      return [];
    }),
    fetchDOUBiddings(ufs, keywords, signal, daysFilter).catch(e => {
      if (e.message !== 'AbortError') console.error('Erro no DOU:', e);
      if (e.message === 'AbortError') throw e;
      return [];
    })
  ]);

  // Filtra DOU por UF se necessário (já que a API do DOU é por pesquisa geral)
  const filteredDou = ufs.length > 0 ? dou.filter(d => ufs.some(uf => d.location.includes(uf))) : dou;

  return [...pncp, ...filteredDou].sort((a, b) => {
    // Prioritize Abertura/Encerramento for sorting
    const timeA = a.startDate ? new Date(a.startDate).getTime() : (a.endDate ? new Date(a.endDate).getTime() : new Date(a.datePublished).getTime() + 99999999999);
    const timeB = b.startDate ? new Date(b.startDate).getTime() : (b.endDate ? new Date(b.endDate).getTime() : new Date(b.datePublished).getTime() + 99999999999);
    return timeA - timeB;
  });
}
