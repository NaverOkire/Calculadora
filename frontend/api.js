const API_URL = '/api'
let currentUser = null

function saveUser(user) {
  currentUser = user
}

function getUser() {
  return currentUser
}

async function logout() {
  currentUser = null
  try {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (err) {
    // noop
  }
}

function hasSession() {
  return !!currentUser
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  const data = response.status === 204 ? {} : await response.json()

  if (response.status === 401) {
    currentUser = null
    throw new Error(data.error || 'Sessão expirada. Faça login novamente.')
  }

  if (!response.ok) {
    const msg = data.error || data.errors?.[0]?.msg || 'Erro desconhecido.'
    throw new Error(msg)
  }

  return data
}

async function register(name, email, password) {
  const data = await apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  saveUser(data.user)
  return data
}

async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  saveUser(data.user)
  return data
}

async function getSession() {
  const data = await apiFetch('/me')
  saveUser(data.user)
  return data.user
}

async function getTransactions(filters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)

  const query = params.toString() ? `?${params}` : ''
  return apiFetch(`/transactions${query}`)
}

async function getBills() {
  return apiFetch('/bills')
}

async function createBill(bill) {
  return apiFetch('/bills', {
    method: 'POST',
    body: JSON.stringify(bill),
  })
}

async function updateBill(id, changes) {
  return apiFetch(`/bills/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

async function deleteBill(id) {
  return apiFetch(`/bills/${id}`, { method: 'DELETE' })
}

async function createTransaction(tx) {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  })
}

async function updateTransaction(id, tx) {
  return apiFetch(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tx),
  })
}

async function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' })
}

window.FinanceAPI = {
  register,
  login,
  logout,
  hasSession,
  getSession,
  getUser,
  getBills,
  createBill,
  updateBill,
  deleteBill,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
}
