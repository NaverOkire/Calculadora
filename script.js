const calculator = document.querySelector('.calculator')
const display = document.querySelector('.calculator__display')
const keys = document.querySelector('.calculator__keys')
const historyButton = document.querySelector('.key--history')
const historyPanel = document.querySelector('.calculator__history')

// ─── Variáveis básicas ────────────────────────────────────────────────────────
let firstValue = ''
let operator = ''
let secondValue = ''
let previousKeyType = ''
let historyList = []

// ─── Configuração dos modos financeiros ──────────────────────────────────────
const modos = {
  jc: {
    variaveis: { capital: '', taxaJuros: '', periodos: '' },
    passos: [
      { action: 'set-capital',  prompt: 'Taxa % →',   salvar: 'capital'   },
      { action: 'set-taxa',     prompt: 'Períodos →', salvar: 'taxaJuros' },
      { action: 'set-periodos', prompt: null,          salvar: 'periodos'  },
    ],
    calcular: function() { calcularJurosCompostos() }
  },

  pmt: {
    variaveis: { pmtPV: '', pmtTaxa: '', pmtPeriodos: '' },
    passos: [
      { action: 'set-pmt-pv',       prompt: 'Taxa por período % →', salvar: 'pmtPV'       },
      { action: 'set-pmt-taxa',      prompt: 'Nº de parcelas →',     salvar: 'pmtTaxa'     },
      { action: 'set-pmt-periodos',  prompt: null,                   salvar: 'pmtPeriodos' },
    ],
    calcular: function() { calcularPMT() }
  },

  fv: {
    variaveis: { fvAporte: '', fvTaxa: '', fvPeriodos: '' },
    passos: [
      { action: 'set-fv-aporte',   prompt: 'Taxa por período % →', salvar: 'fvAporte'  },
      { action: 'set-fv-taxa',     prompt: 'Nº de períodos →',     salvar: 'fvTaxa'    },
      { action: 'set-fv-periodos', prompt: null,                    salvar: 'fvPeriodos'},
    ],
    calcular: function() { calcularFV() }
  }
}

// ─── Índice de actions financeiras ───────────────────────────────────────────
const actionMap = {}

for (const modo of Object.values(modos)) {
  for (const passo of modo.passos) {
    actionMap[passo.action] = { modo, passo }
  }
}

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

// ─── Abas ─────────────────────────────────────────────────────────────────────
const painelBasico     = document.getElementById('painel-basico')
const painelFinanceiro = document.getElementById('painel-financeiro')
const tabs             = document.querySelectorAll('.tab')

document.querySelector('.calculator__tabs').addEventListener('click', function(e) {
  if (!e.target.matches('.tab')) return

  tabs.forEach(t => t.classList.remove('tab--active'))
  e.target.classList.add('tab--active')

  const aba = e.target.dataset.action

  if (aba === 'tab-basico') {
    painelBasico.style.display     = 'grid'
    painelFinanceiro.style.display = 'none'
  } else {
    painelBasico.style.display     = 'none'
    painelFinanceiro.style.display = 'block'
  }
})

// ─── Listener principal — agora em .calculator ───────────────────────────────
calculator.addEventListener('click', function(e) {
  if (!e.target.matches('button')) return

  const key = e.target
  const keyContent = key.textContent
  const action = key.dataset.action || key.dataset.section

  if (!action) {
    handleNumber(keyContent)
  } else if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
    handleOperator(action, keyContent, key)
  } else if (action === 'decimal') {
    handleDecimal()
  } else if (action === 'clear') {
    handleClear()
  } else if (action === 'calculate') {
    handleCalculate()
  } else if (action === 'tab-basico' || action === 'tab-financeiro') {
    return  // abas têm listener próprio, ignora aqui
  } else {
    handlePassoFinanceiro(action)
  }

  if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
    previousKeyType = 'operator'
  } else {
    previousKeyType = action || 'number'
  }
})

// ─── Funções básicas ──────────────────────────────────────────────────────────
function handleNumber(num) {
  // Se o display está mostrando um prompt, o próximo número
  // começa do zero — substitui em vez de concatenar
  if (
    display.textContent === '0' ||
    previousKeyType === 'calculate' ||
    display.classList.contains('calculator__display--prompt')  // ← linha nova
  ) {
    display.textContent = num
    display.classList.remove('calculator__display--prompt')    // ← limpa o prompt
  } else if (previousKeyType === 'operator') {
    display.textContent = display.textContent + ' ' + num
  } else {
    display.textContent += num
  }
}

function handleOperator(action, keyContent, key) {
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
  key.classList.add('is-depressed')

  if (firstValue && operator && previousKeyType !== 'operator') {
    secondValue = display.textContent
    const result = calculate(firstValue, operator, secondValue)
    display.textContent = result
    firstValue = String(result)
  } else {
    firstValue = display.textContent
  }

  operator = action
  display.textContent = firstValue + ' ' + keyContent
}

function handleDecimal() {
  if (previousKeyType === 'operator' || previousKeyType === 'calculate') {
    display.textContent = '0.'
    return
  }
  if (!display.textContent.includes('.')) {
    display.textContent += '.'
  }
}

function handleClear() {
  display.textContent = '0'
  firstValue = ''
  operator = ''
  secondValue = ''
  previousKeyType = ''
  display.classList.remove('calculator__display--prompt')
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
}

function handleCalculate() {
  if (firstValue && operator) {
    secondValue = display.textContent.split(' ').pop()
    const result = calculate(firstValue, operator, secondValue)
    const expression = display.textContent + ' = ' + result
    addToHistory(expression, result)
    display.textContent = result
    firstValue = ''
    operator = ''
    keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
  }
}

function calculate(first, op, second) {
  const a = parseFloat(first)
  const b = parseFloat(second)
  if (op === 'add')      return a + b
  if (op === 'subtract') return a - b
  if (op === 'multiply') return a * b
  if (op === 'divide')   return b !== 0 ? a / b : 'Erro'
}

function addToHistory(expression, result) {
  historyList.unshift({ expression, result })
  const item = document.createElement('p')
  item.textContent = expression
  item.addEventListener('click', function() {
    display.textContent = String(result)
    firstValue = ''
    operator = ''
    previousKeyType = 'calculate'
  })
  historyPanel.insertBefore(item, historyPanel.firstChild)
}

// ─── Função genérica de passos financeiros ────────────────────────────────────
function handlePassoFinanceiro(action) {
  const entrada = actionMap[action]
  if (!entrada) return false

  const { modo, passo } = entrada
  modo.variaveis[passo.salvar] = display.textContent

  if (passo.prompt === null) {
    display.classList.remove('calculator__display--prompt')
    modo.calcular()
  } else {
    display.textContent = passo.prompt
    display.classList.add('calculator__display--prompt')
  }

  return true
}

// ─── Funções financeiras ──────────────────────────────────────────────────────
function calcularJurosCompostos() {
  const vars = modos.jc.variaveis
  const C = parseFloat(vars.capital)
  const i = parseFloat(vars.taxaJuros) / 100
  const n = parseFloat(vars.periodos)

  if (isNaN(C) || isNaN(i) || isNaN(n)) {
    display.textContent = 'Erro: preencha todos os valores'
    return
  }
  if (i < 0 || n <= 0 || C <= 0) {
    display.textContent = 'Erro: valores inválidos'
    return
  }

  const montante    = C * Math.pow(1 + i, n)
  const jurosGanhos = montante - C
  const resultado   = montante.toFixed(2)

  const expressao = `JC: R$${C} × (1 + ${vars.taxaJuros}%)^${n}`
  addToHistory(expressao, resultado)
  display.classList.remove('calculator__display--prompt')
  display.textContent = `M = R$ ${resultado}`
  console.log(`Capital: R$${C} | Juros: R$${jurosGanhos.toFixed(2)} | Montante: R$${resultado}`)

  vars.capital   = ''
  vars.taxaJuros = ''
  vars.periodos  = ''
}

function calcularPMT() {
  const vars = modos.pmt.variaveis
  const PV = parseFloat(vars.pmtPV)
  const i  = parseFloat(vars.pmtTaxa) / 100
  const n  = parseFloat(vars.pmtPeriodos)

  if (isNaN(PV) || isNaN(i) || isNaN(n)) {
    display.textContent = 'Erro: preencha todos os valores'
    return
  }
  if (PV <= 0 || i <= 0 || n <= 0) {
    display.textContent = 'Erro: valores devem ser positivos'
    return
  }

  const fator      = Math.pow(1 + i, n)
  const pmt        = PV * (i * fator) / (fator - 1)
  const totalPago  = pmt * n
  const totalJuros = totalPago - PV
  const resultado  = pmt.toFixed(2)

  const expressao = `PMT: R$${PV} em ${n}x a ${vars.pmtTaxa}%`
  addToHistory(expressao, resultado)
  display.classList.remove('calculator__display--prompt')
  display.textContent = `Parcela: R$ ${resultado}`
  console.log(`Total pago: R$${totalPago.toFixed(2)} | Juros totais: R$${totalJuros.toFixed(2)}`)

  vars.pmtPV       = ''
  vars.pmtTaxa     = ''
  vars.pmtPeriodos = ''
}

function calcularFV() {
  const vars = modos.fv.variaveis
  const PMT = parseFloat(vars.fvAporte)
  const i   = parseFloat(vars.fvTaxa) / 100
  const n   = parseFloat(vars.fvPeriodos)

  if (isNaN(PMT) || isNaN(i) || isNaN(n)) {
    display.textContent = 'Erro: preencha todos os valores'
    return
  }
  if (PMT <= 0 || i <= 0 || n <= 0) {
    display.textContent = 'Erro: valores devem ser positivos'
    return
  }

  const fator          = Math.pow(1 + i, n)
  const fv             = PMT * (fator - 1) / i
  const totalInvestido = PMT * n
  const totalJuros     = fv - totalInvestido
  const resultado      = fv.toFixed(2)

  const expressao = `FV: R$${PMT}/mês × ${n} períodos a ${vars.fvTaxa}%`
  addToHistory(expressao, resultado)
  display.classList.remove('calculator__display--prompt')
  display.textContent = `FV = R$ ${resultado}`
  console.log(`Investido: R$${totalInvestido.toFixed(2)} | Juros: R$${totalJuros.toFixed(2)} | Total: R$${resultado}`)

  vars.fvAporte   = ''
  vars.fvTaxa     = ''
  vars.fvPeriodos = ''
}