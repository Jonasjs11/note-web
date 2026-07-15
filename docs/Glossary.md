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
