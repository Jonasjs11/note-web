# Folder Structure

**Status:** Living document

**Purpose:** Describe the responsibility of every major folder in the project.

**Related documents:**

- Architecture.md
- Development Guide.md

---

# Philosophy

Folders are organised by responsibility rather than by feature.

Each folder should own one stage of the document pipeline.

When adding new code, the first question should be:

> Which subsystem is responsible for this?

rather than:

> Where can I make this work?

The folder structure exists to reinforce the architecture.

---

# Overview

```
src/

    app/

    components/

    content/

    pages/

    types/
```

Everything inside `src/` belongs to one of these responsibilities.

---

# app/

The application entry point.

Contains:

- application layout
- router
- global providers
- application bootstrap

This folder should not contain business logic.

It wires the application together.

Examples:

```
Layout.tsx

router.tsx
```

---

# components/

Reusable React components.

Examples include:

- Markdown renderer
- Sidebar
- Concept tooltip
- Navigation controls

Components should focus on presentation.

Components should never analyse note source.

Components should never load content directly.

A component may render:

- notes
- concepts
- commands

but should not parse them.

---

# content/

The heart of the application.

Everything related to documents belongs here.

```
content/

    builders/

    commands/

    concepts/

    diagnostics/

    loader/

    models/

    notes/

    parser/

    references/

    registry/

    transformers/
```

Every subfolder has a single responsibility.

---

# content/notes/

Contains all authored notes.

The filesystem hierarchy becomes the navigation hierarchy.

Only author content belongs here.

No helper code.

No utilities.

No registries.

---

# content/concepts/

Contains structured concept definitions.

Each file defines exactly one concept.

Concept files should contain data only.

They should not perform lookups.

They should not import application logic.

---

# content/models/

Contains shared domain models.

Examples:

```
Concept

Note

Diagnostic

ReferenceTarget
```

Models describe information.

They should contain little or no behaviour.

---

# content/loader/

Responsible for discovering authored content.

Responsibilities include:

- filesystem discovery
- metadata extraction
- invoking analysis
- invoking transformation

Loaders may use:

```
import.meta.glob()
```

No other subsystem should discover files directly.

---

# content/builders/

Builders create derived structures.

Examples:

```
Navigation

Concept Registry

Generated Concept Pages
```

Builders receive loaded data.

Builders never read files directly.

Builders should be deterministic.

---

# content/parser/

Parsers extract information.

Parsers answer questions like:

- What is the title?
- Where is this command?
- What line is this character on?

Parsers should not modify source.

---

# content/references/

Everything related to numbered objects.

Examples:

- equation analysis
- numbering
- reference targets
- registries
- future figures
- future tables

This folder owns document references.

Concepts deliberately do not belong here.

---

# content/registry/

Lookup systems.

Examples:

```
ConceptRegistry

Future registries...
```

Registries answer questions.

They do not mutate content.

---

# content/transformers/

Transforms source text.

```
Source

↓

Source
```

Examples:

```
Concept transformer

Reference transformer

LaTeX transformer
```

Transformers may produce diagnostics.

They should remain independent.

---

# content/commands/

Everything related to custom commands.

Responsibilities include:

- token encoding
- token decoding
- command parsing
- rehype integration
- renderer registration

Adding a new command should usually involve this folder.

---

# content/diagnostics/

Shared diagnostic helpers.

Examples:

- typo suggestions
- future formatting helpers
- severity utilities

Diagnostics should be reusable across language features.

---

# pages/

Top-level routed pages.

Examples:

```
Home

Note

Concept
```

Pages coordinate components.

They should contain little business logic.

---

# types/

Global TypeScript declarations.

Examples:

```
mathjax.d.ts
```

Only global type declarations belong here.

---

# Ownership Rules

Every subsystem owns specific responsibilities.

## Loaders

Own:

- filesystem discovery

Do not own:

- rendering

---

## Builders

Own:

- derived structures

Do not own:

- filesystem access

---

## Parsers

Own:

- information extraction

Do not own:

- rewriting

---

## Transformers

Own:

- source rewriting

Do not own:

- rendering

---

## Registries

Own:

- lookup

Do not own:

- content discovery

---

## Components

Own:

- presentation

Do not own:

- parsing

---

## Pages

Own:

- composition

Do not own:

- reusable UI

---

# Adding New Code

Before creating a new file, ask:

1. Which subsystem owns this responsibility?
2. Does a similar abstraction already exist?
3. Can an existing subsystem be extended instead?

Creating a new folder should be rare.

Most new features should fit naturally into the existing structure.

---

# Future Growth

As the language grows, the folder structure should remain stable.

New language features should primarily add:

- analyzers
- transformers
- renderers

rather than new top-level folders.

This keeps the project predictable and easy to navigate.

---

# Summary

The folder structure mirrors the architecture.

Every folder owns one responsibility.

Keeping those responsibilities clear is one of the primary ways the project remains maintainable as it grows.