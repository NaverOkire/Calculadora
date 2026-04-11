// 1. Selecionando os elementos da página
const calculator = document.querySelector('.calculator')
const display = document.querySelector('.calculator__display')
const keys = document.querySelector('.calculator__keys')
const historyButton = document.querySelector('.key--history')       
const historyPanel = document.querySelector('.calculator__history') 

// 2. Variáveis de estado
let firstValue = ''
let operator = ''
let secondValue = ''
let previousKeyType = ''
let historyList = [] 

// 3. Alternando o painel de histórico // NOVO
historyButton.addEventListener('click', function() {
  if (historyPanel.style.display === 'none') {
    historyPanel.style.display = 'block'
    historyButton.textContent = 'Fechar'
  } else {
    historyPanel.style.display = 'none'
    historyButton.textContent = 'Histórico'
  }
})

// 4. Ouvindo cliques nos botões
keys.addEventListener('click', function(e) {
  if (!e.target.matches('button')) return

  const key = e.target
  const keyContent = key.textContent
  const action = key.dataset.action || key.dataset.section

  if (!action) {
    handleNumber(keyContent)
  } else if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
    handleOperator(action, keyContent)
  } else if (action === 'decimal') {
    handleDecimal()
  } else if (action === 'clear') {
    handleClear()
  } else if (action === 'calculate') {
    handleCalculate()
  }

  if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
    previousKeyType = 'operator'
  } else {
    previousKeyType = action || 'number'
  }
})

// 5. Funções
function handleNumber(num) {
  if (display.textContent === '0' || previousKeyType === 'calculate') {
    display.textContent = num
  } else if (previousKeyType === 'operator') {
    display.textContent = display.textContent + ' ' + num
  } else {
    display.textContent += num
  }
}

function handleOperator(action, keyContent) {
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
  event.target.classList.add('is-depressed')

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
  keys.querySelectorAll('.key--operator').forEach(k => k.classList.remove('is-depressed'))
}

function handleCalculate() {
  if (firstValue && operator) {
    secondValue = display.textContent.split(' ').pop()
    const result = calculate(firstValue, operator, secondValue)

    // NOVO — salva no histórico antes de mostrar o resultado
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
  if (op === 'add') return a + b
  if (op === 'subtract') return a - b
  if (op === 'multiply') return a * b
  if (op === 'divide') return b !== 0 ? a / b : 'Erro'
}

// NOVO — adiciona um item ao histórico
function addToHistory(expression, result) {
  historyList.unshift({ expression, result }) // unshift adiciona no início da lista

  const item = document.createElement('p')
  item.textContent = expression

  // Ao clicar num item do histórico, restaura o resultado no display
  item.addEventListener('click', function() {
    display.textContent = String(result)
    firstValue = ''
    operator = ''
    previousKeyType = 'calculate'
  })

  // Insere no topo do painel, não no final
  historyPanel.insertBefore(item, historyPanel.firstChild)
}