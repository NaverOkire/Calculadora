// script.js
// ─────────────────────────────────────────────────────────────
// Calculadora com integração ao backend e Gerenciador de Contas:
// - Autenticação via FinanceAPI (api.js)
// - Histórico de cálculos salvo no MySQL
// ─────────────────────────────────────────────────────────────

// ─── Elementos ────────────────────────────────────────────────
const calculator   = document.querySelector('.calculator')
const display      = document.querySelector('.calculator__display')
const keys         = document.querySelector('.calculator__keys')
const historyButton = document.querySelector('.key--history')
const historyPanel  = document.querySelector('.calculator__history')

// ─── Estado ───────────────────────────────────────────────────
let expression      = ''
let previousKeyType = ''
let historyList     = []

// ═══════════════════════════════════════════════════════════════
// BILLS TO-DO — Gerenciador de Contas Completo
// ═══════════════════════════════════════════════════════════════

const BillsApp = (() => {

  let bills       = []
  let initialized = false
  let isSubmitting = false

  const form         = document.getElementById('billsForm')
  const listEl       = document.getElementById('billsList')
  const nameInput    = document.getElementById('billName')
  const amountInput  = document.getElementById('billAmount')
  const dueDateInput = document.getElementById('billDueDate')
  const feedbackEl   = document.getElementById('billsFeedback')
  const summaryPending = document.getElementById('summaryPending')
  const summaryPaid    = document.getElementById('summaryPaid')
  const submitButton   = form ? form.querySelector('.bills-btn--add') : null

  // ── Helpers internos ──────────────────────────────────────────

  function setFeedback(message = '', type = 'info') {
    if (!feedbackEl) return
    feedbackEl.textContent = message
    feedbackEl.classList.remove('is-error', 'is-success')
    if (type === 'error')   feedbackEl.classList.add('is-error')
    if (type === 'success') feedbackEl.classList.add('is-success')
  }

  function setFormEnabled(enabled) {
    ;[nameInput, amountInput, dueDateInput, submitButton].forEach(el => {
      if (el) el.disabled = !enabled
    })
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting
    if (!submitButton) return
    submitButton.disabled = submitting || !FinanceAPI.hasSession()
    submitButton.textContent = submitting ? 'Salvando...' : '+ Adicionar Conta'
  }

  function toAmount(value) {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : NaN
  }

  function safeAmount(value) {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }

  function getDueTimestamp(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Number.MAX_SAFE_INTEGER
    const t = new Date(`${dateStr}T00:00:00`).getTime()
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
  }

  function handleRequestError(error, fallbackMessage) {
    console.error(fallbackMessage, error)
    setFeedback(error?.message || fallbackMessage, 'error')
    if (!FinanceAPI.hasSession()) mostrarTelaAuth()
  }

  // ── API calls ─────────────────────────────────────────────────

  async function loadBills() {
    if (!FinanceAPI.hasSession()) {
      bills = []
      renderList()
      setFormEnabled(false)
      setFeedback('Faça login para gerenciar as contas.')
      return false
    }
    try {
      const data = await FinanceAPI.getBills()
      bills = Array.isArray(data.bills) ? data.bills : []
      renderList()
      setFeedback('')
      return true
    } catch (error) {
      handleRequestError(error, 'Não foi possível carregar as contas.')
      return false
    }
  }

  async function addBill(name, amount, dueDate) {
    if (!FinanceAPI.hasSession()) {
      setFeedback('Faça login para adicionar uma conta.', 'error')
      return false
    }
    try {
      setSubmitting(true)
      const data = await FinanceAPI.createBill({ name, amount, due_date: dueDate })
      bills.push(data.bill)
      renderList()
      setFeedback('Conta adicionada com sucesso.', 'success')
      return true
    } catch (error) {
      handleRequestError(error, 'Não foi possível adicionar a conta.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function togglePaid(id) {
    const bill = bills.find(b => b.id === id)
    if (!bill) return
    if (!FinanceAPI.hasSession()) {
      setFeedback('Faça login para atualizar uma conta.', 'error')
      return
    }
    try {
      const data = await FinanceAPI.updateBill(id, { is_paid: bill.is_paid ? 0 : 1 })
      const idx = bills.findIndex(b => b.id === id)
      if (idx >= 0) bills[idx] = data.bill
      renderList()
      setFeedback('Conta atualizada com sucesso.', 'success')
    } catch (error) {
      handleRequestError(error, 'Não foi possível atualizar a conta.')
    }
  }

  async function deleteBill(id) {
    if (!FinanceAPI.hasSession()) {
      setFeedback('Faça login para excluir uma conta.', 'error')
      return
    }
    try {
      await FinanceAPI.deleteBill(id)
      bills = bills.filter(b => b.id !== id)
      renderList()
      setFeedback('Conta removida com sucesso.', 'success')
    } catch (error) {
      handleRequestError(error, 'Não foi possível excluir a conta.')
    }
  }

  // ── Renderização ──────────────────────────────────────────────

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeAmount(value))
  }

  function formatDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Data inválida'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  function isOverdue(dateStr) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getDueTimestamp(dateStr) < today.getTime()
  }

  function renderList() {
    if (!listEl) return
    listEl.replaceChildren()
    const sorted = [...bills].sort((a, b) => {
      if (a.is_paid !== b.is_paid) return a.is_paid - b.is_paid
      return getDueTimestamp(a.due_date) - getDueTimestamp(b.due_date)
    })
    sorted.forEach(bill => {
      const li = document.createElement('li')
      li.className = 'bill-item'
      if (bill.is_paid) li.classList.add('is-paid')
      if (!bill.is_paid && isOverdue(bill.due_date)) li.classList.add('is-overdue')

      const info = document.createElement('div')
      info.className = 'bill-info'

      const title = document.createElement('div')
      title.className = 'bill-name'
      title.textContent = typeof bill.name === 'string' ? bill.name : 'Conta sem nome'

      const meta = document.createElement('div')
      meta.className = 'bill-meta'
      meta.textContent = `Vence em ${formatDate(bill.due_date)}`

      if (!bill.is_paid && isOverdue(bill.due_date)) {
        meta.append(' · ')
        const overdueLabel = document.createElement('span')
        overdueLabel.className = 'bill-overdue'
        overdueLabel.textContent = 'Vencida'
        meta.appendChild(overdueLabel)
      }

      info.appendChild(title)
      info.appendChild(meta)

      const amount = document.createElement('span')
      amount.className = 'bill-amount'
      amount.textContent = formatCurrency(bill.amount)

      const toggleButton = document.createElement('button')
      toggleButton.type = 'button'
      toggleButton.className = 'bill-btn bill-btn--paid'
      toggleButton.title = bill.is_paid ? 'Marcar como pendente' : 'Marcar como paga'
      toggleButton.dataset.id = String(bill.id)
      toggleButton.dataset.action = 'toggle'
      toggleButton.textContent = bill.is_paid ? 'Desfazer' : 'Pagar'

      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.className = 'bill-btn bill-btn--delete'
      deleteButton.title = 'Excluir conta'
      deleteButton.dataset.id = String(bill.id)
      deleteButton.dataset.action = 'delete'
      deleteButton.textContent = 'Excluir'

      li.appendChild(info)
      li.appendChild(amount)
      li.appendChild(toggleButton)
      li.appendChild(deleteButton)

      listEl.appendChild(li)
    })
    updateSummary()
  }

  function updateSummary() {
    if (!summaryPending || !summaryPaid) return
    const pending = bills.filter(b => !b.is_paid).reduce((s, b) => s + safeAmount(b.amount), 0)
    const paid    = bills.filter(b =>  b.is_paid).reduce((s, b) => s + safeAmount(b.amount), 0)
    summaryPending.textContent = formatCurrency(pending)
    summaryPaid.textContent    = formatCurrency(paid)
  }

  function bindEvents() {
    if (!form || !listEl || initialized) return
    form.addEventListener('submit', async event => {
      event.preventDefault()
      if (isSubmitting) return
      const name    = nameInput.value.trim()
      const amount  = toAmount(amountInput.value)
      const dueDate = dueDateInput.value

      if (!FinanceAPI.hasSession()) {
        setFeedback('Faça login para adicionar uma conta.', 'error')
        return
      }
      if (!name) { setFeedback('Informe o nome da conta.', 'error'); nameInput.focus(); return }
      if (!Number.isFinite(amount) || amount <= 0) { setFeedback('Informe um valor maior que zero.', 'error'); amountInput.focus(); return }
      if (!dueDate) { setFeedback('Informe a data de vencimento.', 'error'); dueDateInput.focus(); return }

      const created = await addBill(name, amount, dueDate)
      if (created) { form.reset(); nameInput.focus() }
    })

    listEl.addEventListener('click', event => {
      const btn = event.target.closest('[data-action]')
      if (!btn) return
      const id = Number.parseInt(btn.dataset.id, 10)
      if (Number.isNaN(id)) return
      if (btn.dataset.action === 'toggle') togglePaid(id)
      if (btn.dataset.action === 'delete') deleteBill(id)
    })
  }

  function init() {
    if (initialized) return
    bindEvents()
    initialized = true
    setFormEnabled(FinanceAPI.hasSession())
    renderList()
    if (!FinanceAPI.hasSession()) setFeedback('Faça login para gerenciar as contas.')
  }

  async function handleSessionStart() {
    if (!initialized) init()
    setFormEnabled(true)
    setFeedback('')
    await loadBills()
  }

  function handleSessionEnd() {
    if (!initialized) return
    bills = []; renderList(); setSubmitting(false); setFormEnabled(false)
    setFeedback('Faça login para gerenciar as contas.')
    if (form) form.reset()
  }

  return { init, handleSessionStart, handleSessionEnd }
})()

// ═══════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════════

const telaAuth = document.getElementById('tela-auth')
const telaApp  = document.getElementById('tela-app')

inicializarSessao()

async function inicializarSessao() {
  try {
    await FinanceAPI.getSession()
    mostrarApp()
  } catch (err) {
    await FinanceAPI.logout()
    mostrarTelaAuth()
  }
}

function mostrarTelaAuth() {
  telaAuth.style.display = 'flex'
  telaApp.style.display  = 'none'
  BillsApp.handleSessionEnd()
}

function mostrarApp() {
  telaAuth.style.display = 'none'
  telaApp.style.display  = 'block'
  const user = FinanceAPI.getUser()
  if (user) document.getElementById('topbar-usuario').textContent = user.name.split(' ')[0]
  carregarHistoricoBanco()
  BillsApp.handleSessionStart()
}

// ─── Abas auth ────────────────────────────────────────────────
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('auth-tab--active'))
    tab.classList.add('auth-tab--active')
    const qual = tab.dataset.tab
    document.getElementById('form-login').style.display    = qual === 'login'    ? 'block' : 'none'
    document.getElementById('form-registro').style.display = qual === 'registro' ? 'block' : 'none'
    document.getElementById('login-erro').textContent = ''
    document.getElementById('reg-erro').textContent   = ''
  })
})

// ─── Login/Registro/Logout ────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', async () => {
  const btn = document.getElementById('btn-login'), erro = document.getElementById('login-erro')
  const email = document.getElementById('login-email').value.trim(), senha = document.getElementById('login-senha').value
  erro.textContent = ''; if (!email || !senha) { erro.textContent = 'Preencha e-mail e senha.'; return }
  btn.disabled = true; btn.textContent = 'Entrando...'
  try { await FinanceAPI.login(email, senha); mostrarApp() } catch (err) { erro.textContent = err.message }
  finally { btn.disabled = false; btn.textContent = 'Entrar' }
})

document.getElementById('btn-registro').addEventListener('click', async () => {
  const btn = document.getElementById('btn-registro'), erro = document.getElementById('reg-erro')
  const nome = document.getElementById('reg-nome').value.trim(), email = document.getElementById('reg-email').value.trim(), senha = document.getElementById('reg-senha').value
  erro.textContent = ''; if (!nome || !email || !senha) { erro.textContent = 'Preencha todos os campos.'; return }
  if (senha.length < 10) { erro.textContent = 'Senha deve ter ao menos 10 caracteres.'; return }
  btn.disabled = true; btn.textContent = 'Criando conta...'
  try { await FinanceAPI.register(nome, email, senha); mostrarApp() } catch (err) { erro.textContent = err.message }
  finally { btn.disabled = false; btn.textContent = 'Criar conta' }
})

document.getElementById('btn-logout').addEventListener('click', async () => {
  await FinanceAPI.logout(); historyPanel.innerHTML = ''; historyList = []; handleClear(); mostrarTelaAuth()
})

// ═══════════════════════════════════════════════════════════════
// HISTÓRICO NO BANCO
// ═══════════════════════════════════════════════════════════════

async function carregarHistoricoBanco() {
  if (!FinanceAPI.hasSession()) return
  try {
    const { transactions } = await FinanceAPI.getTransactions()
    historyPanel.innerHTML = ''; historyList = []
    transactions.forEach(tx => {
      const label = `${tx.description || tx.type} = R$ ${parseFloat(tx.amount).toFixed(2)}`
      adicionarItemHistorico(label, tx.amount)
    })
  } catch (err) { console.warn('Não foi possível carregar histórico:', err.message) }
}

async function salvarNoBanco(descricao, valor) {
  if (!FinanceAPI.hasSession()) return
  try {
    const amount = parseFloat(String(valor).replace(/[^\d\.\-]/g, ''))
    if (isNaN(amount) || amount <= 0) return
    await FinanceAPI.createTransaction({ type: 'income', amount, description: descricao.slice(0, 255), date: new Date().toISOString().split('T')[0] })
  } catch (err) { console.warn('Não foi possível salvar no banco:', err.message) }
}

// ─── Tema ─────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle')
const root = document.documentElement
function applyTheme(dark) {
  root.setAttribute('data-theme', dark ? 'dark' : 'light')
  themeToggle.textContent = dark ? '☀' : '☾'
  localStorage.setItem('calc-theme', dark ? 'dark' : 'light')
}
themeToggle.addEventListener('click', () => applyTheme(root.getAttribute('data-theme') !== 'dark'))
const savedTheme = localStorage.getItem('calc-theme')
if (savedTheme) applyTheme(savedTheme === 'dark')
else applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)

// ─── Display responsivo e Cópia ───────────────────────────────
function ajustarDisplay(texto) {
  display.textContent = texto
  const len = texto.length
  display.style.fontSize = len > 20 ? '0.7em' : len > 14 ? '0.9em' : len > 10 ? '1.2em' : ''
}
display.addEventListener('click', () => {
  const val = display.textContent
  if (val && val !== '0') {
    navigator.clipboard.writeText(val).catch(() => {})
    display.classList.add('copied')
    setTimeout(() => display.classList.remove('copied'), 600)
  }
})

// ═══════════════════════════════════════════════════════════════
// DISPATCHER CENTRAL E EVENTOS (A CORREÇÃO ESTÁ AQUI)
// ═══════════════════════════════════════════════════════════════

const keyboardMap = {
  '0': { action: null, value: '0' }, '1': { action: null, value: '1' },
  '2': { action: null, value: '2' }, '3': { action: null, value: '3' },
  '4': { action: null, value: '4' }, '5': { action: null, value: '5' },
  '6': { action: null, value: '6' }, '7': { action: null, value: '7' },
  '8': { action: null, value: '8' }, '9': { action: null, value: '9' },
  '+': { action: 'add', value: '+' }, '-': { action: 'subtract', value: '-' },
  '*': { action: 'multiply', value: '*' }, '/': { action: 'divide', value: '/' },
  '.': { action: 'decimal', value: '.' }, ',': { action: 'decimal', value: '.' },
  '(': { action: 'paren-open', value: '(' }, ')': { action: 'paren-close', value: ')' },
  '%': { action: 'percent', value: '%' },
  'Enter': { action: 'calculate', value: null }, '=': { action: 'calculate', value: null },
  'Backspace': { action: 'backspace', value: null },
  'Delete': { action: 'clear', value: null }, 'Escape': { action: 'clear', value: null },
}

function dispatch(action, value, keyEl) {
  const acaoNormalizada = action || null
  const botaoAlvo = keyEl || encontrarBotaoNaGrade(acaoNormalizada, value)

  if (botaoAlvo) {
    if (['add','subtract','multiply','divide'].includes(acaoNormalizada)) {
      keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
      botaoAlvo.classList.add('is-depressed')
    } else {
      botaoAlvo.classList.add('is-depressed')
      setTimeout(() => botaoAlvo.classList.remove('is-depressed'), 150)
    }
  }

  if (acaoNormalizada === null) {
    handleNumber(value)
  } else if (['add','subtract','multiply','divide'].includes(acaoNormalizada)) {
    handleOperator(acaoNormalizada, value, botaoAlvo)
  } else {
    switch (acaoNormalizada) {
      case 'decimal':    handleDecimal();    break
      case 'clear':      handleClear();      break
      case 'calculate':  handleCalculate();  break
      case 'backspace':  handleBackspace();  break
      case 'paren-open': handleParenOpen();  break
      case 'paren-close':handleParenClose(); break
      case 'percent':    handlePercent();    break
    }
  }
}

function encontrarBotaoNaGrade(action, value) {
  if (action === null) {
    return [...keys.querySelectorAll('button')].find(b => b.textContent.trim() === value && !b.dataset.action)
  }
  return keys.querySelector(`[data-action="${action}"]`)
}

// ÚNICO Listener de clique da calculadora (Resolvido)
calculator.addEventListener('click', function(e) {
  const key = e.target.closest('button')
  if (!key || key.closest('.panel--bills') || key.id === 'theme-toggle' || key.id === 'btn-logout') return
  if (key.classList.contains('key--history')) return

  const keyContent = key.textContent.trim()
  const action     = key.dataset.action || null 
  
  dispatch(action, keyContent, key)
})

document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const m = keyboardMap[e.key]
  if (!m) return
  e.preventDefault()
  dispatch(m.action, m.value, null)
})

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES BÁSICAS E LÓGICA DE CÁLCULO (Motor Original)
// ═══════════════════════════════════════════════════════════════

function handleNumber(num) {
  if (display.classList.contains('calculator__display--prompt')) {
    expression = num; display.classList.remove('calculator__display--prompt')
    ajustarDisplay(expression); return
  }
  if (previousKeyType === 'calculate') { expression = num }
  else { expression += num }
  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'number'
}

function handleOperator(action, keyContent, key) {
  const simbolo = operatorParaSimbolo(action)
  if (expression === '' && previousKeyType === 'calculate') {
    expression = display.textContent.replace(/\s×\s/g,'*').replace(/\s÷\s/g,'/').replace(/\s\+\s/g,'+').replace(/\s-\s/g,'-')
  }
  if (expression === '') return
  if (previousKeyType === 'operator') { expression = expression.slice(0, -1) + simbolo }
  else { expression += simbolo }
  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'operator'
}

function handleDecimal() {
  if (previousKeyType === 'operator' || previousKeyType === 'calculate' || expression === '') {
    expression += '0.'; ajustarDisplay(formatarParaDisplay(expression)); return
  }
  const partes = expression.split(/[\+\-\*\/\(\)]/), ultima = partes[partes.length - 1]
  if (!ultima.includes('.')) { expression += '.'; ajustarDisplay(formatarParaDisplay(expression)) }
}

function handleParenOpen() { if (previousKeyType === 'calculate') expression = ''; expression += '('; ajustarDisplay(formatarParaDisplay(expression)); previousKeyType = 'paren-open' }

function handleParenClose() {
  const opens = (expression.match(/\(/g) || []).length, closes = (expression.match(/\)/g) || []).length
  if (opens > closes) { expression += ')'; ajustarDisplay(formatarParaDisplay(expression)); previousKeyType = 'paren-close' }
}

function handlePercent() {
  if (expression === '') return
  const match = expression.match(/^(.*[\+\-\*\/])(\-?\d+\.?\d*)$/)
  if (match) {
    const base = match[1], num = parseFloat(match[2]), baseExpr = base.slice(0, -1)
    let baseVal = 0; try { baseVal = avaliarExpressaoNumerica(baseExpr) } catch(e) {}
    const op = base.slice(-1)
    const pctValue = (op === '+' || op === '-') ? baseVal * (num / 100) : num / 100
    expression = baseExpr + op + pctValue
  } else {
    try { const val = avaliarExpressaoNumerica(expression); expression = String(parseFloat((val / 100).toFixed(10))) } catch(e) { return }
  }
  ajustarDisplay(formatarParaDisplay(expression))
  previousKeyType = 'percent'
}

function handleClear() { expression = ''; previousKeyType = ''; display.style.fontSize = ''; ajustarDisplay('0'); keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed')) }

function handleBackspace() { if (previousKeyType === 'calculate') return; expression = expression.slice(0, -1); ajustarDisplay(expression !== '' ? formatarParaDisplay(expression) : '0') }

// ─── Motor Matemático Shunting-yard ─────────────────────────────

function avaliarExpressao(expr) {
  if (!/^[\d\.\+\-\*\/\(\)]+$/.test(expr)) return 'Erro'
  try {
    const r = avaliarExpressaoNumerica(expr)
    if (!isFinite(r)) return 'Erro: divisão por zero'
    return parseFloat(r.toFixed(10))
  } catch(e) { return 'Erro' }
}

function avaliarExpressaoNumerica(expr) {
  const sanitized = expr.replace(/\s+/g, '')
  const tokens = []
  let index = 0
  while (index < sanitized.length) {
    const char = sanitized[index]
    if (/\d|\./.test(char)) {
      let number = char; index += 1
      while (index < sanitized.length && /[\d.]/.test(sanitized[index])) { number += sanitized[index]; index += 1 }
      tokens.push(number); continue
    }
    if ('+-*/()'.includes(char)) {
      const previous = tokens[tokens.length - 1], unaryContext = !previous || ['+', '-', '*', '/', '('].includes(previous)
      if (char === '-' && unaryContext) tokens.push('u-')
      else if (char === '+' && unaryContext) tokens.push('u+')
      else tokens.push(char)
      index += 1; continue
    }
    throw new Error('Invalid character')
  }

  const output = [], operators = [], precedence = { 'u+': 3, 'u-': 3, '*': 2, '/': 2, '+': 1, '-': 1 }, rightAssociative = new Set(['u+', 'u-'])

  tokens.forEach(token => {
    if (!Number.isNaN(Number(token))) { output.push(token); return }
    if (token in precedence) {
      while (operators.length > 0) {
        const top = operators[operators.length - 1]
        if (top in precedence && (precedence[top] > precedence[token] || (precedence[top] === precedence[token] && !rightAssociative.has(token)))) { output.push(operators.pop()); continue }
        break
      }
      operators.push(token); return
    }
    if (token === '(') { operators.push(token); return }
    if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') output.push(operators.pop())
      operators.pop()
    }
  })
  while (operators.length > 0) output.push(operators.pop())

  const stack = []
  output.forEach(token => {
    if (!Number.isNaN(Number(token))) { stack.push(Number(token)); return }
    if (token === 'u+' || token === 'u-') {
      const value = stack.pop(); stack.push(token === 'u-' ? -value : value); return
    }
    const right = stack.pop(), left  = stack.pop()
    switch (token) {
      case '+': stack.push(left + right); break
      case '-': stack.push(left - right); break
      case '*': stack.push(left * right); break
      case '/': if (right === 0) throw new Error('Zero'); stack.push(left / right); break
    }
  })
  return stack[0]
}

function handleCalculate() {
  if (expression === '' || previousKeyType === 'operator') return
  const resultado = avaliarExpressao(expression), textoDisplay = formatarParaDisplay(expression), descricao = textoDisplay + ' = ' + resultado
  addToHistory(descricao, resultado); salvarNoBanco(descricao, resultado); ajustarDisplay(String(resultado))
  expression = String(resultado); previousKeyType = 'calculate'
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
}

// ─── Helpers Finais ─────────────────────────────────────────────

function formatarParaDisplay(expr) {
  return expr.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g,  ' - ').trim()
}

function operatorParaSimbolo(action) {
  return { add: '+', subtract: '-', multiply: '*', divide: '/' }[action]
}

function adicionarItemHistorico(expressao, result) {
  const item = document.createElement('p')
  item.textContent = expressao
  item.addEventListener('click', () => { expression = String(result); ajustarDisplay(expression); previousKeyType = 'calculate' })
  historyPanel.insertBefore(item, historyPanel.firstChild)
}

function addToHistory(expressao, result) {
  historyList.unshift({ expressao, result }); adicionarItemHistorico(expressao, result)
}

historyButton.addEventListener('click', () => {
  const isNone = historyPanel.style.display === 'none'
  historyPanel.style.display = isNone ? 'block' : 'none'
  historyButton.textContent = isNone ? 'Fechar' : 'Histórico'
})

document.addEventListener('DOMContentLoaded', () => BillsApp.init())