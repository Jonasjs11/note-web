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
