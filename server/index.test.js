import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { after, before, test } from 'node:test'

let directory
let port
let apiProcess
let sessionCookie = ''
const base = () => `http://127.0.0.1:${port}`

async function availablePort() {
  const listener = createServer()
  await new Promise((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', resolve)
  })
  const { port: selectedPort } = listener.address()
  await new Promise((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())))
  return selectedPort
}

function startApi() {
  apiProcess = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(port),
      BET360_DB_PATH: path.join(directory, 'account-test.sqlite'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  apiProcess.stdout.on('data', (chunk) => { output += chunk })
  apiProcess.stderr.on('data', (chunk) => { output += chunk })
  apiProcess.testOutput = () => output
}

async function stopApi() {
  if (!apiProcess || apiProcess.exitCode !== null) return
  const stopped = new Promise((resolve) => apiProcess.once('exit', resolve))
  apiProcess.kill()
  await stopped
  apiProcess = null
}

async function waitForApi() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (apiProcess.exitCode !== null) throw new Error(`API server exited early:\n${apiProcess.testOutput()}`)
    try {
      const response = await fetch(`${base()}/api/health`)
      if (response.ok) return
    } catch {
      await delay(50)
    }
  }
  throw new Error(`API server did not become ready:\n${apiProcess.testOutput()}`)
}

async function callApi(route, { method = 'GET', body } = {}) {
  const headers = {}
  if (sessionCookie) headers.Cookie = sessionCookie
  if (body) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${base()}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) sessionCookie = setCookie.match(/bet360_session=[^;]*/)?.[0] || ''
  return { status: response.status, data: await response.json() }
}

before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'bet360-api-test-'))
  port = await availablePort()
  startApi()
  await waitForApi()
})

after(async () => {
  await stopApi()
  if (directory) await rm(directory, { recursive: true, force: true })
})

test('persists authenticated users, demo wallet credits, and bets in SQLite', async () => {
  const signup = await callApi('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Test User', email: 'test@example.com', password: 'password123' },
  })
  assert.equal(signup.status, 201)
  assert.equal(signup.data.user.balance, 0)
  assert.match(sessionCookie, /^bet360_session=/)

  const deposit = await callApi('/api/wallet/demo-deposit', {
    method: 'POST',
    body: { amount: 100 },
  })
  assert.equal(deposit.status, 200)
  assert.equal(deposit.data.user.balance, 100)
  assert.equal(deposit.data.demoOnly, true)

  const virtual = await callApi('/api/wallet/virtual-wager', {
    method: 'POST',
    body: { gameId: 'virtual-football', team: 'home', stake: 10 },
  })
  assert.equal(virtual.status, 200)
  const expectedBalanceAfterWager = 100 - 10 + virtual.data.result.prize
  assert.equal(virtual.data.user.balance, expectedBalanceAfterWager)

  const bets = await callApi('/api/bets', {
    method: 'POST',
    body: {
      stake: 3,
      selections: [
        { matchId: 'test-1', league: 'Demo League', home: 'Home FC', away: 'Away FC', outcome: '1', odds: 2 },
        { matchId: 'test-2', league: 'Demo League', home: 'North FC', away: 'South FC', outcome: 'X', odds: 3.2 },
      ],
    },
  })
  assert.equal(bets.status, 201)
  assert.equal(bets.data.bets.length, 2)
  assert.equal(bets.data.user.balance, expectedBalanceAfterWager - 6)

  await stopApi()
  startApi()
  await waitForApi()

  const account = await callApi('/api/me')
  assert.equal(account.data.user.email, 'test@example.com')
  assert.equal(account.data.user.balance, expectedBalanceAfterWager - 6)
  const history = await callApi('/api/bets')
  assert.equal(history.data.bets.length, 2)
})
