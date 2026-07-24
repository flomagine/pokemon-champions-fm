# Architecture

## Layering

1. **Data (`src/data`)** — Pokémon catalog, metagame snapshots, role evidence, abilities, moves and speed tables. No DOM access.
2. **Domain (`src/core`)** — type, defense, ability, sustain, matchup, team analysis, speed and selection rules. Core services are exposed as classes and testable functions.
3. **Presentation (`src/ui`)** — DOM rendering, user input, view formatting and team-plan decoration.
4. **Composition root (`src/main.js`)** — dependency wiring only. The matchup engine receives the speed audit service and the team-plan renderer is installed here.

## Design principles

- Single Responsibility: each service owns one decision domain.
- Dependency Direction: UI depends on domain; domain never imports UI.
- Explicit data boundary: usage snapshots and heuristics are kept outside algorithms.
- Conservative uncertainty: unknown sets do not receive counter-grade certainty.
- Structure before matchup: team roles and role dependencies are evaluated before a final selection score is accepted.
- Control is not damage: Trick and Encore can deny recovery temporarily but are not counted as direct wall breaking.
- Regression tests: catalog counts, type math, defense axis, turn order, recovery walls and stall archetypes are fixed tests.

## Team-analysis pipeline

```text
Pokémon data + current role snapshots
        ↓
role inference per Pokémon
        ↓
team archetype scoring
        ↓
role dependency graph and centrality
        ↓
required counter missions
        ↓
selection-3 + lead evaluation
        ↓
opening / dismantling / win-condition plan
```

### Role inference

`TeamAnalysisEngine` combines current verified snapshots with conservative inference from moves, abilities, defensive investment and existing profile tags. The result can contain multiple roles, because a Pokémon such as Toxapex can be a recovery wall, status spreader, Regenerator pivot, trapper and anti-setup piece at the same time.

### Dependency graph

Edges are created for interactions such as:

- physical wall ↔ special wall
- status spreader ↔ Protect user
- hazard setter ↔ phazer or trapper
- Regenerator ↔ pivot
- cleric ↔ recovery wall
- anti-setup piece ↔ recovery core

Centrality is used to decide which opponent has to be weakened or removed first. It is not treated as a raw usage-rate ranking.

### Counter missions

`evaluateTeamCounterPlan` checks whether a selected trio can:

- exceed reliable recovery instead of merely surviving the matchup
- attack the correct physical/special defensive axis
- deny recovery with Trick, Encore or Taunt when direct damage is insufficient
- prevent or punish hazards when no removal move is available
- resist the opponent's status clock
- remove Haze, Unaware or phazing before committing to a setup win condition
- keep damage on a Regenerator core instead of spreading chip across several targets

The mission score modifies mean, worst-case and robust selection scores.

## Core classes

- `TypeSystem`
- `DefenseEngine`
- `AbilityEngine`
- `MatchupEngine`
- `StallEngine`
- `TeamAnalysisEngine`
- `SpeedEngine`
- `SelectionEngine`
- `SimulatorApp`

The functions exported beside each class are compatibility and test APIs. New feature code should prefer the class interfaces.
