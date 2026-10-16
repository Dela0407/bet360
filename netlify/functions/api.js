import { createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { getDatabase } from '@netlify/database'

const scrypt = promisify(scryptCallback)
const sessionLifetimeSeconds = 60 * 60 * 24 * 7
const maxRequestBytes = 16 * 1024
const maxBalanceCents = Number.MAX_SAFE_INTEGER
const passwordPepper = process.env.BET360_PASSWORD_PEPPER || ''
const loginAttempts = new Map()
const demoGames = new Map([
  ['virtual-football', { home: 'Emerald FC', away: 'City United', odds: 1.9 }],
  ['virtual-basketball', { home: 'Green Hoops', away: 'Metro Stars', odds: 1.9 }],
  ['virtual-tennis', { home: 'A. Green', away: 'M. Court', odds: 1.9 }],
])
let database = null
const pool = {
  connect: () => db().pool.connect(),
  query: (...args) => db().pool.query(...args),
}

function db() {
  database ||= getDatabase()
  return database
}

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      ...headers,
    },
  })
}

function creditsFromCents(cents) {
  const amount = Number(cents)
  if (!Number.isSafeInteger(amount)) throw new Error('Stored account balance exceeds the supported range.')
  return Number((amount / 100).toFixed(2))
}

function centsFromCredits(value, { min = 0.01, max = 10000 } = {}) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < min || amount > max) return null
  const cents = Math.round(amount * 100)
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    balance: creditsFromCents(row.balance_cents),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function publicBet(row) {
  return {
    betId: row.id,
    matchId: row.match_id,
    league: row.league,
    home: row.home,
    away: row.away,
    outcome: row.outcome,
    odds: Number(row.odds),
    stake: creditsFromCents(row.stake_cents),
    potentialReturn: creditsFromCents(row.potential_return_cents),
    placedAt: new Date(row.placed_at).toISOString(),
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function getCookie(request, key) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name === key) return valueParts.join('=')
  }
  return null
}

function sessionCookie(token, secure, maxAge = sessionLifetimeSeconds) {
  return `bet360_session=${token}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Strict; Path=/; Max-Age=${maxAge}`
}

function requireSameOrigin(request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    throw new ApiError(403, 'Cross-origin requests are not allowed.')
  }
}

async function readJson(request) {
  const body = await request.arrayBuffer()
  if (body.byteLength > maxRequestBytes) throw new ApiError(413, 'Request body is too large.')
  if (!body.byteLength) return {}
  try {
    const result = JSON.parse(new TextDecoder().decode(body))
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Expected an object.')
    return result
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.')
  }
}

function checkLoginLimit(request) {
  const address = request.headers.get('x-nf-client-connection-ip') || 'unknown'
  const now = Date.now()
  const active = (loginAttempts.get(address) || []).filter((attempt) => now - attempt < 60_000)
  if (active.length >= 12) throw new ApiError(429, 'Too many login attempts. Please wait a minute and try again.')
  active.push(now)
  loginAttempts.set(address, active)
}

async function withTransaction(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function createSession(client, userId) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000)
  await client.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), userId, expiresAt],
  )
  return token
}

async function currentUser(request) {
  const token = getCookie(request, 'bet360_session')
  if (!token) return null
  const { rows } = await pool.query(`
    SELECT users.id, users.name, users.email, users.balance_cents, users.created_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()
  `, [hashToken(token)])
  if (!rows[0]) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1 AND expires_at <= NOW()', [hashToken(token)])
    return null
  }
  return rows[0]
}

async function addWalletTransaction(client, userId, kind, amountCents, balanceAfterCents, description) {
  await client.query(`
    INSERT INTO wallet_transactions (id, user_id, kind, amount_cents, balance_after_cents, description)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [randomUUID(), userId, kind, amountCents, balanceAfterCents, description])
}

function validateSelections(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 25) return null
  for (const item of items) {
    if (!item || typeof item.matchId !== 'string' || typeof item.home !== 'string' || typeof item.away !== 'string' ||
        typeof item.league !== 'string' || !['1', 'X', '2'].includes(item.outcome) || !Number.isFinite(item.odds) ||
        item.odds < 1.01 || item.odds > 1000 ||
        [item.matchId, item.home, item.away, item.league].some((value) => value.length > 120)) return null
  }
  return items
}

export default async function handler(request) {
  const url = new URL(request.url)
  const secureCookie = url.protocol === 'https:'
  const route = url.pathname.replace(/\/+$/, '') || '/'
  try {
    if (request.method !== 'GET') requireSameOrigin(request)

    if (route === '/api/health' && request.method === 'GET') {
      await pool.query('SELECT 1')
      return json({ ok: true })
    }

    if (route === '/api/auth/signup' && request.method === 'POST') {
      const body = await readJson(request)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (name.length < 2 || name.length > 100) return json({ error: 'Enter a name between 2 and 100 characters.' }, 400)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: 'Enter a valid email address.' }, 400)
      if (password.length < 8 || password.length > 256) return json({ error: 'Password must be between 8 and 256 characters.' }, 400)
      const salt = randomBytes(16).toString('hex')
      const passwordHash = await scrypt(`${password}${passwordPepper}`, salt, 64)
      const created = await withTransaction(async (client) => {
        const id = randomUUID()
        const { rows } = await client.query(`
          INSERT INTO users (id, name, email, password_salt, password_hash)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, email, balance_cents, created_at
        `, [id, name, email, salt, passwordHash.toString('hex')])
        const token = await createSession(client, id)
        return { user: rows[0], token }
      }).catch((error) => {
        if (error.code === '23505') throw new ApiError(409, 'An account with this email already exists.')
        throw error
      })
      return json({ user: publicUser(created.user) }, 201, { 'Set-Cookie': sessionCookie(created.token, secureCookie) })
    }

    if (route === '/api/auth/login' && request.method === 'POST') {
      checkLoginLimit(request)
      const body = await readJson(request)
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const { rows } = await pool.query(
        'SELECT id, password_salt, password_hash FROM users WHERE email = $1',
        [email],
      )
      const account = rows[0]
      if (!account || password.length > 256) {
        await scrypt(`${password}${passwordPepper}`, 'bet360-invalid-login-salt', 64)
        return json({ error: 'Email or password is incorrect.' }, 401)
      }
      const passwordHash = await scrypt(`${password}${passwordPepper}`, account.password_salt, 64)
      const expectedHash = Buffer.from(account.password_hash, 'hex')
      if (passwordHash.length !== expectedHash.length || !timingSafeEqual(passwordHash, expectedHash)) {
        return json({ error: 'Email or password is incorrect.' }, 401)
      }
      const token = await withTransaction(async (client) => createSession(client, account.id))
      const user = await pool.query(
        'SELECT id, name, email, balance_cents, created_at FROM users WHERE id = $1',
        [account.id],
      )
      return json({ user: publicUser(user.rows[0]) }, 200, { 'Set-Cookie': sessionCookie(token, secureCookie) })
    }

    if (route === '/api/auth/logout' && request.method === 'POST') {
      const token = getCookie(request, 'bet360_session')
      if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)])
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', secureCookie, 0) })
    }

    if (route === '/api/me' && request.method === 'GET') {
      const user = await currentUser(request)
      return json({ user: user ? publicUser(user) : null })
    }

    const user = await currentUser(request)
    if (!user) return json({ error: 'Please log in to access your account.' }, 401)

    if (route === '/api/wallet/demo-deposit' && request.method === 'POST') {
      const body = await readJson(request)
      const amountCents = centsFromCredits(body.amount)
      if (amountCents === null) return json({ error: 'Demo deposits must be between 0.01 and 10,000 credits.' }, 400)
      const updated = await withTransaction(async (client) => {
        const { rows } = await client.query(`
          UPDATE users SET balance_cents = balance_cents + $1
          WHERE id = $2 AND balance_cents <= $3
          RETURNING id, name, email, balance_cents, created_at
        `, [amountCents, user.id, maxBalanceCents - amountCents])
        if (!rows[0]) throw new ApiError(409, 'The wallet balance has reached its supported limit.')
        await addWalletTransaction(client, user.id, 'demo_deposit', amountCents, rows[0].balance_cents, 'Demo credit deposit')
        return rows[0]
      })
      return json({ user: publicUser(updated), demoOnly: true })
    }

    if (route === '/api/wallet/virtual-wager' && request.method === 'POST') {
      const body = await readJson(request)
      const game = demoGames.get(body.gameId)
      const wager = centsFromCredits(body.stake)
      if (!game || !['home', 'away'].includes(body.team)) return json({ error: 'Choose a valid virtual game and team.' }, 400)
      if (wager === null) return json({ error: 'Wager must be between 0.01 and 10,000 demo credits.' }, 400)
      const homeScore = randomInt(0, 6)
      let awayScore = randomInt(0, 6)
      if (homeScore === awayScore) awayScore = (awayScore + 1) % 6
      const winner = homeScore > awayScore ? 'home' : 'away'
      const won = body.team === winner
      const prizeCents = won ? Math.round(wager * game.odds) : 0
      const updated = await withTransaction(async (client) => {
        const { rows } = await client.query(`
          UPDATE users SET balance_cents = balance_cents - $1 + $2
          WHERE id = $3 AND balance_cents >= $1 AND balance_cents - $1 + $2 <= $4
          RETURNING id, name, email, balance_cents, created_at
        `, [wager, prizeCents, user.id, maxBalanceCents])
        if (!rows[0]) throw new ApiError(409, 'Insufficient demo-credit balance for this wager.')
        const afterStake = Number(rows[0].balance_cents) - prizeCents
        await addWalletTransaction(client, user.id, 'virtual_wager', -wager, afterStake, `Virtual wager: ${game.home} vs ${game.away}`)
        if (won) await addWalletTransaction(client, user.id, 'virtual_prize', prizeCents, rows[0].balance_cents, `Virtual prize: ${game.home} vs ${game.away}`)
        return rows[0]
      })
      return json({
        user: publicUser(updated),
        result: { score: `${homeScore} - ${awayScore}`, winner, won, stake: creditsFromCents(wager), prize: creditsFromCents(prizeCents) },
        demoOnly: true,
      })
    }

    if (route === '/api/bets' && request.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM bets WHERE user_id = $1 ORDER BY placed_at DESC', [user.id])
      return json({ bets: rows.map(publicBet) })
    }

    if (route === '/api/bets' && request.method === 'POST') {
      const body = await readJson(request)
      const stakeCents = centsFromCredits(body.stake)
      const selections = validateSelections(body.selections)
      if (stakeCents === null || !selections) return json({ error: 'Provide a valid stake and between 1 and 25 valid selections.' }, 400)
      const totalStake = stakeCents * selections.length
      if (!Number.isSafeInteger(totalStake)) return json({ error: 'The total stake is too large.' }, 400)
      const bets = await withTransaction(async (client) => {
        const { rows: accountRows } = await client.query(`
          UPDATE users SET balance_cents = balance_cents - $1
          WHERE id = $2 AND balance_cents >= $1
          RETURNING id, name, email, balance_cents, created_at
        `, [totalStake, user.id])
        if (!accountRows[0]) throw new ApiError(409, 'Insufficient demo-credit balance for these bets.')
        const saved = []
        for (const selection of selections) {
          const potentialReturn = Math.round(stakeCents * selection.odds)
          const { rows } = await client.query(`
            INSERT INTO bets (id, user_id, match_id, league, home, away, outcome, odds, stake_cents, potential_return_cents)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
          `, [
            randomUUID(), user.id, selection.matchId, selection.league, selection.home,
            selection.away, selection.outcome, selection.odds, stakeCents, potentialReturn,
          ])
          saved.push(rows[0])
        }
        await addWalletTransaction(
          client,
          user.id,
          'sports_bet',
          -totalStake,
          accountRows[0].balance_cents,
          `${selections.length} demo sports bet${selections.length === 1 ? '' : 's'}`,
        )
        return { user: accountRows[0], bets: saved }
      })
      return json({ user: publicUser(bets.user), bets: bets.bets.map(publicBet), demoOnly: true }, 201)
    }

    return json({ error: 'API route not found.' }, 404)
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status)
    console.error('Netlify API request failed:', error)
    return json({ error: 'The server could not complete that request.' }, 500)
  }
}

export const config = { path: '/api/*' }
export { centsFromCredits, validateSelections }
