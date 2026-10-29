import { settings } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7Combat from '../coc7/apps/combat.js'
import CoC7ModelsActorDocumentClass from '../coc7/models/actor/document-class.js'

settings.initiativeRule = 'basic'

/**
 * Create a combatant with only what the gun toggle reads
 * @param {object} options
 * @param {boolean} options.hasGun
 * @param {boolean} options.hidden
 * @param {number} options.initiative
 * @returns {object}
 */
function combatant ({ hasGun, hidden, initiative }) {
  const flags = { hasGun }
  return {
    id: 'combatant',
    actor: {
      isOwner: true,
      rollInitiative: mock.fn(async () => 99)
    },
    getFlag: (scope, key) => flags[key],
    hidden,
    initiative,
    setFlag: async (scope, key, value) => {
      flags[key] = value
    }
  }
}

/**
 * Click the gun toggle on a combatant in the combat tracker
 * @param {object} target
 */
async function toggleGun (target) {
  game.combat = {
    combatants: {
      get: () => target
    },
    setInitiative: mock.fn()
  }
  await CoC7Combat._onToggleGun({
    currentTarget: {
      closest: () => ({ dataset: { combatantId: target.id } })
    },
    preventDefault: () => {},
    stopPropagation: () => {}
  })
}

test('rollInitiative works without an options argument', async () => {
  const actor = { system: { characteristics: { dex: { value: 60 } } } }
  assert.equal(await CoC7ModelsActorDocumentClass.prototype.rollInitiative.call(actor, true), 110)
  assert.equal(await CoC7ModelsActorDocumentClass.prototype.rollInitiative.call(actor), 60)
})

test('drawing a gun rerolls initiative, hidden when the combatant is hidden', async () => {
  const target = combatant({ hasGun: false, hidden: true, initiative: 50 })
  await toggleGun(target)
  assert.deepEqual(target.actor.rollInitiative.mock.calls[0].arguments, [true, { hidden: true }])
  assert.deepEqual(game.combat.setInitiative.mock.calls[0].arguments, ['combatant', 99])
})

test('holstering a gun rerolls initiative, shown when the combatant is not hidden', async () => {
  const target = combatant({ hasGun: true, hidden: false, initiative: 120 })
  await toggleGun(target)
  assert.deepEqual(target.actor.rollInitiative.mock.calls[0].arguments, [false, { hidden: false }])
  assert.deepEqual(game.combat.setInitiative.mock.calls[0].arguments, ['combatant', 99])
})
