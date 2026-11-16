import { documents, settings } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7Check from '../coc7/apps/check.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'
import CoC7ModelsActorDocumentClass from '../coc7/models/actor/document-class.js'

/**
 * Roll that totals what a test sets and remembers each formula it is given
 */
class TestRoll {
  static formulas = []

  static total = 0

  /**
   * Remember the formula
   * @param {string} formula
   */
  constructor (formula) {
    this.formula = formula
    TestRoll.formulas.push(formula)
  }

  /**
   * Every formula the tests use is valid
   * @returns {boolean}
   */
  static validate () {
    return true
  }

  /**
   * Total is the one the test set
   * @returns {TestRoll}
   */
  async evaluate () {
    this.total = TestRoll.total
    return this
  }

  /**
   * Rendered roll, named by its formula
   * @returns {string}
   */
  async render () {
    return '<roll>' + this.formula + '</roll>'
  }
}

globalThis.Roll = TestRoll
globalThis.ChatMessage = { create: () => {} }
game.user = { isGM: true }
settings.defaultCheckDifficulty = 'regular'
settings.rollMode = 'public'

/**
 * An investigator with what developLuck reads and writes
 * @param {object} options
 * @param {integer} options.luck
 * @param {string} options.luckRecovery
 * @returns {object}
 */
function investigator ({ luck, luckRecovery = '' }) {
  return {
    id: 'investigator',
    system: {
      attribs: { lck: { value: luck } },
      config: { luckRecovery }
    },
    developLuck: CoC7ModelsActorDocumentClass.prototype.developLuck,
    setLuck: CoC7ModelsActorDocumentClass.prototype.setLuck,
    update: mock.fn(async () => {})
  }
}

/**
 * Apply a Luck improvement from an already rolled d100
 * @param {object} t
 * @param {object} options
 * @param {integer} options.d100
 * @param {integer} options.gain
 * @param {integer} options.luck
 * @param {string} options.luckRecovery
 * @param {boolean} options.pulp
 * @returns {object}
 */
async function developLuck (t, { d100, gain = 0, luck, luckRecovery = '', pulp = false }) {
  settings.pulpRuleDevelopmentRollLuck = pulp
  TestRoll.formulas = []
  TestRoll.total = gain
  const created = t.mock.method(ChatMessage, 'create', () => {})
  const rollNewPool = t.mock.method(CoC7DicePool, 'rollNewPool', async () => { throw new Error('rolled a second d100') })
  const actor = investigator({ luck, luckRecovery })
  await actor.developLuck(false, { rolledPool: { newRolls: [], total: d100 } })
  return {
    actor,
    message: created.mock.calls[0]?.arguments[0],
    rolledNewPool: rollNewPool.mock.callCount()
  }
}

test('a rolled d100 above Luck adds 1D10 without rolling a second d100', async (t) => {
  const { actor, message, rolledNewPool } = await developLuck(t, { d100: 70, gain: 6, luck: 50 })
  assert.equal(rolledNewPool, 0)
  assert.deepEqual(TestRoll.formulas, ['1D10'])
  assert.deepEqual(actor.update.mock.calls[0].arguments, [{ 'system.attribs.lck.value': 56 }])
  assert.match(message.content, /coc7-upgrade-success/)
  assert.match(message.content, /<roll>1D10<\/roll>/)
  assert.equal(message.rolls.length, 1)
})

test('a rolled d100 not above Luck adds nothing', async (t) => {
  const { actor, message, rolledNewPool } = await developLuck(t, { d100: 50, luck: 50 })
  assert.equal(rolledNewPool, 0)
  assert.deepEqual(TestRoll.formulas, [])
  assert.equal(actor.update.mock.callCount(), 0)
  assert.match(message.content, /coc7-upgrade-failed/)
  assert.equal(message.rolls.length, 0)
})

test('under the Pulp rule a rolled d100 above Luck adds 2D10+10', async (t) => {
  const { actor } = await developLuck(t, { d100: 70, gain: 20, luck: 50, pulp: true })
  assert.deepEqual(TestRoll.formulas, ['2D10+10'])
  assert.deepEqual(actor.update.mock.calls[0].arguments, [{ 'system.attribs.lck.value': 70 }])
})

test('under the Pulp rule a rolled d100 not above Luck adds 1D10+5', async (t) => {
  const { actor } = await developLuck(t, { d100: 30, gain: 8, luck: 50, pulp: true })
  assert.deepEqual(TestRoll.formulas, ['1D10+5'])
  assert.deepEqual(actor.update.mock.calls[0].arguments, [{ 'system.attribs.lck.value': 58 }])
})

test('the investigator\'s Luck recovery bonus is added to the gain', async (t) => {
  await developLuck(t, { d100: 70, gain: 9, luck: 50, luckRecovery: '2' })
  assert.deepEqual(TestRoll.formulas, ['1D10+2'])
})

test('a Luck improvement stops at 99', async (t) => {
  const { actor } = await developLuck(t, { d100: 98, gain: 10, luck: 95 })
  assert.deepEqual(actor.update.mock.calls[0].arguments, [{ 'system.attribs.lck.value': 99 }])
})

/**
 * A rolled check card in the chat log, and the investigator it belongs to
 * @param {object} t
 * @param {object} load what differs from a rolled Luck check
 * @param {object} options
 * @param {boolean} options.isRolled
 * @param {integer} options.d100
 * @returns {object}
 */
function card (t, load = {}, { isRolled = true, d100 = 70 } = {}) {
  const actor = { developLuck: mock.fn(async () => {}) }
  documents['Actor.investigator'] = actor
  t.mock.getter(CoC7DicePool.prototype, 'isRolled', () => isRolled)
  t.mock.getter(CoC7DicePool.prototype, 'total', () => d100)
  const message = {
    id: 'card',
    uuid: 'ChatMessage.card',
    flags: {
      CoC7: {
        load: {
          as: 'CoC7Check',
          actorUuid: 'Actor.investigator',
          allowPush: true,
          appliedDevelopment: false,
          cardOpen: false,
          cardType: 'C/NO',
          customFlavor: false,
          dicePool: CoC7DicePool.newPool({ threshold: 50 }).toObject(),
          isCombat: false,
          isForced: false,
          isForcedFailure: false,
          isForcedSuccess: false,
          isStandby: false,
          key: 'lck',
          rollMode: 'public',
          standbyRightIcon: '',
          type: 'attribute',
          ...load
        }
      }
    }
  }
  message.update = mock.fn(async (changes) => {
    if (changes['flags.CoC7.load.appliedDevelopment'] === true) {
      message.flags.CoC7.load.appliedDevelopment = true
    }
  })
  game.messages = { get: id => (id === message.id ? message : undefined) }
  documents[message.uuid] = message
  return { actor, message }
}

test('a rolled Luck check card applies a Luck improvement from its d100', async (t) => {
  const { actor, message } = card(t, {}, { d100: 83 })
  assert.equal(await CoC7Check.developLuck(message), true)
  assert.deepEqual(message.update.mock.calls[0].arguments, [{ 'flags.CoC7.load.appliedDevelopment': true }])
  assert.equal(actor.developLuck.mock.callCount(), 1)
  const [fastForward, { rolledPool }] = actor.developLuck.mock.calls[0].arguments
  assert.equal(fastForward, false)
  assert.equal(rolledPool.total, 83)
})

test('a Luck check card can be named by its id or its uuid', async (t) => {
  const { actor } = card(t)
  assert.equal(await CoC7Check.developLuck('card'), true)
  const { actor: second } = card(t)
  assert.equal(await CoC7Check.developLuck('ChatMessage.card'), true)
  assert.equal(actor.developLuck.mock.callCount() + second.developLuck.mock.callCount(), 2)
})

test('a Luck check card is applied once', async (t) => {
  const { actor, message } = card(t)
  assert.equal(await CoC7Check.developLuck(message), true)
  assert.equal(await CoC7Check.developLuck(message), false)
  assert.equal(actor.developLuck.mock.callCount(), 1)
  assert.equal(message.update.mock.callCount(), 1)
})

for (const [name, load, options] of [
  ['a check of another key', { key: 'str', type: 'characteristic' }, {}],
  ['a card that is not a check', { as: 'CoC7SanCheckCard' }, {}],
  ['a Luck check not yet rolled', {}, { isRolled: false }]
]) {
  test('a Luck improvement is refused for ' + name, async (t) => {
    const { actor, message } = card(t, load, options)
    assert.equal(await CoC7Check.developLuck(message), false)
    assert.equal(actor.developLuck.mock.callCount(), 0)
    assert.equal(message.update.mock.callCount(), 0)
  })
}

test('a Luck improvement is refused for a message that is not in the chat log', async (t) => {
  card(t)
  assert.equal(await CoC7Check.developLuck('missing'), false)
})
