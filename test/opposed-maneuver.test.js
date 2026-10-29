import { documents, settings } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatOpposedMessage from '../coc7/apps/chat-opposed-message.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'

settings.displayCheckSuccessLevel = true
settings.displayResultType = true
settings.opposedRollTieBreaker = false
game.users = []

/**
 * One actor's saved roll on an opposed card
 * @param {object} options
 * @param {integer} options.participant
 * @param {string} options.type skill or item
 * @param {boolean} options.isDodge
 * @param {boolean} options.isManeuver
 * @param {boolean|undefined} options.isNoDamage undefined for a card saved before the field existed
 * @param {boolean} options.wins
 * @returns {object}
 */
function savedRoll ({ participant, type, isDodge = false, isManeuver = false, isNoDamage, wins }) {
  const roll = {
    build: 0,
    dicePool: CoC7DicePool.newPool({ threshold: (wins ? 90 : 10) }).toObject(),
    fullName: '-',
    isDodge,
    isManeuver,
    isPushable: false,
    key: 'key',
    name: 'Actor',
    participant,
    portrait: '',
    shortName: type,
    skillUuid: false,
    tags: [],
    type
  }
  if (typeof isNoDamage !== 'undefined') {
    roll.isNoDamage = isNoDamage
  }
  return roll
}

/**
 * Load a rolled combat opposed card and return the Build tags and whether the winner rolls damage
 * @param {object} attacker savedRoll options
 * @param {object} defender savedRoll options
 * @param {object} t test context
 * @returns {object}
 */
async function opposed (attacker, defender, t) {
  // A rolled pool succeeds when its threshold is high, so tests choose the winner
  t.mock.getter(CoC7DicePool.prototype, 'diceGroups', function () {
    return [{ rolled: true, successLevel: (this.threshold > 50 ? CoC7DicePool.successLevel.hard : CoC7DicePool.successLevel.failure) }]
  })
  t.mock.getter(CoC7DicePool.prototype, 'isRolled', () => true)
  documents['Actor.attacker'] = {}
  documents['Actor.defender'] = {}
  const message = {
    id: 'message',
    flags: {
      CoC7: {
        load: {
          as: 'CoC7ChatOpposedMessage',
          actorRolls: {
            'Actor/attacker': savedRoll({ participant: CoC7ChatOpposedMessage.participant.attacker, ...attacker }),
            'Actor/defender': savedRoll({ participant: CoC7ChatOpposedMessage.participant.defender, ...defender })
          },
          advantage: CoC7ChatOpposedMessage.participant.none,
          cardOpen: false,
          isCombat: true,
          isRolling: false
        }
      }
    }
  }
  const data = await (await CoC7ChatOpposedMessage.loadFromMessage(message)).getTemplateData()
  return {
    build: Object.values(data.rollActors).map(r => r.participant + ':' + r.rolls[0].tags.length),
    winnerRollsDamage: data.winnerRollsDamage
  }
}

const attacker = CoC7ChatOpposedMessage.participant.attacker
const defender = CoC7ChatOpposedMessage.participant.defender

test('only maneuver rolls get the Build tag on a combat opposed card', async (t) => {
  // attacker: ordinary weapon, defender: Dodge
  assert.deepEqual((await opposed({ type: 'item', wins: true }, { type: 'skill', isDodge: true }, t)).build, [attacker + ':0', defender + ':0'])
  // attacker: Maneuver weapon, defender: non-Dodge skill
  assert.deepEqual((await opposed({ type: 'item', isManeuver: true, wins: true }, { type: 'skill' }, t)).build, [attacker + ':1', defender + ':1'])
})

test('a winning Maneuver weapon with no damage offers no damage', async (t) => {
  assert.equal((await opposed({ type: 'item', isManeuver: true, isNoDamage: true, wins: true }, { type: 'skill' }, t)).winnerRollsDamage, false)
})

test('a winning weapon with damage still offers damage', async (t) => {
  assert.equal((await opposed({ type: 'item', isManeuver: true, isNoDamage: false, wins: true }, { type: 'skill' }, t)).winnerRollsDamage, true)
  assert.equal((await opposed({ type: 'item', isNoDamage: true, wins: true }, { type: 'skill' }, t)).winnerRollsDamage, true)
  assert.equal((await opposed({ type: 'item', isManeuver: true, wins: true }, { type: 'skill' }, t)).winnerRollsDamage, true)
})
