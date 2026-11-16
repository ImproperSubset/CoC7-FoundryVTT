import './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7DicePool from '../coc7/apps/dice-pool.js'

/**
 * Buttons a rolled and failed check, not yet pushed, offers, as a check card asks for them
 * @param {object} t
 * @param {string} key
 * @returns {object}
 */
function failedCheckButtons (t, key) {
  t.mock.getter(CoC7DicePool.prototype, 'isRolled', () => true)
  t.mock.getter(CoC7DicePool.prototype, 'isPushed', () => false)
  t.mock.getter(CoC7DicePool.prototype, 'isSuccess', () => false)
  t.mock.getter(CoC7DicePool.prototype, 'isFumble', () => false)
  return CoC7DicePool.newPool({ threshold: 50 }).availableButtons({ luckAvailable: 0, isPushable: true, key })
}

test('a failed Luck check offers no push', (t) => {
  assert.equal(failedCheckButtons(t, 'lck').pushRoll, undefined)
})

test('a failed Sanity check offers no push', (t) => {
  assert.equal(failedCheckButtons(t, 'san').pushRoll, undefined)
})

test('a failed characteristic check offers a push', (t) => {
  assert.equal(failedCheckButtons(t, 'str').pushRoll, true)
})
