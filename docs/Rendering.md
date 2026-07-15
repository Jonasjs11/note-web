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
