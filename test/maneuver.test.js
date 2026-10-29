import { documents, settings } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatMelee from '../coc7/apps/chat-combat-melee.js'
import CoC7ChatDamage from '../coc7/apps/chat-damage.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'
import CoC7Utilities from '../coc7/apps/utilities.js'

settings.displayActorOnCard = false
settings.pulpRuleLuckMalfunction = false
settings.pulpRuleProne = true
settings.rollMode = 'publicroll' // cspell:disable-line
game.user = { isGM: true }

/**
 * Create an actor with only the data the melee card reads
 * @param {number|null} build
 * @returns {object}
 */
function actor (build) {
  const items = [{ id: 'brawl', type: 'skill', system: { value: 50 } }]
  items.get = id => items.find(doc => doc.id === id)
  return {
    type: 'character',
    name: 'Actor',
    img: '',
    isToken: false,
    items,
    system: {
      attribs: {
        build: { value: build },
        lck: { value: 50 }
      }
    }
  }
}

/**
 * Create the item a melee card is rolled with
 * @param {string} kind mnvr, weapon, skill or dodge
 * @returns {object}
 */
function item (kind) {
  return {
    type: (['mnvr', 'weapon'].includes(kind) ? 'weapon' : 'skill'),
    name: kind,
    img: 'item.webp',
    uuid: 'Item.item',
    system: {
      description: { value: '' },
      isDodge: kind === 'dodge',
      properties: { mnvr: kind === 'mnvr', spcl: false },
      range: { normal: { damage: '' } },
      skill: { main: { id: 'brawl' }, alternativ: { id: '' } },
      skillMain: undefined,
      value: 50
    }
  }
}

/**
 * Saved melee card message
 * @param {object} options
 * @param {integer} options.participant
 * @param {Array} options.poolKeys
 * @param {object} options.load extra saved values
 * @returns {object}
 */
function message ({ participant, poolKeys = [], load = {} }) {
  return {
    id: 'message',
    flags: {
      CoC7: {
        load: {
          as: 'CoC7ChatCombatMelee',
          attackerUuid: 'Actor.attacker',
          checkRevealed: true,
          dicePool: CoC7DicePool.newPool({}).toObject(),
          isAutoSuccess: false,
          isNoResponse: false,
          itemUuid: 'Item.item',
          participant,
          poolKeys,
          poolModifier: 0,
          responded: false,
          targetUuid: 'Actor.target',
          ...load
        }
      }
    }
  }
}

/**
 * Load a melee card and return what it rolls with
 * @param {object} options
 * @param {number|null} options.attackerBuild
 * @param {number|null} options.targetBuild
 * @param {boolean} options.response true for the defender's card
 * @param {string} options.kind
 * @param {Array} options.poolKeys
 * @returns {object}
 */
async function card ({ attackerBuild = 0, targetBuild = 0, response = false, kind = 'mnvr', poolKeys = [] }) {
  documents['Actor.attacker'] = actor(attackerBuild)
  documents['Actor.target'] = actor(targetBuild)
  documents['Item.item'] = item(kind)
  const participant = (response ? CoC7ChatCombatMelee.participant.target : CoC7ChatCombatMelee.participant.initiator)
  const data = await (await CoC7ChatCombatMelee.loadFromMessage(message({ participant, poolKeys }))).getTemplateData()
  return {
    buildTag: data.buildTag,
    difficulty: data.difficulty,
    finalPoolModifier: data.finalPoolModifier
  }
}

const regular = CoC7DicePool.difficultyLevel.regular
const impossible = CoC7DicePool.difficultyLevel.impossible

for (const [targetBuild, finalPoolModifier, difficulty, buildTag] of [
  [-1, 0, regular, ''],
  [0, 0, regular, ''],
  [1, -1, regular, 'CoC7.ManeuverBuildPenalty'],
  [2, -2, regular, 'CoC7.ManeuverBuildPenalty'],
  [3, 0, impossible, 'CoC7.ManeuverBuildImpossible'],
  [5, 0, impossible, 'CoC7.ManeuverBuildImpossible']
]) {
  test('a Mnvr attack on a target with Build ' + targetBuild + ' against 0', async () => {
    assert.deepEqual(await card({ targetBuild }), { buildTag, difficulty, finalPoolModifier })
  })
}

test('an attack with a weapon without the Maneuver property ignores Build', async () => {
  assert.deepEqual(await card({ targetBuild: 2, kind: 'weapon' }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
})

test('Build is ignored when either side has none', async () => {
  assert.deepEqual(await card({ targetBuild: null }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
  assert.deepEqual(await card({ attackerBuild: null, targetBuild: 2 }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
})

test('the Build penalty nets with bonus dice', async () => {
  assert.deepEqual(await card({ targetBuild: 2, poolKeys: ['proneTarget'] }), { buildTag: 'CoC7.ManeuverBuildPenalty', difficulty: regular, finalPoolModifier: -1 })
})

test('a defender fighting back with a Mnvr weapon compares their Build with the attacker', async () => {
  assert.deepEqual(await card({ attackerBuild: 2, targetBuild: 0, response: true }), { buildTag: 'CoC7.ManeuverBuildPenalty', difficulty: regular, finalPoolModifier: -2 })
  assert.deepEqual(await card({ attackerBuild: 0, targetBuild: 2, response: true }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
})

test('a defender using the Maneuver response compares Build the same way', async () => {
  assert.deepEqual(await card({ attackerBuild: 1, targetBuild: 0, response: true, kind: 'skill' }), { buildTag: 'CoC7.ManeuverBuildPenalty', difficulty: regular, finalPoolModifier: -1 })
  assert.deepEqual(await card({ attackerBuild: 3, targetBuild: 0, response: true, kind: 'skill' }), { buildTag: 'CoC7.ManeuverBuildImpossible', difficulty: impossible, finalPoolModifier: 0 })
})

test('a defender who dodges or fights back with an ordinary weapon ignores Build', async () => {
  assert.deepEqual(await card({ attackerBuild: 2, response: true, kind: 'dodge' }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
  assert.deepEqual(await card({ attackerBuild: 2, response: true, kind: 'weapon' }), { buildTag: '', difficulty: regular, finalPoolModifier: 0 })
})

/**
 * Click the roll button on a saved melee card and return the difficulty the dice were rolled at
 * @param {integer} participant
 * @param {number} difficulty saved difficulty
 * @param {object} t test context
 * @returns {number}
 */
async function rolledDifficulty (participant, difficulty, t) {
  documents['Actor.attacker'] = actor(0)
  documents['Actor.target'] = actor(3)
  documents['Item.item'] = item(participant === CoC7ChatCombatMelee.participant.initiator ? 'mnvr' : 'skill')
  let rolled
  t.mock.method(CoC7DicePool.prototype, 'roll', async function () {
    rolled = this.difficulty
  })
  t.mock.method(CoC7ChatCombatMelee.prototype, 'updateMessage', async () => {})
  t.mock.method(CoC7Utilities, 'messageUpdatedThen', () => {})
  t.mock.method(CoC7Utilities, 'messageUpdatedWithRollThen', () => {})
  const action = (participant === CoC7ChatCombatMelee.participant.initiator ? 'attackerRoll' : 'targetRoll')
  const event = { currentTarget: { dataset: { action } }, target: { dataset: { skill: 'brawl' } } }
  await CoC7ChatCombatMelee._onClickEvent(event, message({ participant, load: { difficulty, finalPoolModifier: 0 } }))
  return rolled
}

test('an impossible maneuver is rolled at Impossible difficulty', async (t) => {
  assert.equal(await rolledDifficulty(CoC7ChatCombatMelee.participant.initiator, impossible, t), impossible)
  assert.equal(await rolledDifficulty(CoC7ChatCombatMelee.participant.target, impossible, t), impossible)
})

test('an ordinary melee roll stays at Regular difficulty', async (t) => {
  assert.equal(await rolledDifficulty(CoC7ChatCombatMelee.participant.initiator, regular, t), regular)
  assert.equal(await rolledDifficulty(CoC7ChatCombatMelee.participant.target, undefined, t), regular)
})

/**
 * Settle a melee exchange on the damage card and return its result
 * @param {object} options
 * @param {string} options.weapon damage formula of the attacker's Maneuver weapon, undefined for an ordinary weapon
 * @param {object} options.response the defender's card data, undefined for no defender card
 * @param {object} t test context
 * @returns {object}
 */
async function damageCard ({ weapon, response }, t) {
  documents['Actor.attacker'] = { ...actor(0), name: 'Attacker' }
  documents['Actor.target'] = { ...actor(0), name: 'Defender' }
  documents['Item.attack'] = { type: 'weapon', system: { properties: { mnvr: typeof weapon !== 'undefined' }, range: { normal: { damage: weapon ?? '1D3' } } } }
  documents['Item.response'] = { type: 'weapon', system: { properties: { mnvr: false }, range: { normal: { damage: '1D3' } } } }
  const cards = {
    attacker: { attackerName: 'Attacker', attackerUuid: 'Actor.attacker', isSuccess: true, itemUuid: 'Item.attack', successLevel: CoC7DicePool.successLevel.hard, targetName: 'Defender', targetUuid: 'Actor.target' },
    target: response
  }
  game.messages = { get: id => ({ flags: { CoC7: { load: { as: 'CoC7ChatCombatMelee' } } }, id }) }
  t.mock.method(CoC7ChatCombatMelee, 'loadFromMessage', async (message) => ({ getTemplateData: async () => cards[message.id] }))
  t.mock.method(CoC7ChatDamage.prototype, 'updateMessage', () => {})
  t.mock.method(CoC7ChatDamage.prototype, 'getTemplateData', async () => ({}))
  const check = new CoC7ChatDamage()
  await check.updateFromCombatMelee({ attacker: 'attacker', target: (response ? 'target' : ''), targetUuid: 'Actor.target' })
  const load = (await check.getChatData()).flags.CoC7.load
  return { resultText: load.resultText, rollDamage: load.rollDamage }
}

const noResponse = { isNoResponse: true }
const failedDodge = { isDodge: true, successLevel: CoC7DicePool.successLevel.failure, itemUuid: 'Item.response' }
const fightBackWins = { isFightBack: true, successLevel: CoC7DicePool.successLevel.extreme, itemUuid: 'Item.response' }

test('a winning Maneuver weapon with no damage reports the maneuver instead of damage', async (t) => {
  for (const response of [undefined, noResponse, failedDodge]) {
    assert.deepEqual(await damageCard({ weapon: '', response }, t), { resultText: 'CoC7.ManeuverSuccess', rollDamage: false })
  }
})

test('a winning Maneuver weapon with damage still rolls damage', async (t) => {
  assert.deepEqual(await damageCard({ weapon: '1D6', response: noResponse }, t), { resultText: 'CoC7.WinnerRollDamage', rollDamage: true })
})

test('a winning ordinary weapon still rolls damage', async (t) => {
  assert.deepEqual(await damageCard({ response: noResponse }, t), { resultText: 'CoC7.WinnerRollDamage', rollDamage: true })
})

test('a defender who wins by fighting back still rolls damage against a Maneuver weapon', async (t) => {
  assert.deepEqual(await damageCard({ weapon: '', response: fightBackWins }, t), { resultText: 'CoC7.WinnerRollDamage', rollDamage: true })
})
