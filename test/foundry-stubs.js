/**
 * Wrap an object so reading any key it does not have throws
 * @param {string} name
 * @param {object} values
 * @returns {Proxy}
 */
export function strict (name, values = {}) {
  return new Proxy(values, {
    get (target, key) {
      if (key in target) {
        return target[key]
      }
      // await and console.log probe these, a missing value is the right answer
      if (typeof key === 'symbol' || key === 'then') {
        return undefined
      }
      throw new Error('Test stub ' + name + ' has no ' + key)
    }
  })
}

/**
 * Documents returned by fromUuid, keyed by uuid
 */
export const documents = {}

/**
 * World settings returned by game.settings.get, keyed by setting name
 */
export const settings = {}

globalThis.CONFIG = strict('CONFIG', {
  ChatMessage: strict('CONFIG.ChatMessage', {
    modes: {
      publicroll: {}, // cspell:disable-line
      gmroll: {}, // cspell:disable-line
      blindroll: {}, // cspell:disable-line
      selfroll: {} // cspell:disable-line
    }
  })
})
globalThis.fromUuid = async (uuid) => {
  if (!(uuid in documents)) {
    throw new Error('Test stub fromUuid has no ' + uuid)
  }
  return documents[uuid]
}
globalThis.game = strict('game', {
  i18n: strict('game.i18n', {
    format: key => key,
    localize: key => key
  }),
  release: strict('game.release', {
    generation: 13
  }),
  settings: strict('game.settings', {
    get: (module, key) => {
      if (typeof settings[key] === 'undefined') {
        throw new Error('Test stub game.settings has no ' + module + '.' + key)
      }
      return settings[key]
    }
  })
})
globalThis.Actor = class {}
globalThis.Item = class {}
globalThis.Roll = class {}
globalThis.foundry = strict('foundry', {
  abstract: strict('foundry.abstract', {
    TypeDataModel: class {}
  }),
  applications: strict('foundry.applications', {
    api: strict('foundry.applications.api', {
      ApplicationV2: class {},
      DialogV2: class {},
      DocumentSheetV2: class {},
      HandlebarsApplicationMixin: base => class extends base {}
    }),
    ux: strict('foundry.applications.ux', {
      TextEditor: strict('foundry.applications.ux.TextEditor', {
        implementation: strict('foundry.applications.ux.TextEditor.implementation', {
          enrichHTML: async value => value
        })
      })
    })
  }),
  utils: strict('foundry.utils', {
    duplicate: value => structuredClone(value)
  })
})
