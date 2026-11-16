import { documents, settings } from './foundry-stubs.js'
import { actor, clearCreatedCard, clickCard, createdCard, savedMeleeMessage, savedRangedMessage, weapon } from './combat-cards.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatMelee from '../coc7/apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../coc7/apps/chat-combat-ranged.js'

settings.pulpRuleProne = false

/**
 * Act as the Keeper or as a player
 * @param {boolean} isGM
 */
function userIsGM (isGM) {
  globalThis.game.user = { isGM }
}

/**
 * Open a new combat card and return whether it saves itself held
 * @param {Function} card CoC7ChatCombatMelee or CoC7ChatCombatRanged
 * @param {object} options createMessage options
 * @param {boolean} hold the hold setting
 * @param {object} t test context
 * @returns {boolean}
 */
async function opensHeld (card, options, hold, t) {
  settings.holdCombatCards = hold
  t.mock.method(card.prototype, 'getTemplateData', async () => ({}))
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor()
  documents['Item.weapon'] = weapon(card === CoC7ChatCombatRanged)
  clearCreatedCard()
  await card.createMessage(options)
  return createdCard().flags.CoC7.load.isHeld
}

/**
 * Press Release on a held combat card and return whether the card it saves is held, or undefined when it saves none
 * @param {Function} card CoC7ChatCombatMelee or CoC7ChatCombatRanged
 * @param {object} message a held saved card
 * @param {boolean} isGM
 * @param {object} t test context
 * @returns {boolean|undefined}
 */
async function heldAfterRelease (card, message, isGM, t) {
  userIsGM(isGM)
  documents['Actor.attacker'] = actor()
  documents['Item.weapon'] = weapon(true)
  const updated = await clickCard(card, message, 'releaseHold', undefined, t)
  return (updated ? (await updated.getChatData()).flags.CoC7.load.isHeld : undefined)
}

/**
 * Render a saved combat card and return, for each button, whether it is disabled and whether it listens to clicks
 * @param {Function} card CoC7ChatCombatMelee or CoC7ChatCombatRanged
 * @param {object} message
 * @param {Array} actions the card's buttons
 * @param {boolean} isGM
 * @returns {object}
 */
async function renderButtons (card, message, actions, isGM) {
  userIsGM(isGM)
  const buttons = actions.map(action => ({
    dataset: { action },
    disabled: false,
    listens: false,
    parentElement: { dataset: { actorUuid: 'Actor.attacker' } },
    addEventListener () {
      this.listens = true
    }
  }))
  const html = {
    querySelectorAll: selector => (selector === '[data-action]' ? buttons : [])
  }
  await card._onRenderMessage(message, html, {}, ['Actor.attacker'])
  return Object.fromEntries(buttons.map(button => [button.dataset.action, { disabled: button.disabled, listens: button.listens }]))
}

const open = { disabled: false, listens: true }
const held = { disabled: true, listens: false }

test('a melee card opens held when the hold setting is on, and open when it is off', async (t) => {
  const options = { attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuid: 'Actor.target' }
  assert.equal(await opensHeld(CoC7ChatCombatMelee, options, true, t), true)
  assert.equal(await opensHeld(CoC7ChatCombatMelee, options, false, t), false)
})

test('a melee response card opens held when the hold setting is on', async (t) => {
  const options = { attackerCheck: { message: { id: 'attackerMessage' } }, attackerUuid: 'Actor.attacker', targetUuid: 'Actor.target', participant: CoC7ChatCombatMelee.participant.target }
  assert.equal(await opensHeld(CoC7ChatCombatMelee, options, true, t), true)
})

test('a ranged card opens held when the hold setting is on, and open when it is off', async (t) => {
  const options = { attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuids: [] }
  assert.equal(await opensHeld(CoC7ChatCombatRanged, options, true, t), true)
  assert.equal(await opensHeld(CoC7ChatCombatRanged, options, false, t), false)
})

test('the Keeper releases a held melee card, and a player cannot', async (t) => {
  assert.equal(await heldAfterRelease(CoC7ChatCombatMelee, savedMeleeMessage({ isHeld: true }), true, t), false)
  assert.equal(await heldAfterRelease(CoC7ChatCombatMelee, savedMeleeMessage({ isHeld: true }), false, t), undefined)
})

test('the Keeper releases a held ranged card, and a player cannot', async (t) => {
  assert.equal(await heldAfterRelease(CoC7ChatCombatRanged, savedRangedMessage({ isHeld: true }), true, t), false)
  assert.equal(await heldAfterRelease(CoC7ChatCombatRanged, savedRangedMessage({ isHeld: true }), false, t), undefined)
})

test('a card saved before the hold existed stays open', async (t) => {
  userIsGM(true)
  documents['Actor.attacker'] = actor()
  documents['Item.weapon'] = weapon(true)
  const melee = await clickCard(CoC7ChatCombatMelee, savedMeleeMessage(), 'toggleValue', 'isAutoSuccess', t)
  assert.equal((await melee.getChatData()).flags.CoC7.load.isHeld, false)
  const ranged = await clickCard(CoC7ChatCombatRanged, savedRangedMessage(), 'toggleValue', 'aiming', t)
  assert.equal((await ranged.getChatData()).flags.CoC7.load.isHeld, false)
})

test('a held melee card disables the player\'s rolls but not their response choice', async () => {
  const actions = ['attackerRoll', 'targetRoll', 'dodge']
  assert.deepEqual(await renderButtons(CoC7ChatCombatMelee, savedMeleeMessage({ isHeld: true }), actions, false), { attackerRoll: held, targetRoll: held, dodge: open })
})

test('a held melee card leaves the Keeper\'s rolls open, and a released one the player\'s', async () => {
  const actions = ['attackerRoll', 'targetRoll']
  assert.deepEqual(await renderButtons(CoC7ChatCombatMelee, savedMeleeMessage({ isHeld: true }), actions, true), { attackerRoll: open, targetRoll: open })
  assert.deepEqual(await renderButtons(CoC7ChatCombatMelee, savedMeleeMessage({ isHeld: false }), actions, false), { attackerRoll: open, targetRoll: open })
})

test('a held ranged card disables the player\'s shoot and roll but not the shot choice', async () => {
  const actions = ['range-initiator-roll', 'range-initiator-shoot', 'toggleValue']
  assert.deepEqual(await renderButtons(CoC7ChatCombatRanged, savedRangedMessage({ isHeld: true }), actions, false), { 'range-initiator-roll': held, 'range-initiator-shoot': held, toggleValue: open })
})

test('a held ranged card leaves the Keeper\'s shoot and roll open, and a released one the player\'s', async () => {
  const actions = ['range-initiator-roll', 'range-initiator-shoot']
  assert.deepEqual(await renderButtons(CoC7ChatCombatRanged, savedRangedMessage({ isHeld: true }), actions, true), { 'range-initiator-roll': open, 'range-initiator-shoot': open })
  assert.deepEqual(await renderButtons(CoC7ChatCombatRanged, savedRangedMessage({ isHeld: false }), actions, false), { 'range-initiator-roll': open, 'range-initiator-shoot': open })
})
