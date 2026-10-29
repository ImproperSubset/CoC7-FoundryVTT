import { documents, settings } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7RollNormalize from '../coc7/apps/roll-normalize.js'

settings.defaultCheckDifficulty = 'regular'
settings.rollMode = 'publicroll' // cspell:disable-line

const errors = []
globalThis.ui = {
  notifications: {
    error: (message) => {
      errors.push(message)
    },
    warn: () => {}
  }
}

/**
 * Normalize a right-click on an actor's weapon
 * @param {string} cardType
 * @returns {object} the normalized roll, or false, and the errors shown
 */
async function rightClickWeapon (cardType) {
  documents['Item.weapon'] = { type: 'weapon', name: 'Brass Knuckles', uuid: 'Item.weapon', flags: {}, system: { bonusDice: 0 } }
  const actor = { uuid: 'Actor.actor', name: 'Actor', hasPlayerOwner: false, system: { infos: { type: '' }, special: {} } }
  errors.length = 0
  const config = await CoC7RollNormalize.normalizeRequest({ actor, cardType, itemUuid: 'Item.weapon', rollType: CoC7RollNormalize.ROLL_TYPE.SKILL })
  return { rollType: config?.rollType, key: config?.key, errors: [...errors] }
}

test('a weapon can be added to an opposed or combined card', async () => {
  for (const cardType of [CoC7RollNormalize.CARD_TYPE.OPPOSED, CoC7RollNormalize.CARD_TYPE.COMBINED]) {
    assert.deepEqual(await rightClickWeapon(cardType), { rollType: CoC7RollNormalize.ROLL_TYPE.WEAPON, key: 'Item.weapon', errors: [] })
  }
})

test('a weapon still cannot be rolled on a normal card', async () => {
  assert.deepEqual(await rightClickWeapon(CoC7RollNormalize.CARD_TYPE.NORMAL), { rollType: undefined, key: undefined, errors: ['CoC7.ErrorInvalidFormula'] })
})
