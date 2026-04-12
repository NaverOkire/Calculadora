const calculator = document.querySelector('.calculator')
const display = document.querySelector('.calculator__display')
const keys = document.querySelector('.calculator__keys')
const historyButton = document.querySelector('.key--history')
const historyPanel = document.querySelector('.calculator__history')

// ─── Estado ───────────────────────────────────────────────────────────────────
let expression = ''
let previousKeyType = ''
let historyList = []

// ─── Tema ─────────────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle')
const root = document.documentElement

function applyTheme(dark) {
  root.setAttribute('data-theme', dark ? 'dark' : 'light')
  themeToggle.textContent = dark ? '☀' : '☾'
  localStorage.setItem('calc-theme', dark ? 'dark' : 'light')
}

themeToggle.addEventListener('click', () => {
  applyTheme(root.getAttribute('data-theme') !== 'dark')
})

// Inicializa tema: preferência salva > preferência do sistema
const savedTheme = localStorage.getItem('calc-theme')
if (savedTheme) {
  applyTheme(savedTheme === 'dark')
} else {
  applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
}

// ─── Display responsivo ───────────────────────────────────────────────────────
// Reduz o font-size conforme o conteúdo cresce, evitando overflow.
function ajustarDisplay(texto) {
  display.textContent = texto
  const len = texto.length
  display.style.fontSize =
    len > 20 ? '0.7em' :
    len > 14 ? '0.9em' :
    len > 10 ? '1.2em' : ''
}

// ─── Copiar resultado ─────────────────────────────────────────────────────────
display.addEventListener('click', () => {
  const val = display.textContent
  if (val && val !== '0' && !display.classList.contains('calculator__display--prompt')) {
    navigator.clipboard.writeText(val).catch(() => {})
    display.classList.add('copied')
    setTimeout(() => display.classList.remove('copied'), 600)
  }
})

// ─── Mapeamento de teclado ────────────────────────────────────────────────────
const keyboardMap = {
  '0': { action: null,       value: '0' },
  '1': { action: null,       value: '1' },
  '2': { action: null,       value: '2' },
  '3': { action: null,       value: '3' },
  '4': { action: null,       value: '4' },
  '5': { action: null,       value: '5' },
  '6': { action: null,       value: '6' },
  '7': { action: null,       value: '7' },
  '8': { action: null,       value: '8' },
  '9': { action: null,       value: '9' },
  '+': { action: 'add',      value: '+' },
  '-': { action: 'subtract', value: '-' },
  '*': { action: 'multiply', value: '*' },
  '/': { action: 'divide',   value: '/' },
  '.': { action: 'decimal',  value: '.' },
  ',': { action: 'decimal',  value: '.' },
  '(': { action: 'paren-open',  value: '(' },
  ')': { action: 'paren-close', value: ')' },
  '%': { action: 'percent', value: '%' },
  'Enter':     { action: 'calculate', value: null },
  '=':         { action: 'calculate', value: null },
  'Backspace': { action: 'backspace', value: null },
  'Delete':    { action: 'clear',     value: null },
  'Escape':    { action: 'clear',     value: null },
}

document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const m = keyboardMap[e.key]
  if (!m) return
  e.preventDefault()
  const { action, value } = m
  dispatch(action, value, null)
  previousKeyType = ['add','subtract','multiply','divide'].includes(action)
    ? 'operator' : (action || 'number')
})

// ─── Feedback visual ──────────────────────────────────────────────────────────
function animarBotao(action, value) {
  let botao = null
  if (action === null) {
    botao = [...document.querySelectorAll('.calculator__keys button')]
      .find(b => b.textContent.trim() === value && !b.dataset.action)
  } else {
    botao = document.querySelector('[data-action="' + action + '"]')
  }
  if (!botao) return
  botao.classList.add('is-depressed')
  setTimeout(() => botao.classList.remove('is-depressed'), 150)
}

// ─── Dispatcher central ───────────────────────────────────────────────────────
// Unifica teclado e clique para evitar duplicação de lógica.
function dispatch(action, value, keyEl) {
  if (action === null) {
    handleNumber(value); animarBotao(action, value)
  } else if (['add','subtract','multiply','divide'].includes(action)) {
    const botao = keyEl || document.querySelector('[data-action="' + action + '"]')
    handleOperator(action, value, botao); animarBotao(action, value)
  } else if (action === 'decimal') {
    handleDecimal(); animarBotao(action, value)
  } else if (action === 'clear') {
    handleClear(); animarBotao(action, value)
  } else if (action === 'calculate') {
    handleCalculate(); animarBotao(action, value)
  } else if (action === 'backspace') {
    handleBackspace(); animarBotao(action, value)
  } else if (action === 'paren-open') {
    handleParenOpen(); animarBotao(action, value)
  } else if (action === 'paren-close') {
    handleParenClose(); animarBotao(action, value)
  } else if (action === 'percent') {
    handlePercent(); animarBotao(action, value)
  } else {
    handlePassoFinanceiro(action)
  }
}

// ─── Abas ─────────────────────────────────────────────────────────────────────
const painelBasico     = document.getElementById('painel-basico')
const painelFinanceiro = document.getElementById('painel-financeiro')
const tabs             = document.querySelectorAll('.tab')

document.querySelector('.calculator__tabs').addEventListener('click', function(e) {
  if (!e.target.matches('.tab')) return
  tabs.forEach(t => t.classList.remove('tab--active'))
  e.target.classList.add('tab--active')
  if (e.target.dataset.action === 'tab-basico') {
    painelBasico.style.display     = 'grid'
    painelFinanceiro.style.display = 'none'
  } else {
    painelBasico.style.display     = 'none'
    painelFinanceiro.style.display = 'block'
  }
})

// ─── Histórico ────────────────────────────────────────────────────────────────
historyButton.addEventListener('click', function() {
  if (historyPanel.style.display === 'none') {
    historyPanel.style.display = 'block'
    historyButton.textContent = 'Fechar'
  } else {
    historyPanel.style.display = 'none'
    historyButton.textContent = 'Histórico'
  }
})

// ─── Listener de clique ───────────────────────────────────────────────────────
calculator.addEventListener('click', function(e) {
  if (!e.target.matches('button')) return
  const key = e.target
  const keyContent = key.textContent.trim()
  const action = key.dataset.action || key.dataset.section

  if (action === 'tab-basico' || action === 'tab-financeiro') return

  dispatch(action, keyContent, key)

  previousKeyType = ['add','subtract','multiply','divide'].includes(action)
    ? 'operator' : (action || 'number')
})

// ─── Swipe para limpar (mobile) ───────────────────────────────────────────────
let touchStartX = 0
display.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX }, { passive: true })
display.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 80) handleClear()
}, { passive: true })

// ─── Funções básicas ──────────────────────────────────────────────────────────

function handleNumber(num) {
  if (display.classList.contains('calculator__display--prompt')) {
    expression = num
    display.classList.remove('calculator__display--prompt')
    ajustarDisplay(expression)
    return
  }
  if (previousKeyType === 'calculate') { expression = num }
  else { expression += num }
  ajustarDisplay(formatarParaDisplay(expression))
}

function handleOperator(action, keyContent, key) {
  const simbolo = operatorParaSimbolo(action)
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
  if (key) key.classList.add('is-depressed')

  if (expression === '' && previousKeyType === 'calculate') {
    expression = display.textContent.replace(/\s×\s/g,'*').replace(/\s÷\s/g,'/').replace(/\s\+\s/g,'+').replace(/\s-\s/g,'-')
  }
  if (expression === '') return

  if (previousKeyType === 'operator') {
    expression = expression.slice(0, -1) + simbolo
  } else {
    expression += simbolo
  }
  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'operator'
}

function handleDecimal() {
  if (previousKeyType === 'operator' || previousKeyType === 'calculate' || expression === '') {
    expression += '0.'
    ajustarDisplay(formatarParaDisplay(expression))
    return
  }
  // Verifica se o último segmento numérico já tem ponto
  const partes = expression.split(/[\+\-\*\/\(\)]/)
  const ultima = partes[partes.length - 1]
  if (!ultima.includes('.')) {
    expression += '.'
    ajustarDisplay(formatarParaDisplay(expression))
  }
}

function handleParenOpen() {
  if (previousKeyType === 'calculate') expression = ''
  expression += '('
  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'paren-open'
}

function handleParenClose() {
  // Só fecha se há parêntese aberto sem par
  const opens  = (expression.match(/\(/g) || []).length
  const closes = (expression.match(/\)/g) || []).length
  if (opens > closes) {
    expression += ')'
    ajustarDisplay(formatarParaDisplay(expression))
    previousKeyType = 'paren-close'
  }
}

// ─── Porcentagem ──────────────────────────────────────────────────────────────
// Comportamento: 200 + 15% → 200 + (200 * 0.15) = 230
// Se não há operador pendente: divide por 100 (100% → 1, 50% → 0.5)
function handlePercent() {
  if (expression === '') return

  // Encontra o último operador na expressão
  const match = expression.match(/^(.*[\+\-\*\/])(\-?\d+\.?\d*)$/)

  if (match) {
    const base = match[1]           // ex: "200+"
    const num  = parseFloat(match[2]) // ex: 15

    // Extrai o valor base para calcular a porcentagem relativa
    const baseExpr = base.slice(0, -1) // remove o último operador
    let baseVal = 0
    try {
      baseVal = Function('"use strict"; return (' + baseExpr + ')')()
    } catch(e) {}

    const op = base.slice(-1) // o operador: + - * /
    let pctValue

    if (op === '+' || op === '-') {
      // 200 + 15% → 200 + 30 (15% de 200)
      pctValue = baseVal * (num / 100)
    } else {
      // 200 * 15% → 200 * 0.15
      pctValue = num / 100
    }

    expression = baseExpr + op + pctValue
  } else {
    // Sem operador: 50% → 0.5
    try {
      const val = Function('"use strict"; return (' + expression + ')')()
      expression = String(parseFloat((val / 100).toFixed(10)))
    } catch(e) { return }
  }

  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'percent'
}

function handleClear() {
  expression = ''
  previousKeyType = ''
  display.style.fontSize = ''
  ajustarDisplay('0')
  display.classList.remove('calculator__display--prompt')
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
}

function handleBackspace() {
  if (
    display.classList.contains('calculator__display--prompt') ||
    previousKeyType === 'calculate'
  ) return
  expression = expression.slice(0, -1)
  ajustarDisplay(expression !== '' ? formatarParaDisplay(expression) : '0')
}

// ─── Avaliador ────────────────────────────────────────────────────────────────
// Agora aceita também parênteses na whitelist.
function avaliarExpressao(expr) {
  if (!/^[\d\.\+\-\*\/\(\)]+$/.test(expr)) return 'Erro'
  try {
    const r = Function('"use strict"; return (' + expr + ')')()
    if (!isFinite(r)) return 'Erro: divisão por zero'
    return parseFloat(r.toFixed(10))
  } catch(e) { return 'Erro' }
}

function handleCalculate() {
  if (expression === '' || previousKeyType === 'operator') return
  const resultado = avaliarExpressao(expression)
  const textoDisplay = formatarParaDisplay(expression)
  addToHistory(textoDisplay + ' = ' + resultado, resultado)
  ajustarDisplay(String(resultado))
  expression = ''
  previousKeyType = 'calculate'
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatarParaDisplay(expr) {
  return expr
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/-/g,  ' - ')
    .trim()
}

function operatorParaSimbolo(action) {
  if (action === 'add')      return '+'
  if (action === 'subtract') return '-'
  if (action === 'multiply') return '*'
  if (action === 'divide')   return '/'
}

function addToHistory(expressao, result) {
  historyList.unshift({ expressao, result })
  const item = document.createElement('p')
  item.textContent = expressao
  item.addEventListener('click', function() {
    ajustarDisplay(String(result))
    expression = ''
    previousKeyType = 'calculate'
  })
  historyPanel.insertBefore(item, historyPanel.firstChild)
}

// ─── Modos financeiros ────────────────────────────────────────────────────────
const modos = {
  jc: {
    variaveis: { capital: '', taxaJuros: '', periodos: '' },
    passos: [
      { action: 'set-capital',  prompt: 'Taxa % →',   salvar: 'capital'   },
      { action: 'set-taxa',     prompt: 'Períodos →', salvar: 'taxaJuros' },
      { action: 'set-periodos', prompt: null,          salvar: 'periodos'  },
    ],
    calcular: () => calcularJurosCompostos()
  },
  pmt: {
    variaveis: { pmtPV: '', pmtTaxa: '', pmtPeriodos: '' },
    passos: [
      { action: 'set-pmt-pv',      prompt: 'Taxa por período % →', salvar: 'pmtPV'       },
      { action: 'set-pmt-taxa',     prompt: 'Nº de parcelas →',     salvar: 'pmtTaxa'     },
      { action: 'set-pmt-periodos', prompt: null,                   salvar: 'pmtPeriodos' },
    ],
    calcular: () => calcularPMT()
  },
  fv: {
    variaveis: { fvAporte: '', fvTaxa: '', fvPeriodos: '' },
    passos: [
      { action: 'set-fv-aporte',   prompt: 'Taxa por período % →', salvar: 'fvAporte'   },
      { action: 'set-fv-taxa',     prompt: 'Nº de períodos →',     salvar: 'fvTaxa'     },
      { action: 'set-fv-periodos', prompt: null,                    salvar: 'fvPeriodos' },
    ],
    calcular: () => calcularFV()
  },
  taxa: {
    variaveis: { taxaOrigem: '', periodoOrigem: '', periodoDestino: '' },
    passos: [
      { action: 'set-taxa-origem',   prompt: 'Período de origem →',  salvar: 'taxaOrigem'    },
      { action: 'set-periodo-origem', prompt: 'Período destino →',   salvar: 'periodoOrigem' },
      { action: 'set-periodo-dest',  prompt: null,                   salvar: 'periodoDestino'},
    ],
    calcular: () => calcularTaxaEquivalente()
  },
  amort: {
    variaveis: { amortPV: '', amortTaxa: '', amortN: '', amortSistema: 'price' },
    passos: [
      { action: 'set-amort-pv',   prompt: 'Taxa mensal % →',   salvar: 'amortPV'   },
      { action: 'set-amort-taxa', prompt: 'Nº de parcelas →',  salvar: 'amortTaxa' },
      { action: 'set-amort-n',    prompt: null,                 salvar: 'amortN'    },
    ],
    calcular: () => calcularAmortizacao()
  }
}

const actionMap = {}
for (const modo of Object.values(modos)) {
  for (const passo of modo.passos) {
    actionMap[passo.action] = { modo, passo }
  }
}

// Botões de sistema de amortização
document.querySelectorAll('.btn-amort-sistema').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-amort-sistema').forEach(b => b.classList.remove('selected'))
    btn.classList.add('selected')
    modos.amort.variaveis.amortSistema = btn.dataset.sistema
  })
})

function handlePassoFinanceiro(action) {
  const entrada = actionMap[action]
  if (!entrada) return false
  const { modo, passo } = entrada
  modo.variaveis[passo.salvar] = display.textContent.replace(/[^\d\.\-]/g, '')
  if (passo.prompt === null) {
    display.classList.remove('calculator__display--prompt')
    modo.calcular()
  } else {
    ajustarDisplay(passo.prompt)
    display.style.fontSize = ''
    display.classList.add('calculator__display--prompt')
  }
  return true
}

// ─── Funções financeiras ──────────────────────────────────────────────────────

function calcularJurosCompostos() {
  const v = modos.jc.variaveis
  const C = parseFloat(v.capital), i = parseFloat(v.taxaJuros) / 100, n = parseFloat(v.periodos)
  if ([C,i,n].some(isNaN)) { ajustarDisplay('Erro: dados incompletos'); return }
  if (C <= 0 || n <= 0)    { ajustarDisplay('Erro: valores inválidos'); return }
  const M = C * Math.pow(1 + i, n)
  const resultado = M.toFixed(2)
  addToHistory('JC: R$' + C + ' × (1+' + v.taxaJuros + '%)^' + n, resultado)
  display.classList.remove('calculator__display--prompt')
  ajustarDisplay('M = R$ ' + resultado)
  v.capital = v.taxaJuros = v.periodos = ''
}

function calcularPMT() {
  const v = modos.pmt.variaveis
  const PV = parseFloat(v.pmtPV), i = parseFloat(v.pmtTaxa) / 100, n = parseFloat(v.pmtPeriodos)
  if ([PV,i,n].some(isNaN) || PV <= 0 || i <= 0 || n <= 0) { ajustarDisplay('Erro: valores inválidos'); return }
  const fator = Math.pow(1 + i, n)
  const pmt = PV * (i * fator) / (fator - 1)
  const resultado = pmt.toFixed(2)
  addToHistory('PMT: R$' + PV + ' em ' + n + 'x a ' + v.pmtTaxa + '%', resultado)
  display.classList.remove('calculator__display--prompt')
  ajustarDisplay('Parcela: R$ ' + resultado)
  v.pmtPV = v.pmtTaxa = v.pmtPeriodos = ''
}

function calcularFV() {
  const v = modos.fv.variaveis
  const PMT = parseFloat(v.fvAporte), i = parseFloat(v.fvTaxa) / 100, n = parseFloat(v.fvPeriodos)
  if ([PMT,i,n].some(isNaN) || PMT <= 0 || i <= 0 || n <= 0) { ajustarDisplay('Erro: valores inválidos'); return }
  const fator = Math.pow(1 + i, n)
  const fv = PMT * (fator - 1) / i
  const resultado = fv.toFixed(2)
  addToHistory('FV: R$' + PMT + '/mês × ' + n + 'p a ' + v.fvTaxa + '%', resultado)
  display.classList.remove('calculator__display--prompt')
  ajustarDisplay('FV = R$ ' + resultado)
  v.fvAporte = v.fvTaxa = v.fvPeriodos = ''
}

// ─── Taxa equivalente ─────────────────────────────────────────────────────────
// Fórmula: i_destino = (1 + i_origem)^(n_destino/n_origem) - 1
// Exemplo: taxa mensal 1% → taxa anual: (1.01)^12 - 1 = 12.68%
function calcularTaxaEquivalente() {
  const v = modos.taxa.variaveis
  const taxa   = parseFloat(v.taxaOrigem) / 100
  const pOrig  = parseFloat(v.periodoOrigem)
  const pDest  = parseFloat(v.periodoDestino)
  if ([taxa,pOrig,pDest].some(isNaN) || taxa <= 0 || pOrig <= 0 || pDest <= 0) {
    ajustarDisplay('Erro: valores inválidos'); return
  }
  const taxaEquiv = Math.pow(1 + taxa, pDest / pOrig) - 1
  const resultado = (taxaEquiv * 100).toFixed(6)
  addToHistory('Taxa equiv.: ' + v.taxaOrigem + '% em ' + pOrig + 'p → ' + pDest + 'p', resultado + '%')
  display.classList.remove('calculator__display--prompt')
  ajustarDisplay(resultado + '%')
  v.taxaOrigem = v.periodoOrigem = v.periodoDestino = ''
}

// ─── Amortização (Price e SAC) ────────────────────────────────────────────────
function calcularAmortizacao() {
  const v = modos.amort.variaveis
  const PV     = parseFloat(v.amortPV)
  const i      = parseFloat(v.amortTaxa) / 100
  const n      = parseFloat(v.amortN)
  const sistema = v.amortSistema

  if ([PV,i,n].some(isNaN) || PV <= 0 || i <= 0 || n <= 0) { ajustarDisplay('Erro: valores inválidos'); return }

  // Gera tabela em memória e exibe resumo no display
  const tabela = []
  let saldo = PV

  if (sistema === 'price') {
    const fator = Math.pow(1 + i, n)
    const pmt = PV * (i * fator) / (fator - 1)
    for (let k = 1; k <= n; k++) {
      const juros = saldo * i
      const amort = pmt - juros
      saldo -= amort
      tabela.push({ k, pmt: pmt.toFixed(2), amort: amort.toFixed(2), juros: juros.toFixed(2), saldo: Math.max(0, saldo).toFixed(2) })
    }
    addToHistory('Price: R$' + PV + ' em ' + n + 'x a ' + v.amortTaxa + '%', 'Parcela: R$' + tabela[0].pmt)
    ajustarDisplay('Parcela: R$ ' + tabela[0].pmt)
  } else {
    const amortFixa = PV / n
    for (let k = 1; k <= n; k++) {
      const juros = saldo * i
      const pmt = amortFixa + juros
      saldo -= amortFixa
      tabela.push({ k, pmt: pmt.toFixed(2), amort: amortFixa.toFixed(2), juros: juros.toFixed(2), saldo: Math.max(0, saldo).toFixed(2) })
    }
    addToHistory('SAC: R$' + PV + ' em ' + n + 'x a ' + v.amortTaxa + '%', '1ª parcela: R$' + tabela[0].pmt)
    ajustarDisplay('1ª parc: R$ ' + tabela[0].pmt)
  }

  exibirTabelaAmortizacao(tabela, sistema)
  display.classList.remove('calculator__display--prompt')
  v.amortPV = v.amortTaxa = v.amortN = ''
}

function exibirTabelaAmortizacao(tabela, sistema) {
  const modal = document.getElementById('amort-modal')
  const tbody = document.getElementById('amort-tbody')
  const titulo = document.getElementById('amort-titulo')
  titulo.textContent = 'Tabela ' + (sistema === 'price' ? 'Price' : 'SAC')
  tbody.innerHTML = tabela.map(r =>
    '<tr><td>' + r.k + '</td><td>R$ ' + r.pmt + '</td><td>R$ ' + r.amort + '</td><td>R$ ' + r.juros + '</td><td>R$ ' + r.saldo + '</td></tr>'
  ).join('')
  modal.style.display = 'flex'
}

document.getElementById('amort-fechar').addEventListener('click', () => {
  document.getElementById('amort-modal').style.display = 'none'
})