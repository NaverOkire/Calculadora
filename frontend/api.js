// frontend/api.js
// ─────────────────────────────────────────────────────────────
// Módulo utilitário para o frontend se comunicar com a API.
// Inclui: registro, login, gerenciamento de token e CRUD de transações.
// Cole este arquivo no seu projeto frontend e importe onde precisar.
// ─────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:3000/api'

// ─── Gerenciamento de token ───────────────────────────────────

function saveToken(token) {
  localStorage.setItem('fm_token', token)
}

function getToken() {
  return localStorage.getItem('fm_token')
}

function saveUser(user) {
  localStorage.setItem('fm_user', JSON.stringify(user))
}

function getUser() {
  const raw = localStorage.getItem('fm_user')
  return raw ? JSON.parse(raw) : null
}

function logout() {
  localStorage.removeItem('fm_token')
  localStorage.removeItem('fm_user')
  // Redirecione para a tela de login, ex:
  // window.location.href = '/login.html'
}

function isLoggedIn() {
  return !!getToken()
}

// ─── Helper interno: fetch com token ─────────────────────────
// Todas as requisições autenticadas passam por aqui.
async function apiFetch(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  // Se o token expirou ou é inválido, faz logout automático
  if (response.status === 401) {
    logout()
    throw new Error(data.error || 'Sessão expirada. Faça login novamente.')
  }

  if (!response.ok) {
    // Lança erro com a mensagem da API para facilitar o tratamento no frontend
    const msg = data.error || data.errors?.[0]?.msg || 'Erro desconhecido.'
    throw new Error(msg)
  }

  return data
}

// ─── Autenticação ──────────────────────────────────────────────

/**
 * Registra um novo usuário e salva o token automaticamente.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
async function register(name, email, password) {
  const data = await apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  saveToken(data.token)
  saveUser(data.user)
  return data
}

/**
 * Faz login e salva o token.
 * @param {string} email
 * @param {string} password
 */
async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  saveToken(data.token)
  saveUser(data.user)
  return data
}

// ─── Transações ────────────────────────────────────────────────

/**
 * Lista as transações do usuário logado.
 * @param {Object} filters - Filtros opcionais: { type, from, to }
 */
async function getTransactions(filters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.from) params.append('from', filters.from)
  if (filters.to)   params.append('to',   filters.to)

  const query = params.toString() ? `?${params}` : ''
  return apiFetch(`/transactions${query}`)
}

/**
 * Cria uma nova transação.
 * @param {Object} tx - { type, amount, description, date }
 */
async function createTransaction(tx) {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  })
}

/**
 * Atualiza uma transação existente.
 * @param {number} id
 * @param {Object} tx - { type, amount, description, date }
 */
async function updateTransaction(id, tx) {
  return apiFetch(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tx),
  })
}

/**
 * Remove uma transação.
 * @param {number} id
 */
async function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' })
}

// ─── Exporta tudo ─────────────────────────────────────────────
// Para usar com módulos ES (import/export), substitua por:
// export { register, login, logout, ... }

window.FinanceAPI = {
  register,
  login,
  logout,
  isLoggedIn,
  getUser,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
}