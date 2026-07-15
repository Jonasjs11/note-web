# Content Pipeline

**Status:** Living document

**Purpose:** Describe the complete lifecycle of a document, from a source `.mdx` file to an interactive web page.

**Related documents:**

- Architecture.md
- Folder Structure.md
- Language Specification.md
- Development Guide.md

---

# Overview

Every document passes through a fixed sequence of stages.

```
Filesystem

↓

Loading

↓

Analysis

↓

Transformation

↓

Markdown Parsing

↓

rehype Processing

↓

React Rendering

↓

MathJax Typesetting

↓

Browser
```

Each stage has exactly one responsibility.

The output of one stage becomes the input of the next.

---

# Why a Pipeline?

The pipeline architecture exists to separate responsibilities.

Instead of one large system that simultaneously:

- parses Markdown,
- validates references,
- renders React,
- generates tooltips,
- numbers equations,

each responsibility is isolated.

This makes new language features much easier to implement.

---

# Stage 1 — Filesystem

Input:

```
notes/

    mathematics/

        algebra/

            vectors.mdx
```

Responsibilities:

- discover note files
- preserve folder hierarchy
- provide stable filenames

No parsing occurs here.

The filesystem is considered the source of truth.

---

# Stage 2 — Loading

Performed by:

```
loadNotes()
```

Input:

```
MDX file
```

Output:

```
Raw note model
```

Responsibilities:

- read note source
- determine URL
- determine subject
- determine folder hierarchy
- invoke later pipeline stages

The loader coordinates the pipeline.

It should not contain feature-specific logic.

---

# Stage 3 — Analysis

Analysis reads content.

It never modifies content.

Current analyzers include:

```
Title analysis

Reference-target analysis
```

Future analyzers include:

```
Figure analysis

Citation analysis

Definition analysis
```

The purpose of analysis is to discover information.

Examples include:

- titles
- labels
- numbering
- diagnostics
- metadata

---

## Title Analysis

Input:

```
Markdown source
```

Output:

```
Document title
```

Responsibilities:

- find first H1
- detect duplicates
- generate diagnostics

The visible page title comes from here.

---

## Reference Target Analysis

Input:

```
Markdown source
```

Output:

```
ReferenceTarget[]
```

Responsibilities:

- discover numbered equations
- assign numbers
- discover labels
- validate labels
- detect duplicates
- build reference targets

Important:

Every numbered equation receives a number.

Only labelled equations become reference targets.

This distinction is fundamental.

---

# Stage 4 — Transformation

Input:

```
Source

↓

Source
```

Transformers may:

- rewrite syntax
- insert command tokens
- normalize language
- generate diagnostics

Transformers execute sequentially.

Current order:

```
Concept Commands

↓

Reference Commands

↓

LaTeX Normalization
```

Ordering matters.

---

## Why ordering matters

Some transformers produce diagnostics.

Other transformers change line numbers.

Therefore:

```
Validation

↓

Transformation
```

must happen before large structural rewrites.

Otherwise diagnostics no longer point to the correct source lines.

---

## Concept Transformer

Input:

```
\concept{force}
```

Output:

```
command token
```

Responsibilities:

- validate concept IDs
- resolve aliases
- create command tokens

The transformer does not render React.

---

## Reference Transformer

Input:

```
\cref{eq:newton}
```

Output:

```
reference command token
```

Responsibilities:

- validate labels
- create clickable references
- insert reference anchors
- generate diagnostics

Reference lookup uses the per-note ReferenceRegistry.

---

## LaTeX Transformer

Input:

LaTeX-style author syntax.

Output:

Syntax understood by remark-math.

Responsibilities:

- normalize delimiters
- preserve author-friendly syntax

It intentionally performs no mathematical rendering.

---

# Stage 5 — Markdown Parsing

Performed by:

- react-markdown
- remark-gfm
- remark-math

Input:

```
Markdown text
```

Output:

```
Markdown syntax tree
```

The project intentionally delegates Markdown parsing to mature libraries.

The project should not implement its own Markdown parser.

---

# Stage 6 — rehype Processing

Input:

Markdown syntax tree.

Output:

Modified syntax tree.

Current responsibilities:

- locate command tokens
- replace tokens with React elements

Important:

Commands are ignored inside:

```
inline code

fenced code
```

This behaviour is intentional.

Documentation examples should remain literal.

---

# Stage 7 — React Rendering

Input:

React tree.

Responsibilities:

- render notes
- render concepts
- render tooltips
- render references

React performs presentation only.

Parsing has already completed.

---

# Stage 8 — MathJax

MathJax performs visual mathematics.

Responsibilities:

- typeset equations
- assign visible equation numbers
- generate SVG

MathJax does not:

- analyse labels
- resolve references
- generate diagnostics

Those tasks have already completed.

Before typesetting begins:

```
texReset()
```

resets equation numbering.

During cleanup:

```
typesetClear()
```

removes previous MathJax state.

---

# Stage 9 — Browser

The browser receives a fully interactive document.

Every command has already become a React component.

No parsing should occur here.

---

# Data Flow

A simplified view:

```
Raw source

↓

Loader

↓

Analyzer

↓

Transformer

↓

Markdown

↓

rehype

↓

React

↓

MathJax

↓

Browser
```

Each stage should receive a cleaner representation than the previous one.

---

# Diagnostics

Diagnostics may be generated by multiple stages.

Current producers include:

- title analysis
- reference analysis
- concept transformer
- reference transformer

Diagnostics are accumulated.

A note may contain many diagnostics.

The pipeline continues whenever possible.

This allows one mistake to reveal additional mistakes.

---

# Error Philosophy

Content errors should not crash the application.

Instead:

```
Invalid note

↓

Diagnostic page
```

Other notes should continue functioning normally.

Programming errors are different.

They should generally fail fast.

---

# Pipeline Ownership

Each stage owns specific responsibilities.

Filesystem

- discovers files

Loaders

- coordinate loading

Analyzers

- inspect

Transformers

- rewrite

Markdown

- parse

rehype

- inject React

React

- render

MathJax

- typeset

Browser

- display

Responsibility should never leak between stages.

---

# Adding a New Language Feature

When implementing a feature, first determine which stages it requires.

Example:

```
\concept{}
```

Needed:

- transformer
- renderer

Example:

```
\cref{}
```

Needed:

- analyzer
- registry
- transformer
- renderer

Future:

```
\figure{}
```

will likely require:

- analyzer
- numbering
- registry
- transformer
- renderer

Thinking in terms of pipeline stages prevents unnecessary coupling.

---

# Future Evolution

The pipeline is intentionally extensible.

Planned future stages include support for:

- align environments
- subequations
- figures
- subfigures
- tables
- section references
- citations
- theorem environments

These should integrate into the existing pipeline rather than introducing parallel systems.

---

# Summary

Every document passes through the same sequence of stages.

Each stage performs one well-defined task before passing its result to the next.

This architecture keeps responsibilities isolated, diagnostics accurate, and new language features relatively easy to implement.

The pipeline is the backbone of Note Web.

Whenever a new feature is proposed, the first question should be:

> Which stage of the pipeline is responsible for this?