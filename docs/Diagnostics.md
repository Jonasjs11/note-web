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
