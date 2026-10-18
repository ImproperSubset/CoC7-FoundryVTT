// cSpell:words cthulhumancer
import { FOLDER_ID } from '../constants.js'
import CoC7ModelsItemSkillSystem from '../models/item/skill-system.js'
import CoC7Utilities from './utilities.js'
import deprecated from '../deprecated.js'

export default class CoC7CthulhumancerActorImporter {
  /**
   * Is this a Cthulhumancer Foundry export
   * @param {object} data
   * @returns {boolean}
   */
  static isCthulhumancer (data) {
    return typeof data?._cthulhumancer === 'object' && data._cthulhumancer !== null && data.type === 'character' && Array.isArray(data.items)
  }

  /**
   * Convert Cthulhumancer skill name to system skill name
   * @param {string} name
   * @returns {string}
   */
  static makeSkillName (name) {
    return name.replace(/\s+/g, ' ').trim().replace(/^Art\s*\/\s*Craft\b/i, 'Art/Craft')
  }

  /**
   * Add a duplicate skill's points and flags to the skill, keeping the higher base
   * @param {object} skill
   * @param {object} duplicate
   */
  static mergeSkill (skill, duplicate) {
    const adjustments = duplicate.system?.adjustments ?? {}
    for (const key in adjustments) {
      const current = parseInt(skill.system?.adjustments?.[key], 10) || 0
      const added = parseInt(adjustments[key], 10) || 0
      foundry.utils.setProperty(skill, 'system.adjustments.' + key, key === 'base' ? Math.max(current, added) : current + added)
    }
    const flags = duplicate.system?.flags ?? {}
    for (const key in flags) {
      if (flags[key]) {
        foundry.utils.setProperty(skill, 'system.flags.' + key, true)
      }
    }
  }

  /**
   * Skill has no points beyond its base and is not an occupation or archetype skill
   * @param {object} skill
   * @returns {boolean}
   */
  static isAtDefault (skill) {
    const adjustments = skill.system?.adjustments ?? {}
    const flags = skill.system?.flags ?? {}
    return !Object.keys(adjustments).some(k => k !== 'base' && (parseInt(adjustments[k], 10) || 0) !== 0) && !flags.occupation && !flags.archetype
  }

  /**
   * Skill is on every investigator sheet, so it is kept when at its default
   * @param {object} entry
   * @param {integer} edu
   * @returns {boolean}
   */
  static isStandardSkill (entry, edu) {
    if (['fighting (brawl)', 'firearms (handgun)', 'firearms (rifle/shotgun)'].includes(entry.name.toLocaleLowerCase())) {
      return true
    }
    return CoC7CthulhumancerActorImporter.isOwnLanguage(entry, edu)
  }

  /**
   * Language whose base is EDU is the investigator's own language
   * @param {object} entry
   * @param {integer} edu
   * @returns {boolean}
   */
  static isOwnLanguage (entry, edu) {
    return /^language\s*\(/i.test(entry.name) && typeof edu === 'number' && parseInt(entry.skill.system?.adjustments?.base, 10) === edu
  }

  /**
   * Merge duplicate skills, Cthulhumancer can spend points on several skills of the same name, and remove generic skills with no points spent that also have a specialization, and specializations with no points spent that are neither on every investigator sheet nor added by the player
   * @param {Array} cthulhumancerSkills
   * @param {integer} [edu]
   * @param {Array} [customNames] Lower case names of skills the player added
   * @returns {Array}
   */
  static filterSkills (cthulhumancerSkills, edu, customNames = []) {
    const byName = {}
    for (const skill of cthulhumancerSkills) {
      const name = CoC7CthulhumancerActorImporter.makeSkillName(skill.name)
      const key = name.toLocaleLowerCase()
      if (typeof byName[key] === 'undefined') {
        byName[key] = { name, skill: foundry.utils.duplicate(skill) }
      } else {
        CoC7CthulhumancerActorImporter.mergeSkill(byName[key].skill, skill)
      }
    }
    const keys = Object.keys(byName)
    return Object.entries(byName).filter(([key, entry]) => {
      if (!CoC7CthulhumancerActorImporter.isAtDefault(entry.skill) || customNames.includes(key)) {
        return true
      }
      if (key.indexOf('(') > -1) {
        return CoC7CthulhumancerActorImporter.isStandardSkill(entry, edu)
      }
      return !keys.some(k => k.startsWith(key + ' ('))
    }).map(([, entry]) => entry)
  }

  /**
   * Create skill objects from compendium matches, keeping Cthulhumancer's values
   * @param {Array} cthulhumancerSkills
   * @param {object} options
   * @param {string} options.source
   * @param {integer} [options.edu]
   * @param {Array} [options.customNames]
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractSkills (cthulhumancerSkills, options, progressBar) {
    const lookFor = CoC7CthulhumancerActorImporter.filterSkills(cthulhumancerSkills, options.edu, options.customNames)
    const foundItems = await CoC7Utilities.guessItems('skill', lookFor.map(i => i.name), { source: options.source, fallbackAny: true })
    const skills = []
    for (const entry of lookFor) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      let cloned
      if (typeof foundItems[entry.name] !== 'undefined') {
        cloned = foundry.utils.duplicate(foundItems[entry.name])
        // Several skills can share one (Any) compendium entry, so each copy needs a fresh _id
        for (const key of ['_id', '_stats', 'folder', 'sort', 'ownership']) {
          delete cloned[key]
        }
        const parts = CoC7ModelsItemSkillSystem.guessNameParts(entry.name)
        foundry.utils.setProperty(cloned, 'name', parts.name)
        foundry.utils.setProperty(cloned, 'system.skillName', parts.system.skillName)
        foundry.utils.setProperty(cloned, 'system.specialization', parts.system.specialization)
        if (cloned.system.properties?.requiresname ?? false) {
          foundry.utils.setProperty(cloned, 'system.properties.requiresname', false)
        }
        if (cloned.system.properties?.picknameonly ?? false) {
          foundry.utils.setProperty(cloned, 'system.properties.picknameonly', false)
        }
      } else {
        cloned = CoC7ModelsItemSkillSystem.emptyObject({
          name: entry.name
        })
      }
      foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.skill.' + CoC7Utilities.toKebabCase(cloned.name))
      if ((cloned.system.base ?? '') === '') {
        foundry.utils.setProperty(cloned, 'system.base', entry.skill.system?.base ?? '')
      }
      if (typeof entry.skill.system?.adjustments === 'object') {
        foundry.utils.setProperty(cloned, 'system.adjustments', foundry.utils.duplicate(entry.skill.system.adjustments))
      }
      if (typeof entry.skill.system?.flags === 'object') {
        foundry.utils.setProperty(cloned, 'system.flags', foundry.utils.duplicate(entry.skill.system.flags))
      }
      if (CoC7CthulhumancerActorImporter.isOwnLanguage(entry, options.edu)) {
        foundry.utils.setProperty(cloned, 'system.properties.own', true)
      }
      // Weapon attacks are never pushable, so this only allows pushing plain Throw rolls
      if (cloned.flags[FOLDER_ID].cocidFlag.id === 'i.skill.throw') {
        foundry.utils.setProperty(cloned, 'system.properties.push', true)
      }
      skills.push(cloned)
    }
    return skills
  }

  /**
   * Rules for Pulp talents the system can apply, by lower case name
   * @returns {object}
   */
  static get talentRules () {
    return {
      'quick healer': {
        changes: [{ key: 'system.config.naturalHealing', value: 1 }]
      },
      endurance: {
        changes: [{ key: 'system.characteristics.con.bonusDice', value: 1 }]
      },
      'beady eye': {
        adjustments: [
          { type: 'disableCombatPool', config: { disable: 'sizeSmall' } },
          { type: 'disableCombatPool', config: { disable: 'inMelee' } }
        ]
      }
    }
  }

  /**
   * Add the talent's rule as an Active Effect or talent adjustments, unless the talent already has its own
   * @param {object} talent
   */
  static applyTalentRule (talent) {
    const rule = CoC7CthulhumancerActorImporter.talentRules[talent.name.toLocaleLowerCase()]
    if (typeof rule === 'undefined') {
      return
    }
    if (rule.changes && !(talent.effects ?? []).length) {
      /* // FoundryVTT V13 */
      if (game.release.generation < 14) {
        talent.effects = [{
          name: talent.name,
          img: 'icons/svg/aura.svg',
          changes: rule.changes.map(c => ({ key: c.key, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: c.value }))
        }]
      } else {
        talent.effects = [{
          name: talent.name,
          img: 'icons/svg/aura.svg',
          system: {
            changes: rule.changes.map(c => ({ key: c.key, type: 'add', value: c.value }))
          }
        }]
      }
    }
    if (rule.adjustments && !(talent.system?.adjustments ?? []).length) {
      foundry.utils.setProperty(talent, 'system.adjustments', foundry.utils.duplicate(rule.adjustments))
    }
  }

  /**
   * Replace non skill items with compendium matches by type and name, items without a match are kept as exported
   * @param {Array} cthulhumancerItems
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractItems (cthulhumancerItems, options, progressBar) {
    const byType = {}
    for (const item of cthulhumancerItems) {
      if (typeof byType[item.type] === 'undefined') {
        byType[item.type] = []
      }
      byType[item.type].push(item.name)
    }
    const foundItems = {}
    for (const type in byType) {
      foundItems[type] = await CoC7Utilities.guessItems(type, byType[type], { source: options.source })
    }
    const items = []
    for (const item of cthulhumancerItems) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      let cloned
      if (typeof foundItems[item.type]?.[item.name] !== 'undefined') {
        cloned = foundry.utils.duplicate(foundItems[item.type][item.name])
        for (const key of ['_id', '_stats', 'folder', 'sort', 'ownership']) {
          delete cloned[key]
        }
        foundry.utils.setProperty(cloned, 'name', item.name)
      } else {
        cloned = foundry.utils.duplicate(item)
        delete cloned._id
      }
      if (typeof cloned.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'string') {
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.' + item.type + '.' + CoC7Utilities.toKebabCase(item.name))
      }
      if (cloned.type === 'talent') {
        CoC7CthulhumancerActorImporter.applyTalentRule(cloned)
      }
      items.push(cloned)
    }
    return items
  }

  /**
   * Lower case system names of skills the player added in Cthulhumancer
   * @param {object} cthulhumancerData
   * @returns {Array}
   */
  static customSkillNames (cthulhumancerData) {
    const customSkills = cthulhumancerData._cthulhumancer?.state?.customSkills
    if (!Array.isArray(customSkills)) {
      return []
    }
    return customSkills.filter(s => typeof s?.name === 'string').map(s => CoC7CthulhumancerActorImporter.makeSkillName(s.name).toLocaleLowerCase())
  }

  /**
   * Gear names from Cthulhumancer's own data, the Foundry export does not include them as Items
   * @param {object} cthulhumancerData
   * @returns {Array}
   */
  static gearNames (cthulhumancerData) {
    const background = cthulhumancerData._cthulhumancer?.state?.background ?? {}
    let names = []
    if (Array.isArray(background.gearItems)) {
      names = background.gearItems
    } else if (typeof background.gear === 'string') {
      names = background.gear.split(';')
    }
    return names.filter(n => typeof n === 'string').map(n => n.trim().replace(/\.$/, '')).filter(n => n !== '')
  }

  /**
   * Name reduced to its lower case words in sorted order
   * @param {string} name
   * @returns {string}
   */
  static wordKey (name) {
    return CoC7CthulhumancerActorImporter.words(name).sort().join(' ')
  }

  /**
   * Lower case words of a name
   * @param {string} name
   * @returns {Array}
   */
  static words (name) {
    return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ')
  }

  /**
   * Names of world Items and Item compendium entries of these types
   * @param {Array} types
   * @returns {Array}
   */
  static async knownNames (types) {
    const names = game.items.filter(i => types.includes(i.type)).map(i => i.name)
    for (const pack of game.packs) {
      if (pack.metadata.type === 'Item') {
        const index = await pack.getIndex({ fields: ['type'] })
        for (const entry of index) {
          if (types.includes(entry.type)) {
            names.push(entry.name)
          }
        }
      }
    }
    return [...new Set(names)]
  }

  /**
   * Create weapon and item objects for gear names, matching weapons then items, retrying without a trailing (model) part, then by the same words in any order, then by the only weapon whose name contains all the words
   * @param {Array} names
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractGear (names, options, progressBar) {
    const lookup = {}
    for (const name of names) {
      lookup[name] = [name]
      const stripped = name.replace(/\s*\([^)]*\)$/, '')
      if (stripped !== name && stripped !== '') {
        lookup[name].push(stripped)
      }
    }
    let candidates = Object.values(lookup).flat()
    let foundWeapons = await CoC7Utilities.guessItems('weapon', candidates, { source: options.source })
    let foundItems = await CoC7Utilities.guessItems('item', candidates, { source: options.source })
    const unmatched = names.filter(name => !lookup[name].some(n => typeof foundWeapons[n] !== 'undefined' || typeof foundItems[n] !== 'undefined'))
    if (unmatched.length) {
      const known = await CoC7CthulhumancerActorImporter.knownNames(['weapon', 'item'])
      const knownWeapons = await CoC7CthulhumancerActorImporter.knownNames(['weapon'])
      for (const name of unmatched) {
        const tried = [...lookup[name]]
        for (const n of tried) {
          const sameWords = known.find(k => CoC7CthulhumancerActorImporter.wordKey(k) === CoC7CthulhumancerActorImporter.wordKey(n))
          if (typeof sameWords !== 'undefined' && !lookup[name].includes(sameWords)) {
            lookup[name].push(sameWords)
          }
        }
        if (lookup[name].length === tried.length) {
          for (const n of tried) {
            const words = CoC7CthulhumancerActorImporter.words(n)
            // A short name such as Knife fits several weapons, so only a single fit is used
            const containing = knownWeapons.filter(k => words.every(w => CoC7CthulhumancerActorImporter.words(k).includes(w)))
            if (containing.length === 1 && !lookup[name].includes(containing[0])) {
              lookup[name].push(containing[0])
            }
          }
        }
      }
      candidates = Object.values(lookup).flat()
      foundWeapons = await CoC7Utilities.guessItems('weapon', candidates, { source: options.source })
      foundItems = await CoC7Utilities.guessItems('item', candidates, { source: options.source })
    }
    const gear = []
    for (const name of names) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      const match = lookup[name].map(n => foundWeapons[n] ?? foundItems[n]).find(i => typeof i !== 'undefined')
      let cloned
      if (typeof match !== 'undefined') {
        cloned = foundry.utils.duplicate(match)
        for (const key of ['_id', '_stats', 'folder', 'sort', 'ownership']) {
          delete cloned[key]
        }
      } else {
        cloned = {
          type: 'item'
        }
      }
      foundry.utils.setProperty(cloned, 'name', name)
      if (typeof cloned.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'string') {
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.' + cloned.type + '.' + CoC7Utilities.toKebabCase(name))
      }
      gear.push(cloned)
    }
    return gear
  }

  /**
   * Point weapons at the Actor's skills, adding the skill if the Actor does not have it
   * @param {Actor} actor
   */
  static async linkWeaponSkills (actor) {
    for (const weapon of actor.items.filter(i => i.type === 'weapon')) {
      const updates = {}
      for (const key of ['main', 'alternativ']) {
        const link = weapon.system.skill?.[key]
        if (link && (link.id ?? '') === '' && (link.name ?? '') !== '') {
          const skill = await actor.getItemOrAdd(link.name, 'skill')
          if (skill) {
            updates['system.skill.' + key + '.id'] = skill.id
            updates['system.skill.' + key + '.name'] = skill.name
          }
        }
      }
      if (Object.keys(updates).length) {
        await weapon.update(updates)
      }
    }
  }

  /**
   * Convert Cthulhumancer JSON into Foundry Actor
   * @param {object} cthulhumancerData
   * @param {object} options
   * @param {string} options.source
   * @returns {false|object}
   */
  static async createActorFromCthulhumancer (cthulhumancerData, options) {
    if (CONFIG.debug.CoC7Importer) {
      console.log('Source:', cthulhumancerData)
    }
    const sourceSkills = cthulhumancerData.items.filter(i => i.type === 'skill')
    const otherItems = cthulhumancerData.items.filter(i => i.type !== 'skill')
    const exportedNames = otherItems.map(i => i.name.toLocaleLowerCase())
    const gearNames = CoC7CthulhumancerActorImporter.gearNames(cthulhumancerData).filter(n => !exportedNames.includes(n.toLocaleLowerCase()))
    const progressBar = {
      current: 0,
      max: sourceSkills.length + otherItems.length + gearNames.length + 1
    }
    /* // FoundryVTT V12 */
    if (foundry.utils.isNewerVersion(game.version, 13)) {
      progressBar.bar = ui.notifications.info('CoC7.CoCIDFlag.loading', { localize: true, progress: true, console: false })
    } else {
      progressBar.bar = deprecated.displayProgressBar(game.i18n.localize('CoC7.CoCIDFlag.loading'))
    }
    const edu = parseInt(cthulhumancerData.system?.characteristics?.edu?.value, 10)
    const skills = await CoC7CthulhumancerActorImporter.extractSkills(sourceSkills, { source: options.source, edu: isNaN(edu) ? undefined : edu, customNames: CoC7CthulhumancerActorImporter.customSkillNames(cthulhumancerData) }, progressBar)
    const items = await CoC7CthulhumancerActorImporter.extractItems(otherItems, options, progressBar)
    const gear = await CoC7CthulhumancerActorImporter.extractGear(gearNames, options, progressBar)
    if (CONFIG.debug.CoC7Importer) {
      console.log('Skills: ', skills)
      console.log('Items: ', items)
      console.log('Gear: ', gear)
    }
    const importedCharactersFolder = await CoC7Utilities.createImportCharactersFolderIfNotExists()
    const actorData = {
      name: cthulhumancerData.name,
      type: 'character',
      folder: importedCharactersFolder.id,
      system: cthulhumancerData.system ?? {},
      items: skills.concat(items, gear)
    }
    if (typeof cthulhumancerData.img === 'string' && cthulhumancerData.img !== '') {
      actorData.img = cthulhumancerData.img
    }
    if (typeof cthulhumancerData.prototypeToken === 'object' && cthulhumancerData.prototypeToken !== null) {
      actorData.prototypeToken = cthulhumancerData.prototypeToken
    }
    const actor = await Actor.create(actorData)
    if (actor) {
      await CoC7CthulhumancerActorImporter.linkWeaponSkills(actor)
    }
    progressBar.bar.update({ pct: 1 })
    return actor ?? false
  }
}
