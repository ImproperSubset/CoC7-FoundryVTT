import { settings } from './foundry-stubs.js'
import CoC7DicePool from '../coc7/apps/dice-pool.js'

settings.ddtRuleShootingWithOffHand = false
settings.disregardAmmo = false
settings.disregardUsePerRound = false
settings.displayActorOnCard = false
settings.distanceTheatreOfTheMind = true
settings.holdCombatCards = false
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
 * Forget the last card created
 */
export function clearCreatedCard () {
  created = undefined
}

/**
 * The chat data of the last card created
 * @returns {object|undefined}
 */
export function createdCard () {
  return created
}

/**
 * Create an actor with only the data the combat cards read
 * @param {object} options
 * @param {boolean} options.prone
 * @param {Array} options.disable dice pool keys a talent disables
 * @param {Array} options.show talent adjustments that show a talent on combat cards
 * @param {boolean} options.token
 * @returns {object}
 */
export function actor ({ prone = false, disable = [], show = [], token = false } = {}) {
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
  })).concat(show.map(type => ({
    type: 'talent',
    link: type,
    effects: [],
    system: {
      adjustments: [{
        type,
        config: {}
      }]
    }
  })))
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
export function weapon (rngd) {
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
 * Create a saved melee combat card message
 * @param {object} load saved values that replace the defaults
 * @returns {object}
 */
export function savedMeleeMessage (load = {}) {
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
          itemUuid: '',
          participant: 0,
          poolKeys: [],
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
 * Create a saved ranged combat card message
 * @param {object} load saved values that replace the defaults
 * @returns {object}
 */
export function savedRangedMessage (load = {}) {
  return {
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
          targets: [],
          totalBulletsFired: 0,
          volleyMax: 0,
          volleySize: 0,
          weaponRolled: false,
          ...load
        }
      }
    }
  }
}

/**
 * Click a control on a saved combat card and return the card it saves, or undefined when it saves none
 * @param {Function} card CoC7ChatCombatMelee or CoC7ChatCombatRanged
 * @param {object} message
 * @param {string} action
 * @param {string} set
 * @param {object} t test context
 * @returns {object|undefined}
 */
export async function clickCard (card, message, action, set, t) {
  t.mock.method(card.prototype, 'getTemplateData', async () => ({}))
  let updated
  t.mock.method(card.prototype, 'updateMessage', function () {
    updated = this
  })
  const event = {
    currentTarget: {
      dataset: { action, set },
      closest: () => ({ dataset: { offset: 0 } })
    }
  }
  await card._onClickEvent(event, message)
  return updated
}
