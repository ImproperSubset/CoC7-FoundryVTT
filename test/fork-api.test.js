import { strict } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'

// These register Foundry documents, sheets, settings and templates, none of which game.CoC7 needs
for (const path of ['compendium-filter', 'configure-documents', 'handlebars-helper', 'load-templates', 'register-dice', 'register-settings', 'register-sheets']) {
  mock.module(new URL('../coc7/setup/' + path + '.js', import.meta.url).href, { defaultExport: () => {} })
}

/**
 * Create an HTML element with only what init touches
 * @returns {object}
 */
function element () {
  return strict('element', {
    addEventListener: () => {},
    append: () => {},
    classList: strict('element.classList', {
      add: () => {}
    }),
    setAttribute: () => {}
  })
}

globalThis.document = strict('document', {
  body: element(),
  createElement: element,
  head: element()
})
globalThis.Combat = class {}
for (const name of ['Actor', 'Item', 'JournalEntry', 'Macro', 'Playlist', 'RollTable', 'Scene']) {
  CONFIG[name] = strict('CONFIG.' + name, { compendiumIndexFields: [] })
}
CONFIG.TextEditor = strict('CONFIG.TextEditor', { enrichers: [] })
game.system = {}

const { ACTOR_IMPORTER_TYPES } = await import('../coc7/constants.js')
const { default: CoC7ClickableEvents } = await import('../coc7/apps/clickable-events.js')
const { default: CoC7SanCheckCard } = await import('../coc7/apps/san-check-card.js')
const { default: CoC7Utilities } = await import('../coc7/apps/utilities.js')
const { default: init } = await import('../coc7/hooks/init.js')

// Registers region behaviors with Foundry, which game.CoC7 does not need
mock.method(CoC7ClickableEvents, 'initSelf', () => {})
init()

test('game.CoC7 exposes the functions the fork adds', () => {
  assert.equal(game.CoC7.sanCheck, CoC7SanCheckCard.create)
  assert.equal(game.CoC7.guessItems, CoC7Utilities.guessItems)
  assert.equal(game.CoC7.toKebabCase, CoC7Utilities.toKebabCase)
  assert.equal(game.CoC7.createImportCharactersFolderIfNotExists, CoC7Utilities.createImportCharactersFolderIfNotExists)
  assert.equal(typeof game.CoC7.actorImporterType, 'function')
})

test('game.CoC7.cocid has the functions the importer module uses', () => {
  assert.equal(typeof game.CoC7.cocid.fromCoCIDRegexBest, 'function')
  assert.equal(typeof game.CoC7.cocid.makeGroupRegEx, 'function')
})

test('actorImporterType registers an import type', () => {
  const importer = async () => {}
  game.CoC7.actorImporterType('test-full', 'Test.Label', importer, 'Test.Summary', 'Test.Pick')
  assert.deepEqual(ACTOR_IMPORTER_TYPES['test-full'], {
    label: 'Test.Label',
    importer,
    summary: 'Test.Summary',
    pick: 'Test.Pick'
  })
})

test('actorImporterType defaults summary to empty and pick to the label', () => {
  const importer = async () => {}
  game.CoC7.actorImporterType('test-short', 'Test.Label', importer)
  assert.deepEqual(ACTOR_IMPORTER_TYPES['test-short'], {
    label: 'Test.Label',
    importer,
    summary: '',
    pick: 'Test.Label'
  })
})
