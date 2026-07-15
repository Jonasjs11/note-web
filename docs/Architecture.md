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