function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }

  return req.ip || req.socket?.remoteAddress || 'unknown'
}

module.exports = function createRateLimiter({ windowMs, max, message, keyGenerator }) {
  const hits = new Map()

  return function rateLimitMiddleware(req, res, next) {
    const key = keyGenerator ? keyGenerator(req) : `${req.path}:${getClientIp(req)}`
    const now = Date.now()
    const current = hits.get(key)

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    current.count += 1
    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: message })
    }

    return next()
  }
}
