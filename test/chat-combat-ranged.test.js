import { documents, settings } from './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoC7ChatCombatRanged from '../coc7/apps/chat-combat-ranged.js'

settings.ddtRuleShootingWithOffHand = false
settings.disregardAmmo = false
settings.disregardUsePerRound = false
settings.displayActorOnCard = false
settings.pulpRuleLuckMalfunction = false

/**
 * Create a weapon with only the data the combat card reads
 * @param {boolean} shotgun
 * @returns {object}
 */
function weapon (shotgun) {
  return {
    name: (shotgun ? '20-gauge Shotgun' : '.45 Automatic'),
    img: '',
    uuid: 'Item.weapon',
    system: {
      ammo: 7,
      description: {
        value: ''
      },
      properties: {
        shotgun,
        spcl: false
      },
      range: (shotgun
        ? {
          normal: { damage: '2D6' },
          long: { damage: '1D6' },
          extreme: { damage: '1D3' }
        }
        : {
          normal: { damage: '1D10+2' },
          long: { damage: null },
          extreme: { damage: null }
        }),
      usesPerRound: {
        max: 1
      }
    }
  }
}

/**
 * Load a combat card with one target and return that target's template data
 * @param {boolean} shotgun
 * @param {string} band normal, long or extreme
 * @returns {object}
 */
async function target (shotgun, band) {
  documents['Actor.attacker'] = undefined
  documents['Item.weapon'] = weapon(shotgun)
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
          targets: [{
            uuid: '',
            extremeRange: band === 'extreme',
            longRange: band === 'long',
            outOfRange: false,
            poolKeys: [],
            poolModifier: 0
          }],
          totalBulletsFired: 0,
          volleyMax: 0,
          volleySize: 0,
          weaponRolled: false
        }
      }
    }
  }
  const card = await CoC7ChatCombatRanged.loadFromMessage(message)
  const data = await card.getTemplateData()
  return {
    damage: data.targets[0].damage,
    difficulty: data.targets[0].difficulty
  }
}

for (const [shotgun, band, damage, difficulty] of [
  [false, 'normal', '1D10+2', 1],
  [false, 'long', '1D10+2', 2],
  [false, 'extreme', '1D10+2', 3],
  [true, 'normal', '2D6', 1],
  [true, 'long', '1D6', 1],
  [true, 'extreme', '1D3', 1]
]) {
  test((shotgun ? 'shotgun' : 'pistol') + ' at ' + band + ' range', async () => {
    assert.deepEqual(await target(shotgun, band), { damage, difficulty })
  })
}
