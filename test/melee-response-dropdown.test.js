import { documents } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatMelee from '../coc7/apps/chat-combat-melee.js'
import CoC7ChatDropdown from '../coc7/apps/chat-dropdown.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'

const warnings = []
globalThis.ui = {
  notifications: {
    warn: (message) => {
      warnings.push(message)
    }
  }
}

/**
 * Create a defender with only the items the response buttons read
 * @param {Array} items
 * @returns {object}
 */
function defender (items) {
  items.get = id => items.find(doc => doc.id === id)
  return { items }
}

/**
 * Click a response button on a saved melee response card
 * @param {string} action setFightBack or setManeuvers
 * @param {Array} items the defender's items
 * @param {object} t test context
 * @returns {object} the dropdown buttons, or the warnings when there was no dropdown
 */
async function respond (action, items, t) {
  documents['Actor.attacker'] = defender([])
  documents['Actor.target'] = defender(items)
  let buttons
  t.mock.method(CoC7ChatDropdown, 'makeDropdown', async (options) => {
    buttons = options.buttons
  })
  warnings.length = 0
  const message = {
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
          itemUuid: '',
          participant: CoC7ChatCombatMelee.participant.target,
          poolKeys: [],
          poolModifier: 0,
          responded: false,
          targetUuid: 'Actor.target'
        }
      }
    }
  }
  await CoC7ChatCombatMelee._onClickEvent({ currentTarget: { dataset: { action } } }, message)
  return { buttons: buttons?.map(button => button.name), warnings: [...warnings] }
}

const brawl = { id: 'brawl', name: 'Fighting (Brawl)', type: 'skill', system: { properties: { fighting: true }, value: 25 } }
const knuckles = { id: 'knuckles', name: 'Brass Knuckles', type: 'weapon', system: { properties: { rngd: false }, skill: { main: { id: 'brawl' } } } }
const revolver = { id: 'revolver', name: '.32 Revolver', type: 'weapon', system: { properties: { rngd: true }, skill: { main: { id: 'handgun' } } } }

test('Fight Back with no melee weapon warns instead of opening an empty dropdown', async (t) => {
  assert.deepEqual(await respond('setFightBack', [brawl, revolver], t), { buttons: undefined, warnings: ['CoC7.Errors.NoFightBackWeapon'] })
})

test('Fight Back lists the melee weapons', async (t) => {
  assert.deepEqual(await respond('setFightBack', [brawl, knuckles, revolver], t), { buttons: ['Brass Knuckles'], warnings: [] })
})

test('Maneuver with no Fighting skill warns instead of opening an empty dropdown', async (t) => {
  assert.deepEqual(await respond('setManeuvers', [revolver], t), { buttons: undefined, warnings: ['CoC7.Errors.NoManeuverSkill'] })
})

test('Maneuver lists the Fighting skills', async (t) => {
  assert.deepEqual(await respond('setManeuvers', [brawl, knuckles, revolver], t), { buttons: ['Fighting (Brawl)'], warnings: [] })
})
