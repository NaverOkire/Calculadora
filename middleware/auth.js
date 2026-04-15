// middleware/auth.js
// ─────────────────────────────────────────────────────────────
// Middleware de autenticação JWT.
// Intercepta cada request às rotas protegidas,
// valida o token e injeta os dados do usuário em req.user.
// ─────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken')

module.exports = function authMiddleware(req, res, next) {
  // O token deve vir no header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify lança exceção se o token for inválido ou expirado
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Injeta o payload no request para os controllers usarem
    // Contém: { id, name, email, iat, exp }
    req.user = payload

    next() // passa para o próximo handler (controller)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' })
    }
    return res.status(401).json({ error: 'Token inválido.' })
  }
}