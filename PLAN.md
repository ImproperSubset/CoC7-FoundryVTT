# Plan

- **Keeper hold on combat cards**: a CoC7 system setting of world scope, off by
  default, under which each new melee and ranged attack card starts on hold.
  While a card is held, players see it but its player buttons are disabled: the
  attacker's roll, and on the melee target card the defender's responses too.
  The Keeper sets the card up, then presses a Keeper-only "Release to players"
  button that lifts the hold for every viewer. The hold is a value saved on the
  card, shaped like the melee card's existing `checkRevealed` state and its
  `revealCheck` action; the ranged card gets the same from scratch. Fork-only;
  new strings go in `en.json` only. Checked by tests of the hold and release on
  both cards' saved state, and by trying it in a world, since no test renders a
  template.
  - CC_PLAN_DECISION: combat cards held for the Keeper
    - Options considered: the card whispered to the Keeper alone by roll mode,
      then revealed; the card shown to all with players' roll buttons disabled
      until released.
    - Chosen: the card shown with buttons disabled, because, in the operator's
      words, "it allows players to see that their button press did something.
      That prevents them from spamming the attack."
    - Rejected: whispering by roll mode, because a card a player creates uses
      that player's roll mode, and the system has no step to hand a whispered
      card over to the players afterwards.
  - CC_PLAN_DECISION: what a held combat card holds
    - Options considered: the attacker's roll alone; the attacker's roll and, on
      the melee target card, the defender's responses.
    - Chosen: both, because the Keeper also sets the defender's dice, and a
      player whose character is attacked can otherwise answer before the Keeper
      has set them. The operator: "I like it."
    - Rejected: the attacker's roll alone, because it fixes only half the
      problem.
  - CC_PLAN_DECISION: the Keeper hold setting's scope
    - Options considered: a CoC7 setting of world scope; one of client scope.
    - Chosen: world scope, shown among the system's settings on its Configure
      Settings tab and kept in each world, because a player cannot switch the
      hold off for themselves, and each world sets it apart. Foundry 14's
      `common/documents/setting.mjs` lets a world setting be changed only by a
      user holding `SETTINGS_MODIFY`, which by default is the GM and Assistant
      roles, not players. The operator: "That's fine."
    - Rejected: client scope, because each player would set their own.
  - CC_PLAN_DECISION: Keeper-made combat cards held too
    - Options considered: every card held, whoever creates it; only cards a
      player creates held.
    - Chosen: every card held, because a card the Keeper creates for an NPC's
      attack carries the defending player's responses, which could otherwise be
      chosen before the Keeper sets the defender's dice. The operator: "Let's
      give it a try."
    - Rejected: only player-made cards held, because it leaves that case open;
      its saving, one press of Release, is small.

## Later

- **Review the existing docs**: read the project's existing docs against the
  principles, as a whole set: `CLAUDE.md`, the project's own rules and the
  reference files `CLAUDE.md` names. `docs/` and the READMEs are upstream's
  documentation for people, kept in upstream's form, and not reviewed. Check
  each for a line wrong or stale against the code, the plan or the diary; a line
  restating the code; history, dates or counts; a line describing what is not
  yet built; a passage that belongs where it loads instead; the same thing said
  twice; one of the project's own rules `CLAUDE.md` does not name; and a line
  carrying a decision without its citation.
