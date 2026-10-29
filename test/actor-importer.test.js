// cSpell:words iwms
import { strict } from './foundry-stubs.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { ACTOR_IMPORTER_TYPES } from '../coc7/constants.js'
import CoC7ActorImporterDialog from '../coc7/apps/actor-importer-dialog.js'

CONFIG.debug = { CoC7Importer: false }
game.user = strict('game.user', {
  can: () => true
})
globalThis.ui = strict('ui', {
  notifications: strict('ui.notifications', {
    info: () => {}
  })
})

/**
 * Register an import type the way game.CoC7.actorImporterType does
 * @param {Function} importer
 */
function register (importer) {
  ACTOR_IMPORTER_TYPES.test = {
    label: 'Test.Label',
    importer,
    summary: 'Test.Summary',
    pick: 'Test.Pick'
  }
}

/**
 * Create the dialog's this with only what the form part and the submit handler read
 * @param {string} importType
 * @returns {object}
 */
function dialog (importType) {
  return {
    close: mock.fn(),
    coc7Config: {
      characterData: '',
      characterJSON: { name: 'Imported' },
      convert6E: 'coc-guess',
      importType,
      language: 'en',
      source: ''
    }
  }
}

/**
 * Press the dialog's import button
 * @param {object} application
 * @returns {object} the form, whose display the handler hides and restores
 */
async function submit (application) {
  const form = { style: { display: '' } }
  const event = { submitter: { dataset: { action: 'import' } } }
  const formData = {
    object: {
      'coc-convert-6E': 'coc-guess',
      'coc-pasted-character-data': '',
      source: 'iwms'
    }
  }
  await CoC7ActorImporterDialog.DEFAULT_OPTIONS.form.handler.call(application, event, form, formData)
  return form
}

test('a registered import type is offered in the dialog', async () => {
  register(async () => {})
  const context = await CoC7ActorImporterDialog.prototype._preparePartContext.call(dialog('npc'), 'form', {}, {})
  assert.deepEqual(context.importTypeOptions.find(option => option.key === 'test'), { key: 'test', label: 'Test.Label' })
})

test('choosing a registered import type shows its summary and file picker', async () => {
  register(async () => {})
  const context = await CoC7ActorImporterDialog.prototype._preparePartContext.call(dialog('test'), 'form', {}, {})
  assert.deepEqual(context.importer, { summary: 'Test.Summary', pick: 'Test.Pick' })
})

test('importing calls the registered importer with the JSON and item source, then opens the actor', async () => {
  const render = mock.fn(async () => {})
  const actor = Object.assign(new Actor(), { name: 'Imported', type: 'character', sheet: { render } })
  const importer = mock.fn(async () => actor)
  register(importer)
  const application = dialog('test')
  await submit(application)
  assert.deepEqual(importer.mock.calls[0].arguments, [{ name: 'Imported' }, { source: 'iwms' }])
  assert.deepEqual(render.mock.calls[0].arguments, [{ force: true }])
  assert.equal(application.close.mock.callCount(), 1)
})

test('an importer that returns no actor leaves the dialog open', async () => {
  register(async () => false)
  const application = dialog('test')
  const form = await submit(application)
  assert.equal(form.style.display, '')
  assert.equal(application.close.mock.callCount(), 0)
})

test('an importer that throws leaves the dialog open', async () => {
  register(async () => {
    throw new Error('bad file')
  })
  mock.method(console, 'error', () => {})
  const application = dialog('test')
  const form = await submit(application)
  assert.equal(form.style.display, '')
  assert.equal(application.close.mock.callCount(), 0)
})
