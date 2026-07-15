# Data Model

**Status:** Living document

**Purpose:** Describe the core domain objects used throughout Note Web and the relationships between them.

**Related documents:**

- Architecture.md
- Content Pipeline.md
- Concept System.md
- Reference System.md

---

# Introduction

The architecture of Note Web is built around a small set of domain models.

These models represent the meaning of the application rather than implementation details.

Whenever possible, new features should extend existing models instead of introducing unrelated structures.

---

# Model Relationships

```text
                    Note
                      │
      ┌───────────────┼────────────────┐
      │               │                │
Diagnostics   ReferenceRegistry     Source
      │               │
      │               └──────────────┐
      │                              │
      │                      ReferenceTarget
      │                              │
      │                       ReferenceNumber
      │
      └──────────────────────────────┘

Concept ───────► Generated Concept Page
      │
      └──────► Concept Reference
```

---

# Note

Represents one authored note.

Responsibilities:

- identity
- URL
- title
- transformed source
- diagnostics
- reference registry

A note is the root object for almost all processing.

---

# Concept

Represents reusable knowledge.

A concept is **not** a page.

A concept is structured data from which pages and references are generated.

Typical fields include:

- id
- title
- aliases
- shortDefinition
- notation
- formalDefinition
- prerequisites

---

# Diagnostic

Represents a problem discovered while processing content.

Fields typically include:

- severity
- message
- file path
- line
- column

Diagnostics should always refer to the author's original source.

---

# ReferenceRegistry

A per-note lookup structure.

Responsibilities:

- resolve labels
- enumerate targets
- provide typo suggestions
- validate references

Each note owns exactly one ReferenceRegistry.

---

# ReferenceTarget

Represents a labelled numbered object.

Typical fields:

- label
- type
- number
- anchorId

Every ReferenceTarget is backed by a numbered object.

Not every numbered object becomes a ReferenceTarget.

---

# ReferenceNumber

Represents structured numbering.

```ts
interface ReferenceNumber {
    primary: number;
    sub?: string;
}
```

Using structured numbers instead of strings prepares the architecture for:

- subequations
- subfigures
- grouped numbering

---

# Generated Concept Page

Generated from a Concept.

Never authored manually.

Used by:

- concept page
- tooltip

Both share exactly the same generated content.

---

# Concept Reference

Created with:

```text
\concept{force}
```

Responsibilities:

- display inline text
- link to concept page
- open hover preview

Concept references never participate in document numbering.

---

# Ownership

| Model | Owner |
|-------|-------|
| Note | Loader |
| Concept | Concept loader |
| Diagnostic | Analyzers / Transformers |
| ReferenceRegistry | Note |
| ReferenceTarget | Reference analysis |
| ReferenceNumber | ReferenceTarget |
| Generated Concept Page | Builder |
| Concept Reference | Command renderer |

---

# Design Principles

- Models describe meaning, not presentation.
- Relationships should be explicit.
- Models should have high cohesion and low coupling.
- Prefer extending existing models over creating parallel ones.

---

# Future Models

Likely future additions include:

- Figure
- FigureTarget
- Table
- SectionTarget
- Citation
- BibliographyEntry
- Theorem
- Proof
- Exercise

Whenever possible these should reuse existing abstractions such as ReferenceTarget or ReferenceNumber rather than introducing incompatible designs.
