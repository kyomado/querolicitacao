const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';

async function testFetch() {
  const uf = 'RO';
  const mod = 4;
  const keywords = 'construção'; // A typical search term user might use
  const searchTerms = keywords.split(',').map(t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()).filter(t => t.length > 0);
  
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const dateStart = start.toISOString().split('T')[0].replace(/-/g, '');
  const dateEnd = end.toISOString().split('T')[0].replace(/-/g, '');
  
  const targetUrl = `${PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dateStart}&dataFinal=${dateEnd}&uf=${uf}&codigoModalidadeContratacao=${mod}&pagina=1&tamanhoPagina=50`;
  
  console.log("Fetching PNCP:", targetUrl);
  
  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await res.text();
    const data = JSON.parse(text);
    
    let allItems = data.data || data.items || [];
    console.log(`Initial objects: ${allItems.length}`);
    
    // Filtro por termo
    if (searchTerms.length > 0) {
      allItems = allItems.filter(item => {
        const objRaw = item.objetoCompra || item.objeto || '';
        const objNorm = objRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return searchTerms.some(t => objNorm.includes(t));
      });
    }
    console.log(`After search term filter: ${allItems.length}`);
    
    // Mapeamento
    const mapped = allItems.map(item => ({
      id: item.numeroControlePNCP,
      title: item.objetoCompra || item.objeto || 'Sem título',
      startDate: item.dataAberturaProposta,
      endDate: item.dataEncerramentoProposta,
      modality: item.modalidadeNome || 'Não informada',
    }));
    
    console.log("Mapped results:", JSON.stringify(mapped.slice(0, 1), null, 2));
    
  } catch (err) {
    console.error(err);
  }
}

testFetch();
