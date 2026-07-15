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
