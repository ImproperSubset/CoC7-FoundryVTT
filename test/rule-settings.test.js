import './foundry-stubs.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import CoC7SettingsGameRules from '../coc7/apps/settings-game-rules.js'

test('the Game Rules dialog shows every rule it prepares a field for', async (t) => {
  t.mock.method(game.settings, 'get', () => false)
  const context = await CoC7SettingsGameRules.prototype._preparePartContext('form', {}, {})
  const template = fs.readFileSync(new URL('../static/templates/apps/rule-settings.hbs', import.meta.url), 'utf8')
  const missing = Object.keys(context.fields).filter(k => !template.includes('fields.' + k + ' '))
  assert.ok(Object.keys(context.fields).includes('pulpRuleProne'))
  assert.deepEqual(missing, [])
})
