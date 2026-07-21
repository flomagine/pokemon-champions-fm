
# Architecture

## Layering

1. **Data (`src/data`)** — Pokémon catalog, metagame snapshot, abilities, moves and speed tables. No DOM access.
2. **Domain (`src/core`)** — type, defense, ability, matchup, speed and selection rules. Core services are exposed as classes and testable functions.
3. **Presentation (`src/ui`)** — DOM rendering, user input and view formatting.
4. **Composition root (`src/main.js`)** — dependency wiring only. The matchup engine receives the speed audit service here.

## Design principles

- Single Responsibility: each service owns one decision domain.
- Dependency Direction: UI depends on domain; domain never imports UI.
- Explicit data boundary: usage snapshots and heuristics are kept outside algorithms.
- Conservative uncertainty: unknown sets do not receive counter-grade certainty.
- Regression tests: catalog counts, type math, defense axis and Greninja/Primarina turn order are fixed tests.

## Core classes

- `TypeSystem`
- `DefenseEngine`
- `AbilityEngine`
- `MatchupEngine`
- `SpeedEngine`
- `SelectionEngine`
- `SimulatorApp`

The functions exported beside each class are compatibility/test APIs. New feature code should prefer the class interfaces.
