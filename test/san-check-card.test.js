import { documents, settings } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7SanCheckCard from '../coc7/apps/san-check-card.js'

settings.defaultCheckDifficulty = 'regular'
settings.rollMode = 'publicroll' // cspell:disable-line

/**
 * Create an actor with only what CoC7SanCheckCard.create reads
 * @param {number} san
 * @returns {object}
 */
function actor (san) {
  return {
    hasIndefInsane: false,
    system: {
      attribs: {
        san: {
          value: san
        }
      }
    }
  }
}

/**
 * Call game.CoC7.sanCheck the way hh-coc7-group-check does and return the card it posts
 * @param {object} sanData
 * @returns {CoC7SanCheckCard}
 */
async function sanCheck (sanData) {
  documents['Actor.investigator'] = actor(55)
  documents['Actor.creature'] = { name: 'Creature' }
  let card
  mock.method(CoC7SanCheckCard.prototype, 'toMessage', function () {
    card = this
  })
  await CoC7SanCheckCard.create('Actor.investigator', sanData)
  return card
}

// getTemplateData reads the whole actor for the chat card's text, which the saved flags do not need
mock.method(CoC7SanCheckCard.prototype, 'getTemplateData', async () => ({ actorUuid: 'Actor.investigator', sourceUuid: 'Actor.creature' }))

test('sanCheck posts a card with the loss, reason, source, difficulty and dice the group check asks for', async () => {
  const card = await sanCheck({ sanMin: '1', sanMax: '1D6', sanReason: 'Creature', sourceUuid: 'Actor.creature', difficulty: 2, poolModifier: -1 })
  assert.equal(await card.actor, documents['Actor.investigator'])
  assert.equal(await card.source, documents['Actor.creature'])
  const load = (await card.getChatData()).flags.CoC7.load
  assert.equal(load.as, 'CoC7SanCheckCard')
  assert.equal(load.sanMin, '1')
  assert.equal(load.sanMax, '1D6')
  assert.equal(load.sanReason, 'Creature')
  assert.equal(load.diceSanPool.difficulty, 2)
  assert.equal(load.diceSanPool.currentPoolModifier, -1)
})

test('sanCheck without a difficulty keeps the card at Regular', async () => {
  const card = await sanCheck({ sanMin: '0', sanMax: '1', sanReason: '', sourceUuid: '', difficulty: false, poolModifier: 0 })
  const load = (await card.getChatData()).flags.CoC7.load
  assert.equal(load.diceSanPool.difficulty, 1)
  assert.equal(load.diceSanPool.currentPoolModifier, 0)
})
