---
paths:
  - "coc7/**/*.js"
  - "scripts/**/*.js"
  - "static/templates/**/*.hbs"
  - "static/lang/*.json"
---

# Writing code

How code in the fork is written.

- Code here imitates the maintainer's own style exactly: copy the shapes of the
  neighboring code (Dhole's House importer, `journalStyle`, `eras`), JSDoc on
  every method, `typeof x === 'undefined'` checks, `foundry.utils.setProperty`
  with dotted paths, `/* // FoundryVTT V13 */` markers on code kept for the
  oldest Foundry release supported. Add no UI strings unless asked; any new key
  goes in `en.json` only.
