/*
 * Aplica um export da Solides no formato "Folha de Ponto" (RFP-*.xls)
 * sobre o public/RelatorioBancoHoras.xls que o app lê.
 *
 * Uso:
 *   node scripts/aplicar-folha-ponto.cjs <arquivo-rfp.xls> [--dry-run]
 *
 * O formato novo não é o mesmo que o app parseia ("Relatório Banco de Horas
 * Colaboradores"), então em vez de sobrescrever o arquivo inteiro este script
 * só troca o saldo acumulado de cada colaborador — a linha
 * "Total Praticado Hora Excedente:" (coluna 12) do bloco dele.
 * Quem não vier no export fica com o saldo antigo.
 *
 * No formato novo cada colaborador é:
 *   DADOS DO COLABORADOR
 *   Nome: <col 3>
 *   ... espelho dia a dia ...
 *   Saldo Anterior de Banco de Horas: <col 44 desta linha>
 *   <col 44 da linha seguinte> = saldo acumulado final
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ARQUIVO_APP = path.join(__dirname, '..', 'public', 'RelatorioBancoHoras.xls');

// Data até a qual os pontos de cada equipe foram ajustados, por gestor.
// Quem não estiver aqui usa DATA_PADRAO.
const DATA_PADRAO = '16/08/2026';
const DATA_POR_GESTOR = {
  'Alberto Luiz Marinho Batista': '14/08/2026',
  'Erick Café Santos Júnior': '07/08/2026',
  'Suzana Martins Tavares': '13/08/2026',
};

/**
 * Nomes que não aparecem no painel e ficam com o saldo congelado.
 * Lido de src/lib/excel.ts para não haver duas listas divergindo em silêncio.
 */
function lerExcluidos() {
  const p = path.join(__dirname, '..', 'src', 'lib', 'excel.ts');
  const src = fs.readFileSync(p, 'utf8');
  const bloco = /const EXCLUDED_NAMES = new Set\(\[([\s\S]*?)\]\)/.exec(src);
  if (!bloco) throw new Error(`não achei EXCLUDED_NAMES em ${p} — o parser do script precisa ser revisto`);
  const nomes = [...bloco[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (!nomes.length) throw new Error(`EXCLUDED_NAMES veio vazio de ${p}`);
  return new Set(nomes.map(norm));
}

const NON_NAME_PREFIXES = ['relatorio', 'periodo', 'empregador', 'cpf', 'competencia',
  'saldo', 'dias', 'total', 'validade', 'horas praticadas', 'hora excedente'];

const norm = (s) => String(s ?? '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const parseHM = (s) => {
  const m = /^(-)?(\d+):(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  const v = Number(m[2]) * 60 + Number(m[3]);
  return m[1] ? -v : v;
};
// Mesmo estilo do arquivo antigo: horas com 2 dígitos no mínimo ("-08:34", "101:42")
const fmtHM = (min) => (min < 0 ? '-' : '') +
  String(Math.floor(Math.abs(min) / 60)).padStart(2, '0') + ':' +
  String(Math.abs(min) % 60).padStart(2, '0');

/** Lê o export novo → [{ nome, saldo }] */
function lerFolhaPonto(arquivo) {
  const wb = XLSX.readFile(arquivo);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });
  const cell = (r, c) => String((rows[r] || [])[c] ?? '').trim();
  const out = [];
  const semLinhaDeSaldo = [];
  let nome = null;
  for (let i = 0; i < rows.length; i++) {
    if (cell(i, 0) === 'DADOS DO COLABORADOR') {
      // Bloco anterior acabou sem a linha de saldo: registra em vez de sumir com ele
      if (nome) semLinhaDeSaldo.push(nome);
      nome = cell(i + 1, 3);
      if (!nome) throw new Error(`bloco na linha ${i} sem nome na coluna 3 da linha seguinte`);
      continue;
    }
    if (!nome) continue;
    if ((rows[i] || []).some((v) => String(v).trim().startsWith('Saldo Anterior de Banco de Horas'))) {
      out.push({ nome, saldo: cell(i + 1, 44) });
      nome = null;
    }
  }
  if (nome) semLinhaDeSaldo.push(nome);
  if (semLinhaDeSaldo.length) {
    throw new Error(
      `blocos sem a linha "Saldo Anterior de Banco de Horas" (formato inesperado): ${semLinhaDeSaldo.join(', ')}`
    );
  }

  const vistos = new Set(), duplicados = new Set();
  for (const c of out) {
    const k = norm(c.nome);
    if (vistos.has(k)) duplicados.add(c.nome);
    vistos.add(k);
  }
  if (duplicados.size) {
    throw new Error(`nomes repetidos no export (qual bloco vale?): ${[...duplicados].join(', ')}`);
  }
  return out;
}

/** Lê o arquivo do app → [{ nome, saldo, linhaTotal }] (mesma lógica de src/lib/excel.ts) */
function lerBancoHoras(rows) {
  const isNameRow = (row) => {
    const c0 = row[0];
    if (!c0 || typeof c0 !== 'string' || !c0.trim()) return false;
    if (row.filter((c) => c !== null && c !== undefined && c !== '').length !== 1) return false;
    return !NON_NAME_PREFIXES.some((p) => norm(c0).startsWith(p));
  };
  const out = [];
  let nome = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isNameRow(row)) { nome = String(row[0]).trim(); continue; }
    if (nome && typeof row[0] === 'string' && norm(row[0]).startsWith('total praticado hora excedente')) {
      out.push({ nome, saldo: String(row[12] ?? '').trim(), rotulo: String(row[6] ?? '').trim(), linhaTotal: i });
      nome = null;
    }
  }
  return out;
}

/** Mapa colaborador → gestor, a partir do Saldos_por_Gestor_Ajustado.xlsx */
function lerGestores() {
  const p = path.join(__dirname, '..', 'public', 'Saldos_por_Gestor_Ajustado.xlsx');
  const wb = XLSX.readFile(p);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const map = {};
  for (const r of rows.slice(1)) {
    const g = String(r[0] ?? '').trim(), c = String(r[1] ?? '').trim();
    if (g && c) map[norm(c)] = g;
  }
  return map;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  // A flag pode vir antes ou depois do arquivo
  const arquivoRfp = args.find((a) => !a.startsWith('--'));
  if (!arquivoRfp) {
    console.error('uso: node scripts/aplicar-folha-ponto.cjs <arquivo-rfp.xls> [--dry-run]');
    process.exit(1);
  }
  if (!fs.existsSync(arquivoRfp)) {
    console.error(`arquivo não encontrado: ${arquivoRfp}`);
    process.exit(1);
  }

  // Datas por gestor casadas por nome normalizado, para um acento ou caixa
  // diferente no mapa de gestores não jogar a equipe silenciosamente no padrão
  const dataPorGestor = new Map(Object.entries(DATA_POR_GESTOR).map(([g, d]) => [norm(g), d]));
  const gestoresUsados = new Set();

  const excluidos = lerExcluidos();
  const gestores = lerGestores();
  const novos = lerFolhaPonto(arquivoRfp);
  console.log(`Export: ${novos.length} colaboradores em ${path.basename(arquivoRfp)}`);

  const wb = XLSX.readFile(ARQUIVO_APP);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  if (!String(rows[0]?.[0] ?? '').includes('Banco de Horas')) {
    throw new Error('rows[0][0] não contém "Banco de Horas" — arquivo do app inesperado');
  }
  const antes = lerBancoHoras(rows);
  console.log(`App:    ${antes.length} colaboradores em public/RelatorioBancoHoras.xls`);

  const porNome = new Map(antes.map((c) => [norm(c.nome), c]));
  const aplicados = [], pulados = [], semSaldo = [], naoEncontrados = [];

  for (const n of novos) {
    const chave = norm(n.nome);
    if (excluidos.has(chave)) { pulados.push(n.nome); continue; }
    const alvo = porNome.get(chave);
    if (!alvo) { naoEncontrados.push(n.nome); continue; }
    const min = parseHM(n.saldo);
    if (min === null) { semSaldo.push(n.nome); continue; }
    const gestor = gestores[chave] || 'Sem Gestor';
    // O próprio gestor de uma das equipes com data diferente segue a data dela
    const chaveData = dataPorGestor.has(norm(gestor)) ? norm(gestor)
      : dataPorGestor.has(chave) ? chave : null;
    if (chaveData) gestoresUsados.add(chaveData);
    const data = chaveData ? dataPorGestor.get(chaveData) : DATA_PADRAO;
    aplicados.push({ nome: n.nome, de: alvo.saldo, para: fmtHM(min), linha: alvo.linhaTotal, data, gestor });
  }

  if (naoEncontrados.length) {
    console.error('\nERRO: nomes do export que não existem no arquivo do app (seriam cadastro novo, não atualização):');
    naoEncontrados.forEach((n) => console.error('  - ' + n));
    process.exit(1);
  }

  // Um gestor listado em DATA_POR_GESTOR que não pegou ninguém é quase sempre
  // nome digitado errado — a equipe iria pro DATA_PADRAO sem ninguém perceber
  const semUso = Object.keys(DATA_POR_GESTOR).filter((g) => !gestoresUsados.has(norm(g)));
  if (semUso.length) {
    console.error('\nERRO: gestor de DATA_POR_GESTOR não bateu com ninguém (nome errado?):');
    semUso.forEach((g) => console.error('  - ' + g));
    process.exit(1);
  }

  console.log(`\nA aplicar: ${aplicados.length}`);
  console.log(`Pulados (excluídos do painel): ${pulados.length}${pulados.length ? ' — ' + pulados.join(', ') : ''}`);
  console.log(`Sem saldo no export (ficam como estão): ${semSaldo.length}${semSaldo.length ? ' — ' + semSaldo.join(', ') : ''}`);
  const naoVieram = antes.filter((c) => !novos.some((n) => norm(n.nome) === norm(c.nome)));
  console.log(`Não vieram no export (ficam como estão): ${naoVieram.length}${naoVieram.length ? ' — ' + naoVieram.map((c) => c.nome).join(', ') : ''}`);

  if (dryRun) {
    console.log('\n--dry-run: nada gravado.');
    aplicados.forEach((a) => console.log(`  ${a.nome.padEnd(42)} ${a.de.padStart(9)} -> ${a.para.padStart(9)}  (até ${a.data})  [${a.gestor}]`));
    return;
  }

  // Backup antes de gravar
  const backup = ARQUIVO_APP + '.bak';
  fs.copyFileSync(ARQUIVO_APP, backup);
  console.log(`\nBackup: ${backup}`);

  for (const a of aplicados) {
    rows[a.linha][12] = a.para;
    rows[a.linha][6] = `Saldo Acumulado até ${a.data}:`;
  }

  const novaSheet = XLSX.utils.aoa_to_sheet(rows);
  const novoWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(novoWb, novaSheet, wb.SheetNames[0]);
  XLSX.writeFile(novoWb, ARQUIVO_APP, { bookType: 'biff8' });

  // Verificação: reabre e compara TODOS os saldos
  const wbV = XLSX.readFile(ARQUIVO_APP);
  const rowsV = XLSX.utils.sheet_to_json(wbV.Sheets[wbV.SheetNames[0]], { header: 1, defval: null });
  const erros = [];
  if (!String(rowsV[0]?.[0] ?? '').includes('Banco de Horas')) erros.push('rows[0][0] perdeu "Banco de Horas"');
  const depois = lerBancoHoras(rowsV);
  if (depois.length !== antes.length) erros.push(`contagem mudou: ${antes.length} -> ${depois.length}`);
  const esperado = new Map(aplicados.map((a) => [norm(a.nome), a]));
  const depoisMap = new Map(depois.map((c) => [norm(c.nome), c]));
  for (const c of antes) {
    const chave = norm(c.nome);
    const d = depoisMap.get(chave);
    if (!d) { erros.push(`sumiu: ${c.nome}`); continue; }
    const a = esperado.get(chave);
    const expSaldo = a ? a.para : c.saldo;
    const expRotulo = a ? `Saldo Acumulado até ${a.data}:` : c.rotulo;
    if (d.saldo !== expSaldo) erros.push(`${c.nome}: saldo esperado ${expSaldo}, gravado ${d.saldo}`);
    if (d.rotulo !== expRotulo) erros.push(`${c.nome}: rótulo esperado "${expRotulo}", gravado "${d.rotulo}"`);
  }

  if (erros.length) {
    fs.copyFileSync(backup, ARQUIVO_APP);
    console.error('\nVERIFICAÇÃO FALHOU — arquivo restaurado do backup:');
    erros.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }

  console.log(`\nOK: ${aplicados.length} saldos atualizados, ${antes.length - aplicados.length} preservados, ${depois.length} colaboradores no total.`);
  aplicados.forEach((a) => console.log(`  ${a.nome.padEnd(42)} ${a.de.padStart(9)} -> ${a.para.padStart(9)}  (até ${a.data})`));
}

main();
