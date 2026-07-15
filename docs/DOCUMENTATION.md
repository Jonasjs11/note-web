Manifesto
=========
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


Architecture
============
# Architecture

**Status:** Living document

**Purpose:** Describe the overall architecture of Note Web and how information flows through the system.

**Related documents:**

- Manifesto.md
- Language Specification.md
- Development Guide.md

---

# Overview

Note Web is built as a pipeline.

Content flows through a sequence of independent stages.

Each stage has one responsibility and should know as little as possible about the others.

```
Filesystem

↓

Loaders

↓

Builders

↓

Analysis

↓

Transformation

↓

Markdown

↓

React

↓

MathJax

↓

Browser
```

The output of one stage becomes the input of the next.

No stage should perform the responsibilities of another.

---

# High-Level Pipeline

The complete document pipeline is:

```
Raw MDX file

↓

Loader

↓

Document Model

↓

Analysis

↓

Transformation

↓

Markdown Parser

↓

rehype Plugins

↓

React Components

↓

MathJax

↓

Browser
```

Each stage is intentionally independent.

This separation allows new language features to be added without redesigning the entire system.

---

# Stage 1 – Filesystem

The filesystem is the primary source of truth.

Folders define document hierarchy.

Example:

```
notes/

    mathematics/

        algebra/

            vectors.mdx
```

This becomes

```
Subject

↓

mathematics

↓

Category

↓

algebra

↓

Document

↓

vectors
```

The application does not maintain a separate navigation file.

Navigation is generated automatically.

---

# Stage 2 – Loaders

Loaders discover content.

They should never perform rendering.

They should never contain React code.

Current loaders include:

```
loadNotes()

loadConcepts()
```

Responsibilities include:

- discovering files
- parsing metadata
- creating models
- invoking analysis
- invoking transformations

The output is a collection of strongly typed domain objects.

---

# Stage 3 – Builders

Builders create derived data.

Examples:

```
Navigation

↓

Concept Registry

↓

Generated Concept Pages
```

Builders should never read files directly.

They receive already loaded models.

Builders should be deterministic.

The same input should always produce the same output.

---

# Stage 4 – Analysis

Analysis inspects content.

It should never modify content.

Analysis may produce:

- diagnostics
- metadata
- numbering
- symbol tables

Examples include:

```
Title Analysis

↓

Reference Target Analysis

↓

Future Figure Analysis

↓

Future Citation Analysis
```

Analysis answers questions like:

> What exists?

not

> How should it be rendered?

---

# Stage 5 – Transformation

Transformers convert source into source.

```
Source

↓

Source
```

A transformer may:

- rewrite syntax
- insert command tokens
- normalize language features
- generate diagnostics

Transformers should not know anything about React.

Each transformer should have one responsibility.

Current examples:

```
Concept Commands

Reference Commands

LaTeX Normalization
```

---

# Stage 6 – Markdown

After transformation, the source becomes ordinary Markdown.

Markdown parsing is delegated to external libraries.

Current libraries:

- react-markdown
- remark-gfm
- remark-math

The project should not reimplement Markdown parsing.

---

# Stage 7 – rehype

rehype plugins modify the parsed syntax tree.

This is where command tokens become React components.

The project intentionally performs this step after Markdown parsing.

This preserves inline layout naturally.

---

# Stage 8 – React

React is responsible for presentation.

React components should not parse source.

React should receive already processed structures.

Examples include:

- concept links
- hover previews
- reference links

---

# Stage 9 – MathJax

MathJax performs mathematical typesetting.

The project intentionally delegates mathematical layout to MathJax.

MathJax is not responsible for:

- reference analysis
- numbering decisions
- diagnostics

Those occur earlier.

MathJax is responsible only for visual mathematics.

---

# Stage 10 – Browser

The browser displays the final interactive document.

At this point every custom command has already become a React component.

The browser should not contain parsing logic.

---

# Architectural Patterns

Several patterns appear throughout the project.

These should be preferred whenever practical.

---

## Registry Pattern

A registry provides lookup.

Examples:

```
ConceptRegistry

ReferenceRegistry
```

Future registries may include:

```
FigureRegistry

CitationRegistry

SectionRegistry
```

Registries should answer questions.

They should not mutate documents.

---

## Builder Pattern

Builders derive new structures.

Examples:

```
buildNavigation()

buildConceptRegistry()

buildConceptPage()
```

Builders should be deterministic.

---

## Analyzer Pattern

Analyzers inspect content.

```
Input

↓

Inspection

↓

Metadata
```

They never rewrite source.

---

## Transformer Pattern

Transformers rewrite source.

```
Input

↓

Transformation

↓

Output
```

Transformers may produce diagnostics.

They should remain independent.

---

## Renderer Pattern

Renderers convert semantic objects into React components.

```
Command

↓

React Component
```

Renderers should not parse source.

---

# Separation of Responsibilities

The project intentionally separates concerns.

```
Filesystem

↓

Discovery

↓

Analysis

↓

Transformation

↓

Rendering
```

Each layer has one responsibility.

Violating this separation increases coupling and makes future language features more difficult to implement.

---

# Language Features

Every language feature should fit naturally into the existing pipeline.

Most language features follow this structure:

```
Parser

↓

Validator

↓

Renderer
```

Numbered language features additionally require:

```
Numbering

↓

Reference Targets

↓

Renderer
```

This architecture should be reused whenever possible.

---

# Extending the Language

Adding a new language feature should generally require:

1. Analysis (if required)
2. Validation
3. Transformation
4. Rendering

The existing architecture should already provide the necessary extension points.

Large refactors should become increasingly uncommon.

---

# Design Goals

The architecture aims to achieve:

- High cohesion
- Low coupling
- Deterministic processing
- Incremental extensibility
- Clear ownership of responsibilities

Adding new features should become easier over time rather than harder.

---

# Architectural Invariants

The following rules should remain true unless there is a compelling reason to change them.

- The filesystem is the source of truth.
- Notes and concepts are different content types.
- Concepts are not references.
- Analysis does not modify source.
- Transformers do not perform rendering.
- React does not parse source.
- MathJax only typesets mathematics.
- Diagnostics should use original source positions.
- Each subsystem should have one responsibility.
- New features should extend existing abstractions before introducing new ones.

---

# Summary

The architecture is intentionally pipeline-based.

Each stage receives data, performs one well-defined task, and passes the result to the next stage.

This allows the language to grow organically while keeping individual subsystems simple, reusable and largely independent.

The overall objective is that implementing future features should primarily involve extending existing stages rather than redesigning them.



Folder Structore
================
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



Content Pipeline
================
# Concept System

## Purpose

The concept system represents reusable knowledge independently of any single note.

A concept is **not** a page and **not** a link. It is structured data from which pages, links and previews are generated.

## Three Representations

### 1. Concept (data)

A TypeScript object containing semantic information.

Examples:

- title
- aliases
- shortDefinition
- notation
- formalDefinition
- prerequisites

This is the single source of truth.

### 2. Generated Concept Page

Generated automatically from the concept data.

Every concept page follows the same structure so authors never rewrite layout.

Concept pages are created through:

Concept → buildConceptPageSource() → transformSource() → MarkdownRenderer

### 3. Concept Reference

Created with:

```text
\concept{force}
```

A concept reference is an inline React component.

Responsibilities:

- link to the concept page
- show a hover preview
- display arbitrary author text

Concept references are **not** document references and do not participate in numbering.

## Lookup

Lookup is provided by ConceptRegistry.

Concept IDs and registered aliases are case-insensitive.

Displayed aliases are arbitrary author text and are never used for lookup.

## Future

- prerequisite graph
- backlinks
- related concepts
- search ranking
- dependency visualization




Language Specification
======================
# Language Specification

**Status:** Living document

**Purpose:** Define the Note Web authoring language independently of its implementation.

**Related documents:**

- Manifesto.md
- Architecture.md
- Content Pipeline.md
- Development Guide.md

---

# Introduction

The Note Web language is a domain-specific language designed for writing technical documents.

It combines:

- Markdown
- LaTeX mathematics
- Custom semantic commands

The language is intentionally small.

New syntax should only be introduced when it clearly improves the writing experience or allows richer semantic information to be expressed.

---

# Language Layers

The language consists of three independent layers.

```text
Markdown

↓

Mathematics

↓

Semantic Commands
```

Each layer has a distinct responsibility.

---

# Markdown

Markdown defines document structure.

Supported constructs include:

- headings
- paragraphs
- emphasis
- lists
- tables
- block quotes
- links
- images
- fenced code
- inline code

Markdown follows GitHub Flavoured Markdown through `remark-gfm`.

The project deliberately reuses standard Markdown instead of inventing alternatives.

---

# Mathematics

Mathematics follows standard LaTeX conventions whenever practical.

## Inline mathematics

```latex
$a^2+b^2=c^2$
```

## Display mathematics

```latex
\[
a^2+b^2=c^2
\]
```

## Numbered equations

```latex
\begin{equation}
F = ma
\label{eq:newton}
\end{equation}
```

## Aligned equations (planned numbering support)

```latex
\begin{align}
F &= ma \\
p &= mv
\end{align}
```

Math syntax should remain familiar to users with existing LaTeX experience.

---

# Semantic Commands

Semantic commands describe meaning rather than appearance.

Unlike mathematics, semantic commands become interactive React components.

Current commands are:

- `\concept`
- `\cref`
- `\Cref`

Future commands should follow the same conventions.

---

# General Command Syntax

Commands use a LaTeX-inspired syntax.

Required argument:

```text
\command{required}
```

Required plus optional argument:

```text
\command{required}[optional]
```

Commands should remain readable in plain text.

---

# \concept

## Purpose

Creates an inline reference to a concept.

The rendered result links to the concept page and shows a hover preview.

## Syntax

```text
\concept{id}
```

or

```text
\concept{id}[display text]
```

## Parameters

### id

Required.

Must refer to an existing concept.

Lookup is case-insensitive.

### display text

Optional.

Controls only the visible text.

It does **not** need to match:

- the concept title
- a registered concept alias

Registered aliases exist for lookup and search, not rendering.

## Examples

Source:

```text
\concept{force}
```

Rendered:

```text
Force
```

Source:

```text
\concept{force}[net force]
```

Rendered:

```text
net force
```

## Validation

Errors:

- missing id
- unknown concept

Warnings:

- empty display text

---

# \cref

## Purpose

Creates a reference to numbered objects inside the current note.

## Syntax

```text
\cref{label}
```

Multiple references:

```text
\cref{label1,label2,label3}
```

Whitespace around commas is ignored.

## Behaviour

Single reference:

```text
\cref{eq:newton}
```

↓

```text
equation 1
```

The entire phrase is clickable.

Multiple references:

```text
\cref{eq:newton,eq:energy,eq:momentum}
```

↓

```text
equations 1, 2, and 3
```

Each number is individually clickable.

## Validation

Errors:

- empty label list
- unknown label

Unknown labels should produce typo suggestions whenever possible.

---

# \Cref

`\Cref` behaves identically to `\cref`, except that the first word is capitalized.

Example:

```text
\Cref{eq:newton}
```

↓

```text
Equation 1
```

---

# Labels

Labels associate identifiers with numbered objects.

Example:

```latex
\label{eq:newton}
```

Labels are:

- local to one note
- case-sensitive

Planned namespaces:

- `eq:`
- `fig:`
- `tab:`
- `sec:`

---

# Code Regions

Semantic commands are ignored inside:

- inline code
- fenced code blocks

Example:

````markdown
`\concept{force}`
````

renders literally.

Likewise:

````markdown
```latex
\concept{force}
```
````

is documentation rather than an active command.

---

# Error Philosophy

The language should favour explicit diagnostics over silent behaviour.

Whenever possible the system should:

- explain the error
- identify its location
- suggest a correction

rather than guessing the author's intention.

---

# Planned Language Features

Mathematics:

- numbered align
- subequations

Document elements:

- figures
- subfigures
- tables

Semantic elements:

- definitions
- examples
- theorems
- proofs
- exercises

References:

- section references
- cross-note references

Interactive features:

- equation previews
- interactive diagrams
- simulations

---

# Compatibility Philosophy

Markdown should remain standard whenever possible.

Mathematics should remain close to LaTeX.

Custom commands should extend the language instead of replacing familiar syntax.

A user familiar with Markdown and LaTeX should feel comfortable writing Note Web documents immediately.

---

# Summary

The Note Web language is intentionally semantic, compact and extensible.

Authors should describe the meaning of technical content rather than its appearance.

Whenever a new feature is proposed, first ask:

> Does this belong in the language?

Only afterwards should implementation be considered.



Concept System
==============
# Concept System

## Purpose

The concept system represents reusable knowledge independently of any single note.

A concept is **not** a page and **not** a link. It is structured data from which pages, links and previews are generated.

## Three Representations

### 1. Concept (data)

A TypeScript object containing semantic information.

Examples:

- title
- aliases
- shortDefinition
- notation
- formalDefinition
- prerequisites

This is the single source of truth.

### 2. Generated Concept Page

Generated automatically from the concept data.

Every concept page follows the same structure so authors never rewrite layout.

Concept pages are created through:

Concept → buildConceptPageSource() → transformSource() → MarkdownRenderer

### 3. Concept Reference

Created with:

```text
\concept{force}
```

A concept reference is an inline React component.

Responsibilities:

- link to the concept page
- show a hover preview
- display arbitrary author text

Concept references are **not** document references and do not participate in numbering.

## Lookup

Lookup is provided by ConceptRegistry.

Concept IDs and registered aliases are case-insensitive.

Displayed aliases are arbitrary author text and are never used for lookup.

## Future

- prerequisite graph
- backlinks
- related concepts
- search ranking
- dependency visualization




Reference System
================
# Reference System

## Purpose

The reference system connects numbered objects to inline references.

## Vocabulary

### Numbered Object

Anything that receives an automatic number.

Examples:

- equation
- figure (future)
- table (future)

### Reference Target

A numbered object that also owns a label.

Example:

```latex
\begin{equation}
F=ma
\label{eq:newton}
\end{equation}
```

Every reference target is a numbered object.

Not every numbered object is a reference target.

### Reference

An inline command that points to a reference target.

```text
\cref{eq:newton}
```

## Current Flow

Equation analysis

↓

ReferenceTarget[]

↓

ReferenceRegistry

↓

transformReferenceCommands()

↓

Reference tokens

↓

React renderer

## Registry

ReferenceRegistry owns lookup.

Responsibilities:

- find()
- findMany()
- labels()
- has()

Labels are local to a note and case-sensitive.

## Numbering

Reference numbers are stored structurally:

```ts
{
  primary: 3,
  sub?: "a"
}
```

This prepares the system for subequations and subfigures.

## Future

- align rows
- subequations
- figures
- tables
- section references
- cross-note references
- hover previews for references




Command System
==============
# Command System

## Purpose

Commands extend the language with semantic features.

The command system intentionally separates parsing from rendering.

## Pipeline

Source

↓

Transformer

↓

Encoded command token

↓

Markdown parser

↓

rehypeCommandTokens

↓

React renderer

## Why Tokens?

Rendering directly during transformation would break Markdown layout.

Encoding commands as invisible tokens allows Markdown to parse normally before React components are injected.

This preserves inline flow automatically.

## Responsibilities

### Transformer

Recognizes command syntax.

Validates arguments.

Produces diagnostics.

Encodes command tokens.

### CommandToken

Owns serialization and deserialization.

No other subsystem should know the token format.

### rehypeCommandTokens

Finds tokens inside text nodes.

Replaces them with command elements.

Skips inline and fenced code.

### Command Registry

Maps command names to React renderers.

Current commands:

- concept
- reference
- reference-anchor

### Renderer

Converts semantic commands into React components.

Renderers never parse source.

## Adding a New Command

1. Decide the language syntax.
2. Determine whether analysis is required.
3. Write a transformer.
4. Produce command tokens.
5. Register a renderer.
6. Add diagnostics.
7. Update Language Specification.md.

## Guiding Principle

A command should own only its own semantics.

Shared infrastructure belongs in the command system, not in individual commands.




Design Decisions
================
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




Data Model
==========
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




Glossary
========
# Glossary

**Status:** Living document

**Purpose:** Define the terminology used throughout the Note Web project.

## Analyzer
A component that inspects content without modifying it. Produces metadata and diagnostics.

## Builder
A deterministic component that derives new structures from loaded models.

## Command
A semantic language feature written using LaTeX-like syntax, e.g. `\concept{}` or `\cref{}`.

## Command Token
The encoded intermediate representation of a command used between transformation and rendering.

## Concept
Structured knowledge represented as data. A concept is not a page and not a reference.

## Concept Page
A generated document built from a Concept.

## Concept Reference
An inline command that links to a concept page and provides a hover preview.

## Diagnostic
A warning or error associated with a source location.

## Document
A rendered note or generated concept page.

## Loader
Discovers authored content and constructs domain models.

## Note
An authored `.mdx` document.

## Numbered Object
Any object that receives an automatic number.

## Reference
An inline command that points to a ReferenceTarget.

## Reference Registry
Per-note lookup structure for labels.

## Reference Target
A labelled numbered object.

## Registry
A lookup structure over semantic objects.

## Renderer
A React component responsible for presentation.

## Source
The authored Markdown/LaTeX text before rendering.

## Transformer
A component that rewrites source into source.

## Typesetting
The process by which MathJax converts mathematics into SVG.




Diagnostics
===========
# Diagnostics

## Purpose

Diagnostics report problems in authored content without crashing the application.

## Principles

- Prefer reporting over failing.
- Report original source locations.
- Continue collecting additional diagnostics whenever practical.

## Severities

- Error
- Warning

## Typical Errors

- Unknown concept
- Unknown reference
- Duplicate label
- Missing title

## Typical Warnings

- Empty alias
- Empty optional text
- Questionable label prefix

## Pipeline

Diagnostics may originate from:

- analyzers
- transformers

They are accumulated and displayed together.

Programming errors are not diagnostics and should generally fail fast.




Rendering
=========
# Rendering

## Overview

Rendering transforms processed content into an interactive web page.

Pipeline:

Markdown
↓
remark
↓
rehype
↓
React
↓
MathJax
↓
Browser

## Responsibilities

### Markdown

Parses document structure.

### rehype

Replaces command tokens with React components.

### React

Renders semantic components.

### MathJax

Typesets mathematics and visible equation numbers.

## Principles

- Rendering never performs parsing.
- Rendering never validates source.
- Rendering consumes semantic objects created earlier in the pipeline.




Development Guide
=================
# Development Guide

## Philosophy

Prefer extending existing abstractions over introducing new ones.

## Adding a Language Feature

1. Define the language syntax.
2. Update Language Specification.md.
3. Decide whether analysis is required.
4. Add analyzers if necessary.
5. Add transformers.
6. Add renderers.
7. Add diagnostics.
8. Update documentation.
9. Test valid and invalid cases.
10. Commit using Conventional Commits.

## Adding a Command

- Create transformer.
- Encode command token.
- Register renderer.
- Implement React renderer.

## Coding Principles

- High cohesion.
- Low coupling.
- Single responsibility.
- Deterministic builders.
- Parsers never rewrite.
- Renderers never parse.

## Commit Style

Examples:

- feat:
- fix:
- refactor:
- docs:
- chore:




Roadmap
=======
# Roadmap

## Completed

- Navigation
- Markdown rendering
- MathJax integration
- Concept system
- Generated concept pages
- Hover tooltips
- Diagnostics
- Local references
- Multiple references
- Reference registry

## Next

1. align reference targets
2. subequations
3. figures
4. subfigures
5. tables
6. section references

## Medium Term

- equation previews
- cross-note references
- search
- backlinks
- prerequisite graph

## Long Term

- interactive simulations
- animations
- quizzes
- theorem environments
- citations
- bibliography
- caching
- plugin architecture (if ever needed)

This roadmap is intentionally flexible and should evolve with the project.
