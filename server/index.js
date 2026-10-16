import { randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const scrypt = promisify(scryptCallback)
const port = Number(process.env.API_PORT || 3001)
const databasePath = path.resolve(process.env.BET360_DB_PATH || 'data/bet360.sqlite')
const sessionLifetimeSeconds = 60 * 60 * 24 * 7
const maxRequestBytes = 16 * 1024
const demoGames = new Map([
  ['virtual-football', { sport: 'Football', home: 'Emerald FC', away: 'City United', odds: 1.9 }],
  ['virtual-basketball', { sport: 'Basketball', home: 'Green Hoops', away: 'Metro Stars', odds: 1.9 }],
  ['virtual-tennis', { sport: 'Tennis', home: 'A. Green', away: 'M. Court', odds: 1.9 }],
])
const loginAttempts = new Map()
const passwordPepper = process.env.BET360_PASSWORD_PEPPER || ''

mkdirSync(path.dirname(databasePath), { recursive: true })

const database = new DatabaseSync(databasePath)
database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    balance_cents INTEGER NOT NULL DEFAULT 0 CHECK(balance_cents >= 0),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    balance_after_cents INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    league TEXT NOT NULL,
    home TEXT NOT NULL,
    away TEXT NOT NULL,
    outcome TEXT NOT NULL,
    odds REAL NOT NULL,
    stake_cents INTEGER NOT NULL,
    potential_return_cents INTEGER NOT NULL,
    placed_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS bets_user_id_idx ON bets(user_id, placed_at DESC);
`)

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    ...headers,
  })
  response.end(JSON.stringify(body))
}

function creditsFromCents(cents) {
  return Number((cents / 100).toFixed(2))
}

function centsFromCredits(value, { min = 0.01, max = 10000 } = {}) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < min || amount > max) return null
  const cents = Math.round(amount * 100)
  return cents > 0 ? cents : null
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    balance: creditsFromCents(row.balance_cents),
    createdAt: row.created_at,
  }
}

function getUserById(id) {
  return database.prepare('SELECT id, name, email, balance_cents, created_at FROM users WHERE id = ?').get(id)
}

async function readJson(request) {
  let size = 0
  const chunks = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxRequestBytes) {
      const error = new Error('Request body is too large.')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!size) return {}
  try {
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Expected an object.')
    return result
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.status = 400
    throw error
  }
}

function requireSameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return
  const host = request.headers.host
  const expected = `${request.socket.encrypted ? 'https' : 'http'}://${host}`
  if (origin !== expected) {
    const error = new Error('Cross-origin requests are not allowed.')
    error.status = 403
    throw error
  }
}

function getCookie(request, key) {
  const cookieHeader = request.headers.cookie || ''
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name === key) return valueParts.join('=')
  }
  return null
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function sessionCookie(token, maxAge = sessionLifetimeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `bet360_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`
}

function currentUser(request) {
  const token = getCookie(request, 'bet360_session')
  if (!token) return null
  const tokenHash = hashToken(token)
  const session = database.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?').get(tokenHash, Date.now())
  if (!session) {
    database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash)
    return null
  }
  return getUserById(session.user_id)
}

function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + sessionLifetimeSeconds * 1000
  database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), userId, expiresAt)
  return token
}

function checkLoginLimit(request) {
  const address = request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const active = (loginAttempts.get(address) || []).filter((attempt) => now - attempt < 60_000)
  if (active.length >= 12) {
    const error = new Error('Too many login attempts. Please wait a minute and try again.')
    error.status = 429
    throw error
  }
  active.push(now)
  loginAttempts.set(address, active)
}

function transaction(callback) {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = callback()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function addWalletTransaction(userId, kind, amountCents, balanceAfterCents, description) {
  database.prepare(`
    INSERT INTO wallet_transactions (id, user_id, kind, amount_cents, balance_after_cents, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), userId, kind, amountCents, balanceAfterCents, description, new Date().toISOString())
}

function publicBet(row) {
  return {
    betId: row.id,
    matchId: row.match_id,
    league: row.league,
    home: row.home,
    away: row.away,
    outcome: row.outcome,
    odds: row.odds,
    stake: creditsFromCents(row.stake_cents),
    potentialReturn: creditsFromCents(row.potential_return_cents),
    placedAt: row.placed_at,
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  if (url.pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (!url.pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'Not found.' })
    return
  }

  try {
    if (request.method !== 'GET') requireSameOrigin(request)

    if (url.pathname === '/api/auth/signup' && request.method === 'POST') {
      const body = await readJson(request)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (name.length < 2 || name.length > 100) {
        sendJson(response, 400, { error: 'Enter a name between 2 and 100 characters.' })
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        sendJson(response, 400, { error: 'Enter a valid email address.' })
        return
      }
      if (password.length < 8 || password.length > 256) {
        sendJson(response, 400, { error: 'Password must be between 8 and 256 characters.' })
        return
      }
      const salt = randomBytes(16).toString('hex')
      const passwordHash = await scrypt(`${password}${passwordPepper}`, salt, 64)
      const id = randomUUID()
      const createdAt = new Date().toISOString()
      try {
        database.prepare(`
          INSERT INTO users (id, name, email, password_salt, password_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, name, email, salt, passwordHash.toString('hex'), createdAt)
      } catch (error) {
        if (error.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE') {
          sendJson(response, 409, { error: 'An account with this email already exists.' })
          return
        }
        throw error
      }
      const token = createSession(id)
      sendJson(response, 201, { user: publicUser(getUserById(id)) }, { 'Set-Cookie': sessionCookie(token) })
      return
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      checkLoginLimit(request)
      const body = await readJson(request)
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const row = database.prepare('SELECT id, password_salt, password_hash FROM users WHERE email = ?').get(email)
      if (!row || password.length > 256) {
        await scrypt(`${password}${passwordPepper}`, 'bet360-invalid-login-salt', 64)
        sendJson(response, 401, { error: 'Email or password is incorrect.' })
        return
      }
      const passwordHash = await scrypt(`${password}${passwordPepper}`, row.password_salt, 64)
      const expectedHash = Buffer.from(row.password_hash, 'hex')
      if (passwordHash.length !== expectedHash.length || !timingSafeEqual(passwordHash, expectedHash)) {
        sendJson(response, 401, { error: 'Email or password is incorrect.' })
        return
      }
      const token = createSession(row.id)
      sendJson(response, 200, { user: publicUser(getUserById(row.id)) }, { 'Set-Cookie': sessionCookie(token) })
      return
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const token = getCookie(request, 'bet360_session')
      if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) })
      return
    }

    if (url.pathname === '/api/me' && request.method === 'GET') {
      const user = currentUser(request)
      sendJson(response, 200, { user: user ? publicUser(user) : null })
      return
    }

    const user = currentUser(request)
    if (!user) {
      sendJson(response, 401, { error: 'Please log in to access your account.' })
      return
    }

    if (url.pathname === '/api/wallet/demo-deposit' && request.method === 'POST') {
      const body = await readJson(request)
      const amountCents = centsFromCredits(body.amount)
      if (amountCents === null) {
        sendJson(response, 400, { error: 'Demo deposits must be between 0.01 and 10,000 credits.' })
        return
      }
      const updated = transaction(() => {
        const result = database.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?').run(amountCents, user.id)
        if (result.changes !== 1) throw new Error('Account balance could not be updated.')
        const account = getUserById(user.id)
        addWalletTransaction(user.id, 'demo_deposit', amountCents, account.balance_cents, 'Demo credit deposit')
        return account
      })
      sendJson(response, 200, { user: publicUser(updated), demoOnly: true })
      return
    }

    if (url.pathname === '/api/wallet/virtual-wager' && request.method === 'POST') {
      const body = await readJson(request)
      const game = demoGames.get(body.gameId)
      const wager = centsFromCredits(body.stake)
      if (!game || !['home', 'away'].includes(body.team)) {
        sendJson(response, 400, { error: 'Choose a valid virtual game and team.' })
        return
      }
      if (wager === null) {
        sendJson(response, 400, { error: 'Wager must be between 0.01 and 10,000 demo credits.' })
        return
      }
      const homeScore = randomInt(0, 6)
      let awayScore = randomInt(0, 6)
      if (homeScore === awayScore) awayScore = (awayScore + 1) % 6
      const winner = homeScore > awayScore ? 'home' : 'away'
      const won = body.team === winner
      const prizeCents = won ? Math.round(wager * game.odds) : 0
      const updated = transaction(() => {
        const result = database.prepare(`
          UPDATE users SET balance_cents = balance_cents - ? + ?
          WHERE id = ? AND balance_cents >= ?
        `).run(wager, prizeCents, user.id, wager)
        if (result.changes !== 1) {
          const error = new Error('Insufficient demo-credit balance for this wager.')
          error.status = 409
          throw error
        }
        const account = getUserById(user.id)
        addWalletTransaction(user.id, 'virtual_wager', -wager, account.balance_cents - prizeCents, `Virtual wager: ${game.home} vs ${game.away}`)
        if (won) addWalletTransaction(user.id, 'virtual_prize', prizeCents, account.balance_cents, `Virtual prize: ${game.home} vs ${game.away}`)
        return account
      })
      sendJson(response, 200, {
        user: publicUser(updated),
        result: { score: `${homeScore} - ${awayScore}`, winner, won, stake: creditsFromCents(wager), prize: creditsFromCents(prizeCents) },
        demoOnly: true,
      })
      return
    }

    if (url.pathname === '/api/bets' && request.method === 'GET') {
      const rows = database.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC').all(user.id)
      sendJson(response, 200, { bets: rows.map(publicBet) })
      return
    }

    if (url.pathname === '/api/bets' && request.method === 'POST') {
      const body = await readJson(request)
      const stakeCents = centsFromCredits(body.stake)
      const items = body.selections
      if (stakeCents === null || !Array.isArray(items) || items.length < 1 || items.length > 25) {
        sendJson(response, 400, { error: 'Provide a valid stake and between 1 and 25 selections.' })
        return
      }
      const selections = []
      for (const item of items) {
        if (!item || typeof item.matchId !== 'string' || typeof item.home !== 'string' || typeof item.away !== 'string' ||
            typeof item.league !== 'string' || typeof item.outcome !== 'string' || !Number.isFinite(item.odds) ||
            item.odds < 1.01 || item.odds > 1000 ||
            [item.matchId, item.home, item.away, item.league, item.outcome].some((value) => value.length > 120)) {
          sendJson(response, 400, { error: 'One or more selections are invalid.' })
          return
        }
        selections.push(item)
      }
      const totalStake = stakeCents * selections.length
      const now = new Date().toISOString()
      const created = transaction(() => {
        const result = database.prepare('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ? AND balance_cents >= ?').run(totalStake, user.id, totalStake)
        if (result.changes !== 1) {
          const error = new Error('Insufficient demo-credit balance for these bets.')
          error.status = 409
          throw error
        }
        const account = getUserById(user.id)
        const insert = database.prepare(`
          INSERT INTO bets (id, user_id, match_id, league, home, away, outcome, odds, stake_cents, potential_return_cents, placed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const rows = selections.map((selection) => {
          const potentialReturn = Math.round(stakeCents * selection.odds)
          const id = randomUUID()
          insert.run(id, user.id, selection.matchId, selection.league, selection.home, selection.away, selection.outcome, selection.odds, stakeCents, potentialReturn, now)
          return { id, user_id: user.id, match_id: selection.matchId, league: selection.league, home: selection.home, away: selection.away, outcome: selection.outcome, odds: selection.odds, stake_cents: stakeCents, potential_return_cents: potentialReturn, placed_at: now }
        })
        addWalletTransaction(user.id, 'sports_bet', -totalStake, account.balance_cents, `${selections.length} demo sports bet${selections.length === 1 ? '' : 's'}`)
        return { account, rows }
      })
      sendJson(response, 201, { user: publicUser(created.account), bets: created.rows.map(publicBet), demoOnly: true })
      return
    }

    sendJson(response, 404, { error: 'API route not found.' })
  } catch (error) {
    if (error.status) {
      sendJson(response, error.status, { error: error.message })
      return
    }
    console.error('API request failed:', error)
    sendJson(response, 500, { error: 'The server could not complete that request.' })
  }
})

server.listen(port, '127.0.0.1', () => {
  const address = server.address()
  console.log(`bet360 API listening on http://127.0.0.1:${address.port}`)
})

function shutdown() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
