import assert from 'node:assert/strict'
import { test } from 'node:test'
import { centsFromCredits, validateSelections } from '../netlify/functions/api.js'

test('converts valid demo-credit amounts to integer cents', () => {
  assert.equal(centsFromCredits(10), 1000)
  assert.equal(centsFromCredits('0.15'), 15)
  assert.equal(centsFromCredits(0), null)
  assert.equal(centsFromCredits(10000.01), null)
  assert.equal(centsFromCredits(Number.NaN), null)
})

test('accepts valid bet selections and rejects invalid or oversized selections', () => {
  const selection = {
    matchId: 'match-1',
    league: 'Demo League',
    home: 'Home FC',
    away: 'Away FC',
    outcome: '1',
    odds: 2.25,
  }
  assert.deepEqual(validateSelections([selection]), [selection])
  assert.equal(validateSelections([]), null)
  assert.equal(validateSelections([{ ...selection, outcome: 'unknown' }]), null)
  assert.equal(validateSelections([{ ...selection, odds: 1 }]), null)
  assert.equal(validateSelections(Array.from({ length: 26 }, () => selection)), null)
})
