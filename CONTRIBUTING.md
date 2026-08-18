# Contributing

Thank you for helping preserve and study this classic tabletop experience.

## The most useful bug report

Please include:

1. app version;
2. game level and player count;
3. the random seed shown above the Chronicle;
4. the current player's resources and kingdom;
5. the exact buttons pressed;
6. what happened;
7. what the original game or manual should have done.

A JSON save exported immediately after the problem is especially useful.

## Rules research

For proposed rule corrections, identify the evidence type:

- **Primary:** original instruction manual, verified tower observation, firmware/disassembly;
- **Strong secondary:** independent technical reconstruction with reproducible evidence;
- **Secondary:** contemporary play guide or careful reference site;
- **Memory/anecdote:** useful lead, not enough by itself to mark a rule verified.

Do not upload copyrighted scans, copied manual pages, logos, or original sound files to this repository.

## Code changes

Run the tests before opening a pull request:

```bash
npm test
```

New game-engine behavior should normally include at least one test in `tests/engine.test.mjs`.
