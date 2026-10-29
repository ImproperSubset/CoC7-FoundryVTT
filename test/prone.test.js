import { documents, settings } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatMelee from '../coc7/apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../coc7/apps/chat-combat-ranged.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'
import CoC7Utilities from '../coc7/apps/utilities.js'

settings.ddtRuleShootingWithOffHand = false
settings.disregardAmmo = false
settings.disregardUsePerRound = false
settings.displayActorOnCard = false
settings.distanceTheatreOfTheMind = true
settings.pulpRuleLuckMalfunction = false
settings.rollMode = 'publicroll' // cspell:disable-line

let created
globalThis.ChatMessage = {
  create: async (chatData) => {
    created = chatData
  }
}
globalThis.canvas = {
  grid: {
    units: 'ft'
  },
  scene: {
    uuid: 'Scene.scene'
  }
}

/**
 * Create an actor with only the data the combat cards read
 * @param {object} options
 * @param {boolean} options.prone
 * @param {Array} options.disable dice pool keys a talent disables
 * @param {boolean} options.token
 * @returns {object}
 */
function actor ({ prone = false, disable = [], token = false } = {}) {
  const items = disable.map(key => ({
    type: 'talent',
    system: {
      adjustments: [{
        type: 'disableCombatPool',
        config: {
          disable: key
        }
      }]
    }
  }))
  items.get = () => undefined
  return {
    type: 'character',
    name: 'Actor',
    img: '',
    isToken: false,
    items,
    system: {
      attribs: {
        build: { value: 0 },
        lck: { value: 50 },
        mov: { value: 8 }
      },
      characteristics: {
        dex: { value: 60 }
      }
    },
    getDependentTokens: () => (token ? [{ object: {} }] : []),
    hasConditionStatus: key => key === 'prone' && prone
  }
}

/**
 * Create a weapon with only the data the combat cards open with
 * @param {boolean} rngd
 * @returns {object}
 */
function weapon (rngd) {
  return {
    type: 'weapon',
    system: {
      bonusDice: 0,
      properties: {
        auto: false,
        rngd
      },
      singleShot: true,
      skill: {
        main: {
          id: 'skill'
        }
      },
      skillAlternative: null,
      baseRange: async () => 15,
      longRange: async () => 30,
      extremeRange: async () => 60
    }
  }
}

/**
 * Open a ranged combat card and return the targets it saves
 * @param {object} options
 * @param {object} options.shooter actor options for the attacker
 * @param {Array} options.targets actor options for each target
 * @param {number|undefined} options.yards distance between the tokens, undefined for no tokens
 * @param {object} t test context
 * @returns {Array}
 */
async function rangedTargets ({ shooter = {}, targets = [{}], yards }, t) {
  t.mock.method(CoC7ChatCombatRanged.prototype, 'getTemplateData', async () => ({}))
  if (typeof yards !== 'undefined') {
    t.mock.method(CoC7Utilities, 'distanceBetweenTokens', () => ({ roundedDistance: yards, yards }))
  }
  const token = typeof yards !== 'undefined'
  documents['Actor.attacker'] = actor({ ...shooter, token })
  documents['Item.weapon'] = weapon(true)
  const targetUuids = targets.map((options, offset) => {
    documents['Actor.target' + offset] = actor({ ...options, token })
    return 'Actor.target' + offset
  })
  created = undefined
  await CoC7ChatCombatRanged.createMessage({ attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuids })
  return created.flags.CoC7.load.targets
}

/**
 * Click a control on a saved ranged combat card and return its first target
 * @param {Array} targets saved targets
 * @param {string} action
 * @param {string} set
 * @param {object} t test context
 * @returns {object}
 */
async function rangedClick (targets, action, set, t) {
  t.mock.method(CoC7ChatCombatRanged.prototype, 'getTemplateData', async () => ({}))
  let updated
  t.mock.method(CoC7ChatCombatRanged.prototype, 'updateMessage', function () {
    updated = this
  })
  documents['Actor.attacker'] = actor()
  documents['Item.weapon'] = weapon(true)
  const message = {
    id: 'message',
    flags: {
      CoC7: {
        load: {
          as: 'CoC7ChatCombatRanged',
          actorUuid: 'Actor.attacker',
          aiming: false,
          burst: false,
          damage: [],
          damageDealt: false,
          damageRolled: false,
          fullAuto: false,
          itemUuid: 'Item.weapon',
          multipleShots: false,
          sceneUuid: '',
          shots: [],
          singleShot: true,
          targets,
          totalBulletsFired: 0,
          volleyMax: 0,
          volleySize: 0,
          weaponRolled: false
        }
      }
    }
  }
  const event = {
    currentTarget: {
      dataset: { action, set },
      closest: () => ({ dataset: { offset: 0 } })
    }
  }
  await CoC7ChatCombatRanged._onClickEvent(event, message)
  return (await updated.getChatData()).flags.CoC7.load.targets[0]
}

/**
 * Open a melee combat card and return the dice pool keys it saves
 * @param {object} options actor options for the target
 * @param {object} t test context
 * @returns {Array}
 */
async function meleePoolKeys (options, t) {
  t.mock.method(CoC7ChatCombatMelee.prototype, 'getTemplateData', async () => ({}))
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor(options)
  documents['Item.weapon'] = weapon(false)
  created = undefined
  await CoC7ChatCombatMelee.createMessage({ attackerUuid: 'Actor.attacker', itemUuid: 'Item.weapon', targetUuid: 'Actor.target' })
  return created.flags.CoC7.load.poolKeys
}

test('the Prone reasons appear only when the Pulp Prone rule is on', () => {
  settings.pulpRuleProne = false
  assert.equal(Object.keys(CoC7Utilities.dicePoolReasons({ forMelee: true, forRanged: true })).filter(k => k.startsWith('prone')).length, 0)
  settings.pulpRuleProne = true
  assert.deepEqual(Object.keys(CoC7Utilities.dicePoolReasons({ forMelee: true })).filter(k => k.startsWith('prone')), ['proneTarget'])
  assert.deepEqual(Object.keys(CoC7Utilities.dicePoolReasons({ forRanged: true })).filter(k => k.startsWith('prone')), ['proneTargetRanged', 'proneShooter'])
})

test('a ranged card ticks the penalty for a prone target at normal range', async (t) => {
  settings.pulpRuleProne = true
  const targets = await rangedTargets({ targets: [{ prone: true }, {}], yards: 10 }, t)
  assert.deepEqual(targets.map(target => target.poolKeys), [['proneTargetRanged'], []])
  assert.deepEqual(targets.map(target => target.proneTarget), [true, false])
})

test('a ranged card ticks the penalty for a prone target without tokens', async (t) => {
  settings.pulpRuleProne = true
  const targets = await rangedTargets({ targets: [{ prone: true }] }, t)
  assert.deepEqual(targets[0].poolKeys, ['proneTargetRanged'])
})

test('a ranged card leaves out the penalty for a prone target at point blank range', async (t) => {
  settings.pulpRuleProne = true
  const targets = await rangedTargets({ targets: [{ prone: true }], yards: 2 }, t)
  assert.deepEqual(targets[0].poolKeys, ['pointBlankRange'])
  assert.equal(targets[0].proneTarget, true)
})

test('a ranged card ticks the bonus for a prone shooter on every target', async (t) => {
  settings.pulpRuleProne = true
  const targets = await rangedTargets({ shooter: { prone: true }, targets: [{}, {}], yards: 10 }, t)
  assert.deepEqual(targets.map(target => target.poolKeys), [['proneShooter'], ['proneShooter']])
})

test('a ranged card ticks no Prone reasons when the rule is off', async (t) => {
  settings.pulpRuleProne = false
  const targets = await rangedTargets({ shooter: { prone: true }, targets: [{ prone: true }], yards: 10 }, t)
  assert.deepEqual(targets[0].poolKeys, [])
  assert.equal(targets[0].proneTarget, false)
})

test('a talent that disables a Prone reason keeps it off the ranged card', async (t) => {
  settings.pulpRuleProne = true
  const targets = await rangedTargets({ shooter: { prone: true, disable: ['proneShooter'] }, targets: [{ prone: true, disable: ['proneTargetRanged'] }], yards: 10 }, t)
  assert.deepEqual(targets[0].poolKeys, [])
  assert.equal(targets[0].proneTarget, false)
})

/**
 * A saved target of a ranged card
 * @param {Array} poolKeys
 * @param {boolean} proneTarget
 * @returns {object}
 */
function savedTarget (poolKeys, proneTarget) {
  return {
    active: true,
    uuid: '',
    baseRange: !poolKeys.includes('pointBlankRange'),
    longRange: false,
    extremeRange: false,
    outOfRange: false,
    poolKeys,
    poolModifier: 0,
    proneTarget
  }
}

test('turning point blank on removes the prone target penalty', async (t) => {
  settings.pulpRuleProne = true
  const target = await rangedClick([savedTarget(['proneTargetRanged'], true)], 'toggleTargetKey', 'pointBlankRange', t)
  assert.deepEqual(target.poolKeys, ['pointBlankRange'])
})

test('turning point blank off puts the prone target penalty back', async (t) => {
  settings.pulpRuleProne = true
  const target = await rangedClick([savedTarget(['pointBlankRange'], true)], 'toggleTargetKey', 'pointBlankRange', t)
  assert.deepEqual(target.poolKeys, ['proneTargetRanged'])
})

test('choosing a range band puts the prone target penalty back', async (t) => {
  settings.pulpRuleProne = true
  const target = await rangedClick([savedTarget(['pointBlankRange'], true)], 'toggleTargetValue', 'longRange', t)
  assert.deepEqual(target.poolKeys, ['proneTargetRanged'])
  assert.equal(target.longRange, true)
})

test('point blank changes leave the penalty off a target that is not prone', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual((await rangedClick([savedTarget(['pointBlankRange'], false)], 'toggleTargetKey', 'pointBlankRange', t)).poolKeys, [])
  assert.deepEqual((await rangedClick([savedTarget(['pointBlankRange'], false)], 'toggleTargetValue', 'baseRange', t)).poolKeys, [])
})

test('a ranged card saved before the Prone rule keeps the penalty off', async (t) => {
  settings.pulpRuleProne = true
  const old = savedTarget(['pointBlankRange'], false)
  delete old.proneTarget
  assert.deepEqual((await rangedClick([old], 'toggleTargetKey', 'pointBlankRange', t)).poolKeys, [])
})

test('a melee card ticks the bonus for a prone target', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await meleePoolKeys({ prone: true }, t), ['proneTarget'])
})

test('a melee card ticks nothing for a target that is not prone', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await meleePoolKeys({}, t), [])
})

test('a melee card ticks nothing when the Prone rule is off', async (t) => {
  settings.pulpRuleProne = false
  assert.deepEqual(await meleePoolKeys({ prone: true }, t), [])
})

test('a talent that disables the Prone reason keeps it off the melee card', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await meleePoolKeys({ prone: true, disable: ['proneTarget'] }, t), [])
})

/**
 * Open a melee response card and return the dice pool keys it saves
 * @param {object} options actor options for the attacker
 * @param {object} t test context
 * @returns {Array}
 */
async function responsePoolKeys (options, t) {
  t.mock.method(CoC7ChatCombatMelee.prototype, 'getTemplateData', async () => ({}))
  documents['Actor.attacker'] = actor(options)
  documents['Actor.target'] = actor()
  created = undefined
  await CoC7ChatCombatMelee.createMessage({ attackerCheck: { message: { id: 'attackerMessage' } }, attackerUuid: 'Actor.attacker', targetUuid: 'Actor.target', participant: CoC7ChatCombatMelee.participant.target })
  return created.flags.CoC7.load.poolKeys
}

test('a response card ticks the bonus when the attacker is prone', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await responsePoolKeys({ prone: true }, t), ['proneTarget'])
})

test('a response card ticks nothing when the attacker is not prone', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await responsePoolKeys({}, t), [])
})

test('a response card ticks nothing when the Prone rule is off', async (t) => {
  settings.pulpRuleProne = false
  assert.deepEqual(await responsePoolKeys({ prone: true }, t), [])
})

test('a talent on the prone attacker keeps the bonus off the response card', async (t) => {
  settings.pulpRuleProne = true
  assert.deepEqual(await responsePoolKeys({ prone: true, disable: ['proneTarget'] }, t), [])
})

/**
 * Load a saved melee card and return what it shows and rolls with
 * @param {object} options
 * @param {integer} options.participant
 * @param {string} options.response weapon, skill, dodge or none
 * @param {Array} options.poolKeys
 * @returns {object}
 */
async function meleeCard ({ participant, response, poolKeys }) {
  documents['Actor.attacker'] = actor()
  documents['Actor.target'] = actor()
  documents['Item.response'] = {
    type: (response === 'weapon' ? 'weapon' : 'skill'),
    name: response,
    img: 'response.webp',
    uuid: 'Item.response',
    system: {
      description: { value: '' },
      isDodge: response === 'dodge',
      properties: { spcl: false },
      skill: { main: { id: 'skill' }, alternativ: { id: '' } },
      skillMain: undefined,
      value: 50
    }
  }
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
          isNoResponse: response === 'none',
          itemUuid: (response === 'none' ? '' : 'Item.response'),
          participant,
          poolKeys,
          poolModifier: 0,
          responded: false,
          targetUuid: 'Actor.target'
        }
      }
    }
  }
  const data = await (await CoC7ChatCombatMelee.loadFromMessage(message)).getTemplateData()
  return {
    finalPoolModifier: data.finalPoolModifier,
    poolBonus: data.poolBonus.map(row => row.key).sort()
  }
}

for (const [response, finalPoolModifier, poolBonus] of [
  ['weapon', 1, ['proneTarget']],
  ['skill', 1, ['proneTarget']],
  ['dodge', 0, []],
  ['none', 0, []]
]) {
  test('a response card with the attacker prone and a ' + response + ' response', async () => {
    settings.pulpRuleProne = true
    assert.deepEqual(await meleeCard({ participant: CoC7ChatCombatMelee.participant.target, response, poolKeys: ['proneTarget'] }), { finalPoolModifier, poolBonus })
  })
}

test('a response card with no Prone bonus ticked fights back without bonus dice', async () => {
  settings.pulpRuleProne = true
  assert.deepEqual(await meleeCard({ participant: CoC7ChatCombatMelee.participant.target, response: 'weapon', poolKeys: [] }), { finalPoolModifier: 0, poolBonus: ['proneTarget'] })
})

test('a response card shows no Prone bonus when the rule is off', async () => {
  settings.pulpRuleProne = false
  assert.deepEqual(await meleeCard({ participant: CoC7ChatCombatMelee.participant.target, response: 'weapon', poolKeys: ['proneTarget'] }), { finalPoolModifier: 0, poolBonus: [] })
})

test('an attack card still shows every melee bonus and counts the Prone bonus', async () => {
  settings.pulpRuleProne = true
  assert.deepEqual(await meleeCard({ participant: CoC7ChatCombatMelee.participant.initiator, response: 'weapon', poolKeys: ['proneTarget'] }), { finalPoolModifier: 1, poolBonus: ['outnumbered', 'proneTarget', 'surprised'] })
})
