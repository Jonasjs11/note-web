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
