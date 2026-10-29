import { strict } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import yaml from 'js-yaml'
import CoC7Utilities from '../coc7/apps/utilities.js'
import CoCID from '../coc7/apps/coc-id.js'

globalThis.ui = strict('ui', {
  notifications: strict('ui.notifications', {
    info: () => {}
  })
})

/**
 * Create a world item with only what guessItems reads
 * @param {string} type
 * @param {string} name
 * @param {string} cocid
 * @returns {object}
 */
function item (type, name, cocid) {
  return {
    name,
    type,
    flags: (typeof cocid === 'undefined' ? {} : { CoC7: { cocidFlag: { id: cocid } } })
  }
}

test('toKebabCase turns every system skill name into its CoC ID', () => {
  const skills = yaml.loadAll(fs.readFileSync(new URL('../compendiums/en-skills.yaml', import.meta.url), 'utf8'))
    .filter(doc => doc?.type === 'skill' && typeof doc.flags?.CoC7?.cocidFlag?.id === 'string')
  assert.ok(skills.length > 0)
  const mismatches = skills.filter(doc => 'i.skill.' + CoC7Utilities.toKebabCase(doc.name) !== doc.flags.CoC7.cocidFlag.id)
    .map(doc => doc.name + ' -> ' + CoC7Utilities.toKebabCase(doc.name) + ', expected ' + doc.flags.CoC7.cocidFlag.id)
  assert.deepEqual(mismatches, [])
})

test('toKebabCase returns an empty string for no name', () => {
  assert.equal(CoC7Utilities.toKebabCase(''), '')
  assert.equal(CoC7Utilities.toKebabCase(undefined), '')
})

test('guessItems finds world items by CoC ID and by name, prefers the best CoC ID match, and keys them by the names asked for', async () => {
  const worldSpotHidden = item('skill', 'Spot Hidden', 'i.skill.spot-hidden')
  const worldLibraryUse = item('skill', 'Library Use')
  const bestSpotHidden = item('skill', 'Spot Hidden', 'i.skill.spot-hidden')
  game.items = [worldSpotHidden, worldLibraryUse, item('weapon', 'Library Use')]
  game.packs = []
  game.CoC7 = { cocid: CoCID }
  const best = mock.method(CoCID, 'fromCoCIDRegexBest', async () => [bestSpotHidden])
  const found = await CoC7Utilities.guessItems('skill', ['i.skill.spot-hidden', 'Library Use'], { source: 'i' })
  assert.deepEqual(Object.keys(found), ['i.skill.spot-hidden', 'Library Use'])
  assert.equal(found['i.skill.spot-hidden'], bestSpotHidden)
  assert.equal(found['Library Use'], worldLibraryUse)
  assert.equal(best.mock.calls[0].arguments[0].type, 'i')
  assert.ok(best.mock.calls[0].arguments[0].cocidRegExp.test('i.skill.spot-hidden'))
})

test('createImportCharactersFolderIfNotExists returns the existing folder', async () => {
  const folder = { name: 'Imported characters', type: 'Actor' }
  game.folders = [folder]
  globalThis.Folder = { create: mock.fn() }
  assert.equal(await CoC7Utilities.createImportCharactersFolderIfNotExists(), folder)
  assert.equal(Folder.create.mock.callCount(), 0)
})

test('createImportCharactersFolderIfNotExists creates the folder when there is none', async () => {
  const folder = { name: 'Imported characters', type: 'Actor' }
  game.folders = [{ name: 'Imported characters', type: 'Item' }]
  globalThis.Folder = { create: mock.fn(async () => folder) }
  assert.equal(await CoC7Utilities.createImportCharactersFolderIfNotExists(), folder)
  assert.deepEqual(Folder.create.mock.calls[0].arguments, [{ name: 'Imported characters', type: 'Actor', parent: null }])
})
