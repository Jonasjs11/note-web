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
