import { documents } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombinedMessage from '../coc7/apps/chat-combined-message.js'
import CoC7ChatOpposedMessage from '../coc7/apps/chat-opposed-message.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'

game.user = { isGM: true }
game.users = []
documents['Actor.actor'] = {}

/**
 * One actor's saved roll on a card
 * @returns {object}
 */
function savedRoll () {
  return {
    build: 0,
    dicePool: CoC7DicePool.newPool({ threshold: 50 }).toObject(),
    fullName: '-',
    isPushable: false,
    key: 'key',
    name: 'Actor',
    participant: CoC7ChatOpposedMessage.participant.attacker,
    portrait: '',
    shortName: '-',
    skillUuid: false,
    tags: [],
    type: 'skill'
  }
}

/**
 * Put one open card in the chat log
 * @param {object} load
 */
function chatLog (load) {
  globalThis.ui = {
    chat: {
      collection: [{
        id: 'message',
        timestamp: Date.now(),
        flags: {
          CoC7: {
            load: {
              actorRolls: { 'Actor/actor': savedRoll() },
              actorUuids: ['Actor.actor'],
              cardOpen: true,
              ...load
            }
          }
        }
      }]
    }
  }
}

test('a roll added after an opposed card has rolled starts a new card', async (t) => {
  chatLog({ as: 'CoC7ChatOpposedMessage', advantage: CoC7ChatOpposedMessage.participant.none, isCombat: false, isRolling: true })
  const created = t.mock.method(CoC7ChatOpposedMessage, 'createGroupMessage', async () => {})
  const options = { rollRequisites: ['Actor.actor#skill#key'] }
  await CoC7ChatOpposedMessage.joinGroupMessage(options)
  assert.equal(created.mock.callCount(), 1)
  assert.equal(created.mock.calls[0].arguments[0], options)
})

test('a roll added after a combined card has rolled starts a new card', async (t) => {
  chatLog({ as: 'CoC7ChatCombinedMessage', combinedFixed: false, combinedType: 'any', isCombat: false })
  t.mock.method(CoC7ChatCombinedMessage, 'parseRolls', async () => { return { actorUuid: 'Actor.actor', roll: {} } })
  t.mock.getter(CoC7DicePool.prototype, 'isRolled', () => true)
  const created = t.mock.method(CoC7ChatCombinedMessage, 'createGroupMessage', async () => {})
  const options = { rollRequisites: ['Actor.actor#skill#key'] }
  await CoC7ChatCombinedMessage.joinGroupMessage(options)
  assert.equal(created.mock.callCount(), 1)
  assert.equal(created.mock.calls[0].arguments[0], options)
})
