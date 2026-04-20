// utils/cookies.js
// ─────────────────────────────────────────────────────────────
// Utilitário para parsear o header Cookie de forma segura.
// Não usa dependências externas — apenas string parsing manual.
// ─────────────────────────────────────────────────────────────

/**
 * Parseia o header Cookie em um objeto chave → valor.
 * Ex: "fm_session=abc123; outro=xyz" → { fm_session: 'abc123', outro: 'xyz' }
 *
 * @param {string|undefined} cookieHeader - Valor bruto de req.headers.cookie
 * @returns {Record<string, string>}
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {}

  return cookieHeader.split(';').reduce((acc, pair) => {
    const eqIndex = pair.indexOf('=')
    if (eqIndex < 1) return acc

    const key   = pair.slice(0, eqIndex).trim()
    const value = pair.slice(eqIndex + 1).trim()

    if (key) {
      try {
        acc[key] = decodeURIComponent(value)
      } catch {
        acc[key] = value
      }
    }

    return acc
  }, {})
}

module.exports = { parseCookies }