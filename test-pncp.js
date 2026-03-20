const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';
const mod = 4; // Concorrência Eletrônica (from user console logs)
const uf = 'RO'; // From user console logs

const end = new Date();
const start = new Date();
start.setDate(end.getDate() - 30);
const dateStart = start.toISOString().split('T')[0].replace(/-/g, '');
const dateEnd = end.toISOString().split('T')[0].replace(/-/g, '');
const targetUrl = `${PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dateStart}&dataFinal=${dateEnd}&uf=${uf}&codigoModalidadeContratacao=${mod}&pagina=1&tamanhoPagina=50`;

console.log("Fetching:", targetUrl);

fetch(targetUrl, {
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
})
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => {
    if (!text) { console.log("Empty text"); return; }
    const data = JSON.parse(text);
    console.log(`Found ${data.data ? data.data.length : (data.items ? data.items.length : 0)} items using raw fetch.`);
    // O site antigo usa `data.data` e não `data.items` !!!!
  })
  .catch(err => console.error("Error:", err));
