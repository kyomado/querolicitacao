const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';
const mod = 4; // Concorrência Eletrônica (from user console logs)
const uf = 'RO'; // From user console logs

const end = new Date();
const start = new Date();
start.setDate(end.getDate() - 30);
const dateStart = start.toISOString().split('T')[0].replace(/-/g, '');
const dateEnd = end.toISOString().split('T')[0].replace(/-/g, '');
const targetUrl = `${PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dateStart}&dataFinal=${dateEnd}&codigoModalidadeContratacao=${mod}&pagina=1&tamanhoPagina=50`;
// Remove uf=RO to ensure we get SOMETHING from Brasil

console.log("Fetching:", targetUrl);

fetch(targetUrl, {
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0'
  }
})
  .then(res => res.json())
  .then(data => {
    let arr = data.data || data.items || [];
    if(arr.length > 0) {
       console.log("Keys:", Object.keys(arr[0]).join(', '));
       console.log("Sample Date info:", {
          dataPublicacaoPncp: arr[0].dataPublicacaoPncp,
          dataAtualizacaoPncp: arr[0].dataAtualizacaoPncp,
          dataAberturaProposta: arr[0].dataAberturaProposta,
          dataEncerramentoProposta: arr[0].dataEncerramentoProposta,
          modalidadeId: arr[0].modalidadeId,
          modalidadeNome: arr[0].modalidadeNome,
       });
    } else {
       console.log("Array empty.");
    }
  })
  .catch(err => console.error("Error:", err));
