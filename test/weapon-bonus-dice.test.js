import { documents, settings } from './foundry-stubs.js'
import { actor, clearCreatedCard, createdCard, savedMeleeMessage, savedRangedMessage, weapon } from './combat-cards.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatMelee from '../coc7/apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../coc7/apps/chat-combat-ranged.js'
import CoC7ModelsActiveEffectDocumentClass from '../coc7/models/active-effect/document-class.js'
import CoC7ModelsItemDocumentClass from '../coc7/models/item/document-class.js'
import CoC7ModelsItemWeaponSystem from '../coc7/models/item/weapon-system.js'

settings.messageMode = 'publicroll' // cspell:disable-line
settings.pulpRuleProne = false

/**
 * Add a change's value to the property its key names, as Foundry does for an Add change to a key with no schema field
 * @param {object} target
 * @param {object} change
 * @returns {object}
 */
function applyAdd (target, change) {
  const keys = change.key.split('.')
  const last = keys.pop()
  const parent = keys.reduce((c, key) => c[key], target)
  parent[last] = (parent[last] ?? 0) + Number(change.value)
  return { [change.key]: parent[last] }
}

// Foundry 13 applies a change through the effect, Foundry 14 through the class
ActiveEffect.prototype.apply = function (target, change) {
  return applyAdd(target, change)
}
ActiveEffect.prototype.shouldApplyChange = function (change, { phase }) {
  return change.phase === phase
}
ActiveEffect.applyChange = applyAdd

/**
 * Create a weapon item, prepared as Foundry prepares it, carrying one effect that adds -1 to its bonus dice
 * @param {object} options
 * @param {boolean} options.rngd
 * @param {boolean} options.disabled the effect's enable toggle is off
 * @param {boolean} options.transfer the effect applies to the actor
 * @returns {Document}
 */
function weaponWithEffect ({ rngd, disabled = false, transfer = false }) {
  const effect = new CoC7ModelsActiveEffectDocumentClass()
  Object.assign(effect, {
    active: !disabled,
    name: 'Bent sights',
    changes: [{ key: 'system.bonusDice', mode: 2, value: '-1' }],
    disabled,
    system: {
      changes: [{ key: 'system.bonusDice', phase: 'initial', priority: 20, type: 'add', value: '-1' }]
    },
    transfer
  })
  const item = new CoC7ModelsItemDocumentClass()
  const system = new CoC7ModelsItemWeaponSystem()
  const data = weapon(rngd).system
  delete data.bonusDice
  // The card's template data reads these too
  Object.assign(data, {
    ammo: 6,
    description: { value: '' },
    range: { normal: { damage: '1D10' }, long: { damage: null }, extreme: { damage: null } },
    skillMain: undefined,
    usesPerRound: { max: 1 }
  })
  data.properties.spcl = false
  // The card reads these, which the real model would find on the item's actor
  Object.defineProperties(system, Object.getOwnPropertyDescriptors(data))
  Object.assign(item, {
    effects: [effect],
    name: 'Revolver',
    getRollData: () => system,
    system,
    type: 'weapon'
  })
  item.system.prepareBaseData()
  item.prepareEmbeddedDocuments()
  return item
}

/**
 * Open a ranged combat card with the weapon and return the dice pool modifier its target starts with
 * @param {object} options weaponWithEffect options
 * @param {object} t test context
 * @returns {Promise<number>}
 */
async function rangedPoolModifier (options, t) {
  t.mock.method(CoC7ChatCombatRanged.prototype, 'getTemplateData', async () => ({}))
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor()
  documents['Item.weapon'] = weaponWithEffect({ ...options, rngd: true })
  clearCreatedCard()
  await CoC7ChatCombatRanged.createMessage({ attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuids: ['Actor.target'] })
  return createdCard().flags.CoC7.load.targets[0].poolModifier
}

/**
 * Open a melee combat card with the weapon and return the dice pool modifier it starts with
 * @param {object} options weaponWithEffect options
 * @param {object} t test context
 * @returns {Promise<number>}
 */
async function meleePoolModifier (options, t) {
  t.mock.method(CoC7ChatCombatMelee.prototype, 'getTemplateData', async () => ({}))
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor()
  documents['Item.weapon'] = weaponWithEffect({ ...options, rngd: false })
  clearCreatedCard()
  await CoC7ChatCombatMelee.createMessage({ attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuid: 'Actor.target' })
  return createdCard().flags.CoC7.load.poolModifier
}

/**
 * Load a saved ranged combat card for the weapon and return the effects its template data names
 * @param {object} options weaponWithEffect options
 * @returns {Promise<Array>}
 */
async function rangedEffectPills (options) {
  documents['Actor.attacker'] = actor()
  documents['Item.weapon'] = weaponWithEffect({ ...options, rngd: true })
  const message = savedRangedMessage({
    targets: [{ uuid: '', extremeRange: false, longRange: false, outOfRange: false, poolKeys: [], poolModifier: documents['Item.weapon'].system.bonusDice }]
  })
  const data = await (await CoC7ChatCombatRanged.loadFromMessage(message)).getTemplateData()
  return data.bonusDiceEffects
}

/**
 * Load a saved melee combat card for the weapon and return the pills at the bottom of its template data
 * @param {object} options weaponWithEffect options
 * @returns {Promise<Array>}
 */
async function meleeTags (options) {
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor()
  documents['Item.weapon'] = weaponWithEffect({ ...options, rngd: false })
  const message = savedMeleeMessage({ itemUuid: 'Item.weapon', poolModifier: documents['Item.weapon'].system.bonusDice })
  const data = await (await CoC7ChatCombatMelee.loadFromMessage(message)).getTemplateData()
  return data.tags
}

for (const generation of [13, 14]) {
  test('Foundry ' + generation + ': a ranged card starts with a penalty die from an enabled weapon effect', async (t) => {
    game.release.generation = generation
    assert.equal(await rangedPoolModifier({}, t), -1)
  })

  test('Foundry ' + generation + ': a ranged card starts with no penalty die from a disabled weapon effect', async (t) => {
    game.release.generation = generation
    assert.equal(await rangedPoolModifier({ disabled: true }, t), 0)
  })

  test('Foundry ' + generation + ': a melee card starts with a penalty die from an enabled weapon effect', async (t) => {
    game.release.generation = generation
    assert.equal(await meleePoolModifier({}, t), -1)
  })

  test('Foundry ' + generation + ': a melee card starts with no penalty die from a disabled weapon effect', async (t) => {
    game.release.generation = generation
    assert.equal(await meleePoolModifier({ disabled: true }, t), 0)
  })

  test('Foundry ' + generation + ': a ranged card names an enabled weapon effect behind its penalty die', async () => {
    game.release.generation = generation
    assert.deepEqual(await rangedEffectPills({}), ['Bent sights'])
  })

  test('Foundry ' + generation + ': a ranged card names no disabled weapon effect', async () => {
    game.release.generation = generation
    assert.deepEqual(await rangedEffectPills({ disabled: true }), [])
  })

  test('Foundry ' + generation + ': a ranged card names no weapon effect that applies to the actor', async () => {
    game.release.generation = generation
    assert.deepEqual(await rangedEffectPills({ transfer: true }), [])
  })

  test('Foundry ' + generation + ': a melee card names an enabled weapon effect beside its penalty die', async () => {
    game.release.generation = generation
    assert.deepEqual(await meleeTags({}), ['CoC7.Combat', 'Bent sights', '1 CoC7.DiceModifierPenalty'])
  })

  test('Foundry ' + generation + ': a melee card names no disabled weapon effect', async () => {
    game.release.generation = generation
    assert.deepEqual(await meleeTags({ disabled: true }), ['CoC7.Combat'])
  })

  test('Foundry ' + generation + ': an effect that applies to the actor leaves the weapon unchanged', async (t) => {
    game.release.generation = generation
    assert.equal(await rangedPoolModifier({ transfer: true }, t), 0)
  })
}

test('preparing the weapon again does not add the effect twice', () => {
  game.release.generation = 13
  const item = weaponWithEffect({ rngd: true })
  item.system.prepareBaseData()
  item.prepareEmbeddedDocuments()
  assert.equal(item.system.bonusDice, -1)
})
