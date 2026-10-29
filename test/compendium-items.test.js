import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import yaml from 'js-yaml'

/**
 * Read every document in a compendium source file
 * @param {string} name
 * @returns {Array}
 */
function compendium (name) {
  return yaml.loadAll(fs.readFileSync(new URL('../compendiums/' + name + '.yaml', import.meta.url), 'utf8')).filter(doc => doc)
}

test('the Unarmed weapon uses a skill that exists', () => {
  const unarmed = compendium('en-items').find(doc => doc._id === '3elxAwnv7WCUNwng') // cspell:disable-line
  assert.equal(unarmed.name, 'Unarmed')
  const skill = compendium('en-skills').find(doc => doc.type === 'skill' && doc.flags?.CoC7?.cocidFlag?.id === unarmed.system.skill.main.name)
  assert.equal(skill?.name, 'Fighting (Brawl)')
})
