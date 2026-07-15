# Vision

**Status:** Living document

**Purpose:** Describe the long-term vision of the project rather than its implementation.

---

# What is Note Web?

Note Web is a publishing system for mathematics, physics, engineering and other technical subjects.

It is not intended to be a general-purpose Markdown editor, nor is it intended to replicate LaTeX.

Instead, it aims to combine the strengths of several systems into one coherent authoring experience:

- Markdown for document structure.
- LaTeX for mathematics.
- React for interactivity.
- Structured data for reusable knowledge.
- Static-site generation for speed.
- Custom language features designed specifically for technical writing.

The project should feel as natural to write as Markdown while providing many of the capabilities traditionally associated with LaTeX.

---

# Vision

The long-term goal is to create a technical publishing system where authors spend almost all of their time thinking about **content**, not formatting.

Instead of manually maintaining pages, links, references and duplicated information, the author provides structured information once and allows the system to generate everything else automatically.

Whenever possible, data should exist in exactly one place.

Presentation should be generated from that data.

---

# Core Goals

The project has six primary goals.

## 1. Excellent writing experience

Writing should feel lightweight.

The author should be able to remain focused on the subject rather than the document format.

Common tasks should require as little syntax as possible while remaining explicit and readable.

---

## 2. High-quality technical documents

Documents should support everything expected from professional technical writing, including:

- mathematics
- numbered equations
- references
- figures
- tables
- cross references
- diagrams
- definitions
- examples
- proofs
- citations

The system should make these features feel consistent rather than like unrelated additions.

---

## 3. Structured knowledge

Concepts should not simply be words inside documents.

Instead they should become structured objects that may be reused throughout the entire project.

Examples include:

- Force
- Velocity
- Electric field
- Fourier Transform

Each concept should exist once and automatically generate:

- its own page
- hover previews
- prerequisite relationships
- search results
- future visualisations

The knowledge base should gradually become a connected graph rather than a collection of isolated pages.

---

## 4. Interactive learning

Reading should be more interactive than a traditional PDF.

Possible future examples include:

- hover previews
- interactive diagrams
- animations
- simulations
- expandable derivations
- quizzes
- visualisations

These should enhance understanding without disrupting normal reading.

---

## 5. Maintainability

The project should become easier to extend over time rather than harder.

Adding a new language feature should reuse existing infrastructure whenever possible.

Large rewrites should become increasingly unnecessary.

---

## 6. Long-term scalability

The architecture should support thousands of notes without requiring fundamental redesign.

Adding new subjects should feel no different than adding a new folder.

Adding new language features should feel like extending a language rather than modifying unrelated code.

---

# Intended Audience

The primary audience is currently the project author.

However, the architecture should not depend on this assumption.

The system should be capable of supporting:

- students
- teachers
- researchers
- engineers
- technical writers

without requiring architectural changes.

---

# Design Philosophy

Several principles guide all architectural decisions.

## Content before presentation

The author should describe *what* something is rather than *how* it should look.

Presentation is generated automatically whenever possible.

---

## Data before duplication

Information should exist in one place.

Everything else should be derived from it.

---

## Structure before styling

The internal representation of a document should capture meaning rather than appearance.

Formatting should be a later concern.

---

## Automation before manual maintenance

If something can be generated reliably, it should be generated.

Examples include:

- navigation
- concept pages
- references
- numbering
- diagnostics

---

## Explicit over implicit

Language features should have clear syntax.

Hidden behaviour should be minimised.

A reader of the source should generally understand what the document will do.

---

## Incremental growth

The architecture should evolve by adding small independent features.

New capabilities should rarely require modifying existing systems.

---

# Long-Term Dream

The long-term ambition is for Note Web to become a complete technical publishing language.

An author should be able to write an entire textbook, lecture notes, or scientific handbook using the system without feeling limited by the authoring tools.

The system should combine the simplicity of Markdown, the mathematical power of LaTeX, the flexibility of React, and the maintainability of structured data.

Ultimately, the software should become a platform for technical knowledge rather than merely a renderer for Markdown files.

---

# Scope

This project is intentionally **not** attempting to replace every feature of LaTeX.

Instead, it aims to support the subset of functionality that provides the greatest value for technical educational content.

Features are added when they improve the authoring experience, integrate naturally with the existing language, and align with the overall philosophy of the project.

---

# Guiding Question

Every significant architectural decision should be evaluated against one question:

> Does this make it easier for the author to express technical knowledge while keeping the system simpler to extend in the future?

If the answer is no, the decision should be reconsidered.