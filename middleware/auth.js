const jwt = require('jsonwebtoken')

const { parseCookies } = require('../utils/cookies')

const AUTH_COOKIE_NAME = 'fm_session'

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const cookies = parseCookies(req.headers.cookie)
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null
  const token = cookies[AUTH_COOKIE_NAME] || bearerToken

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' })
    }
    return res.status(401).json({ error: 'Token inválido.' })
  }
}
