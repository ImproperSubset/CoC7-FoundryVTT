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

// Foundry adds this to Math
Math.clamp = (value, min, max) => Math.min(Math.max(value, min), max)

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
globalThis.Hooks = strict('Hooks', {
  on: () => {},
  once: () => {}
})
globalThis.ActiveEffect = class {}
globalThis.Actor = class {}
globalThis.Item = class {}
globalThis.Roll = class {}
globalThis.TokenDocument = class {}
globalThis.foundry = strict('foundry', {
  abstract: strict('foundry.abstract', {
    TypeDataModel: class {}
  }),
  applications: strict('foundry.applications', {
    api: strict('foundry.applications.api', {
      ApplicationV2: class {
        /**
         * Foundry adds its own render context here, the tests need none of it
         * @param {string} partId
         * @param {object} context
         * @returns {object}
         */
        async _preparePartContext (partId, context) {
          return context
        }
      },
      DialogV2: class {},
      DocumentSheetV2: class {},
      HandlebarsApplicationMixin: base => class extends base {}
    }),
    apps: strict('foundry.applications.apps', {
      FilePicker: class {}
    }),
    handlebars: strict('foundry.applications.handlebars', {
      renderTemplate: async () => ''
    }),
    sheets: strict('foundry.applications.sheets', {
      ActorSheetV2: class {},
      ItemSheetV2: class {}
    }),
    ux: strict('foundry.applications.ux', {
      TextEditor: strict('foundry.applications.ux.TextEditor', {
        implementation: strict('foundry.applications.ux.TextEditor.implementation', {
          enrichHTML: async value => value
        })
      })
    })
  }),
  canvas: strict('foundry.canvas', {
    placeables: strict('foundry.canvas.placeables', {
      Token: class {}
    })
  }),
  data: strict('foundry.data', {
    fields: strict('foundry.data.fields', {
      BooleanField: class {},
      StringField: class {}
    }),
    regionBehaviors: strict('foundry.data.regionBehaviors', {
      RegionBehaviorType: class {}
    })
  }),
  dice: strict('foundry.dice', {
    terms: strict('foundry.dice.terms', {
      Die: class {}
    })
  }),
  utils: strict('foundry.utils', {
    duplicate: value => structuredClone(value),
    // Foundry's merges nested objects too, no test passes any
    mergeObject: (original, other) => Object.assign(original, other)
  })
})
