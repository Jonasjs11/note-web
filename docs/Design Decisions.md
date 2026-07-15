# Design Decisions

**Status:** Living document

**Purpose:** Record the reasoning behind important architectural decisions so future contributors understand *why* the system is designed the way it is.

**Related documents:**

- Manifesto.md
- Architecture.md
- Content Pipeline.md
- Concept System.md
- Reference System.md
- Command System.md

---

# Why this document exists

Code explains *what* the system does.

Architecture explains *how* it works.

This document explains *why* specific decisions were made.

Whenever an architectural decision is deliberate rather than accidental, it belongs here.

---

# Filesystem as the source of truth

## Decision

The folder hierarchy defines note hierarchy and navigation.

## Why

Maintaining a separate navigation file inevitably duplicates information.

By deriving navigation from the filesystem:

- organization exists in one place
- moving notes updates navigation automatically
- adding subjects requires no configuration

---

# Filenames are stable IDs

## Decision

The filename determines the URL and identity.

The first H1 determines the displayed title.

## Why

Authors should be free to improve titles without breaking links.

---

# Concepts are structured data

## Decision

Concepts are TypeScript objects rather than Markdown pages.

## Why

A single concept should generate:

- a concept page
- a tooltip
- search data
- prerequisite information

Writing the same information twice inevitably creates inconsistencies.

---

# Concept pages are generated

## Decision

Authors define concept data.

The page is generated.

## Why

Every concept page should have a consistent layout.

Changing the layout should update every concept automatically.

---

# Concepts are not references

## Decision

The concept system and reference system are separate.

## Why

Concepts describe knowledge.

References describe locations inside documents.

They solve different problems and should evolve independently.

---

# Numbered objects are separate from reference targets

## Decision

Every numbered equation receives a number.

Only labelled equations become reference targets.

## Why

Many equations never need to be referenced.

Separating numbering from labels naturally supports:

- optional references
- figures
- tables
- subequations
- subfigures

---

# Labels are local

## Decision

Reference labels are local to one note.

## Why

This matches LaTeX and avoids global naming collisions.

Cross-note references can later be introduced explicitly instead of implicitly.

---

# Pipeline architecture

## Decision

Documents move through independent stages.

## Why

Each stage has one responsibility.

New features extend existing stages instead of modifying unrelated systems.

---

# Analysis before transformation

## Decision

Diagnostics are produced before transformations that change line numbers.

## Why

Diagnostics should point to the author's original source.

Maintaining correct locations is more important than simplifying transformers.

---

# Token → rehype → React

## Decision

Commands become encoded tokens before Markdown parsing.

## Why

Injecting React components before Markdown parsing breaks inline layout.

Tokens preserve Markdown semantics while allowing React components to be inserted afterwards.

---

# Markdown remains standard

## Decision

Standard Markdown is reused whenever possible.

## Why

Authors already know Markdown.

Learning Note Web should require learning only the semantic extensions.

---

# Mathematics remains close to LaTeX

## Decision

Math syntax follows LaTeX whenever practical.

## Why

Most technical authors already know LaTeX mathematics.

Existing knowledge should transfer naturally.

---

# Structured numbering

## Decision

Reference numbers are stored as structured data.

```ts
{
    primary: 3,
    sub: "a"
}
```

instead of `"3a"`.

## Why

This prepares the system for:

- subequations
- subfigures
- grouped references

without future redesign.

---

# ReferenceRegistry

## Decision

Each note owns its own ReferenceRegistry.

## Why

Reference lookup belongs to the note, not the application.

This keeps references isolated and simplifies future extensions.

---

# Registry pattern

## Decision

Frequently queried semantic objects are accessed through registries.

Examples:

- ConceptRegistry
- ReferenceRegistry

## Why

Lookup logic should be centralized.

Consumers should ask questions instead of searching collections themselves.

---

# Builder pattern

## Decision

Derived structures are created by builders.

## Why

Builders are deterministic and separate construction from loading.

---

# Analyzer pattern

## Decision

Analyzers inspect source but never modify it.

## Why

Analysis should remain repeatable and independent of rendering.

---

# Transformer pattern

## Decision

Transformers convert source text into source text.

## Why

Keeping transformations text-based allows the language to evolve without coupling to React.

---

# Renderer pattern

## Decision

Renderers receive semantic objects rather than raw source.

## Why

Presentation should not contain parsing logic.

---

# Explicit multiple references

## Decision

Multiple references render as:

equations 1, 2, and 3

rather than

equations 1–3

## Why

Explicit references are clearer and naturally support non-consecutive and future sub-numbered references.

---

# Tooltips reuse generated pages

## Decision

Concept tooltips render the same generated content as concept pages.

## Why

One source of truth eliminates duplicated layouts and inconsistent updates.

---

# Guiding principle

Whenever a future design decision is made, ask:

1. Does it reduce duplication?
2. Does it preserve separation of responsibilities?
3. Does it make future language features easier to implement?
4. Does it make the author's experience simpler?

If not, reconsider the design.

---

# Future additions

Whenever a significant architectural choice is made, record:

- the decision
- the reason
- the alternatives considered (when useful)
- the long-term consequences

This document should become the historical memory of the project.
