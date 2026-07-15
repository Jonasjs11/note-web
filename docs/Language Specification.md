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