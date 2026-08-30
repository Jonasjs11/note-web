# Calculator Feature Documentation

This document describes the complete `calculator` environment currently implemented in **note-web**.

It covers:

- Blank/free calculators.
- Predefined formula calculators.
- Author options.
- Formula syntax.
- Reader input syntax.
- Variable-expression inputs.
- Repeated variables.
- Degree/radian handling.
- Result formatting and precision.
- The live LaTeX preview.
- Formula/Free mode switching.
- Error behavior.
- Responsive/theme behavior.
- The parser/evaluator architecture.
- Relevant source files.
- Current limitations and design notes.

---

## 1. Overview

The calculator feature adds interactive calculators directly to note content with a LaTeX-style block environment:

```latex
\begin{calculator}
...
\end{calculator}
```

There are two main forms:

1. **Blank/free calculator** — no formula is authored. The reader types an expression.
2. **Predefined formula calculator** — the note author defines an output and a formula containing input placeholders such as `[m]`, `[v]`, or `[theta]`.

A predefined calculator can also be switched by the reader into **Free** mode and switched back to **Formula** mode.

No JavaScript `eval()` or `Function()` is used for mathematical expressions. Calculator expressions are tokenized and parsed into an internal expression tree, then evaluated safely.

---

# 2. Blank / Free Calculator

Create a blank calculator with:

```latex
\begin{calculator}
\end{calculator}
```

The reader sees a text input and calculator controls.

A free calculator evaluates an expression when the reader places an equals sign at the end:

```text
2 + 2 =
```

Result:

```text
4
```

Without the final `=`, the expression can still be parsed for the live preview, but the numeric result is not displayed.

For example:

```text
sqrt(2*pi)
```

can be previewed, while:

```text
sqrt(2*pi) =
```

shows the result.

Only the final trailing equals sign has calculator meaning. A free expression is not an equation solver.

---

# 3. Predefined Formula Calculator

A predefined calculator has the form:

```latex
\begin{calculator}
OUTPUT = EXPRESSION
\end{calculator}
```

Reader-editable variables are marked with square brackets:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

The output `F` is fixed by the author. The reader enters expressions for `m` and `a`.

A trailing author-side equals sign is optional:

```latex
\begin{calculator}
F=[m][a]=
\end{calculator}
```

and:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

represent the same calculator.

The predefined formula is parsed when note content is transformed. Invalid author syntax becomes a note diagnostic rather than a broken interactive calculator.

---

# 4. Author Options

Options are placed immediately after `\begin{calculator}`:

```latex
\begin{calculator}[precision=5,format=scientific,angle=deg,angle-lock=true]
...
\end{calculator}
```

Options are comma-separated `key=value` pairs.

## 4.1 `precision`

```latex
precision=6
```

Default:

```text
6
```

Allowed range:

```text
1 to 15
```

`precision` means **significant digits**, not decimal places.

Examples:

```latex
\begin{calculator}[precision=3]
\end{calculator}
```

```latex
\begin{calculator}[precision=8]
E=0.5*[m]*[v]^2
\end{calculator}
```

An invalid value such as `precision=0`, `precision=20`, or `precision=3.5` produces an author diagnostic.

---

## 4.2 `format`

Sets the initial result display format.

Allowed values:

```text
decimal
scientific
```

Default:

```text
decimal
```

Example:

```latex
\begin{calculator}[format=scientific]
\end{calculator}
```

The reader can switch the format using the `123` / `1e3` control.

Scientific output is displayed in a form similar to:

```text
6.022 × 10²³
```

Decimal output uses significant-digit formatting without digit grouping.

---

## 4.3 `preview`

Sets whether the live LaTeX preview is initially visible for a blank/free calculator.

Allowed values:

```text
true
false
```

Default:

```text
false
```

Example:

```latex
\begin{calculator}[preview=true]
\end{calculator}
```

The reader can toggle the preview with the **Preview** button.

Currently, predefined formulas use the custom formula renderer directly; `preview` is primarily relevant to a calculator that starts in Free mode.

---

## 4.4 `angle`

Sets the initial trigonometric angle mode.

Accepted radian values:

```text
rad
radian
radians
```

Accepted degree values:

```text
deg
degree
degrees
```

Default:

```text
radians
```

Examples:

```latex
\begin{calculator}[angle=deg]
\end{calculator}
```

```latex
\begin{calculator}[angle=rad]
y=[A]*sin([theta])
\end{calculator}
```

---

## 4.5 `angle-lock`

Locks the Rad/Deg selector while a **predefined formula** is active.

Allowed values:

```text
true
false
```

Default:

```text
false
```

Example:

```latex
\begin{calculator}[angle=deg,angle-lock=true]
y=[A]*sin([theta])
\end{calculator}
```

In Formula mode, the reader cannot change the angle mode.

If the reader switches the calculator to **Free** mode, the angle control is unlocked. This is intentional: the author lock applies to the authored formula, not to the reader's temporary general-purpose calculator.

Using `angle-lock=true` on a completely blank calculator does not lock the reader's calculator and produces an author warning.

---

# 5. Formula Variable Syntax

User inputs in a predefined formula are marked with square brackets:

```text
[m]
[v]
[t]
```

Subscripts are supported:

```text
[m_1]
[v_0]
[v_f]
[T_2]
```

Greek variable names can be written in a convenient plain form:

```text
[theta]
[rho]
[lambda]
[omega]
```

or with a backslash form:

```text
[\theta]
[\rho]
[\lambda]
```

The UI renders recognized Greek names as Greek glyphs.

Examples:

```latex
\begin{calculator}
x=[v_0][t]+\frac{1}{2}[a][t]^2
\end{calculator}
```

```latex
\begin{calculator}[angle=deg]
y=[A]*sin([theta])
\end{calculator}
```

---

# 6. Output Labels

The left-hand output label is predefined by the note author:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Typical labels include:

```text
F
E
v
v_f
T_1
theta
\theta
```

The output is not a reader input. It reminds the reader what the calculated result represents.

Keep output labels simple: normally one symbol, optionally with a subscript, or a supported Greek symbol.

---

# 7. Repeated Variables

A variable may appear more than once:

```latex
\begin{calculator}
y=[x]^2+2*[x]+1
\end{calculator}
```

Only the **first occurrence** of `x` is editable.

Later occurrences:

- Look like calculator variable fields.
- Are greyed out / disabled.
- Display the **computed numeric value** of the first field.
- Use the same value in the formula evaluation.

For example, if the first `x` contains:

```text
2*pi
```

the later `x` field shows the computed value of `2*pi`, according to the current precision and result format.

The reader does not need to enter the same value more than once.

---

# 8. Variable Fields Are Mini Calculators

A predefined variable field is not limited to a literal number.

The reader can enter a full calculator expression:

```text
pi
2*pi
sqrt(2)
1e3/4
sin(pi/2)
(3+4)^2
```

That expression is evaluated first.

Its resulting number is then supplied to the authored formula.

For example:

```latex
\begin{calculator}
C=2*pi*[r]
\end{calculator}
```

The reader could enter this for `r`:

```text
sqrt(2)
```

The calculator first evaluates:

```text
r = sqrt(2)
```

and then evaluates the authored circumference formula.

A trailing equals sign inside a variable field is accepted but not required:

```text
2*pi
```

and:

```text
2*pi =
```

both work.

Variable-field trig expressions use the predefined calculator's current Rad/Deg mode.

---

# 9. Supported Reader Expression Syntax

The same expression language is used by:

- Free calculator input.
- Predefined variable fields.

The author formula language uses the same mathematical parser but additionally supports `[variable]` placeholders and formula-oriented LaTeX-like syntax.

---

## 9.1 Numbers

Examples:

```text
12
-12
0.5
.5
12.
+3.7
```

Scientific notation:

```text
1e3
1E3
6.022e23
2.5e-8
1e+12
```

Partially typed scientific notation such as:

```text
1e-
```

is treated as incomplete while the reader is typing instead of immediately producing a noisy error.

---

## 9.2 Addition and subtraction

```text
2+3
10-4
-5+2
3--2
```

Unicode minus/dash forms are normalized as subtraction where supported.

---

## 9.3 Multiplication

Explicit multiplication:

```text
2*3
2×3
2·3
2⋅3
```

LaTeX-like multiplication:

```text
2\cdot3
2\times3
```

Implicit multiplication is supported in useful forms:

```text
2pi
2(pi+1)
(2+3)(4+5)
2sin(pi/2)
```

In predefined author formulas, bracket variables make implicit products unambiguous:

```latex
[m][a]
2[m]
[r][theta]
```

---

## 9.4 Division

```text
10/2
```

Unicode:

```text
10÷2
```

LaTeX-like:

```text
10\div2
```

The author language also supports fractions:

```latex
\frac{[a]}{[b]}
```

`\frac` may also be used in an expression parsed by the calculator language when written with grouped numerator and denominator.

---

## 9.5 Powers

```text
2^8
```

and:

```text
2**8
```

both mean exponentiation.

Examples:

```text
3^2
10^-3
(2+3)^4
sqrt(2)^2
```

In a predefined formula:

```latex
E=0.5*[m]*[v]^2
```

Powers are rendered with a raised exponent.

---

## 9.6 Parentheses and braces

Parentheses:

```text
(2+3)*4
```

Braces can also act as parser groups:

```text
{2+3}*4
```

Function arguments may use groups such as:

```text
sin(pi/2)
```

or:

```text
sin{pi/2}
```

---

# 10. Constants

Built-in constants:

| Input | Meaning |
|---|---|
| `pi` | π |
| `π` | π |
| `\pi` | π |
| `e` | Euler's number |

Examples:

```text
2*pi
```

```text
pi^2
```

```text
exp(1)
```

---

# 11. Supported Functions

The current calculator evaluator supports the following functions.

## 11.1 Trigonometric

```text
sin(x)
cos(x)
tan(x)
```

## 11.2 Inverse trigonometric

```text
asin(x)
acos(x)
atan(x)
```

For `asin` and `acos`, real-valued inputs must be in:

```text
-1 <= x <= 1
```

## 11.3 Hyperbolic

```text
sinh(x)
cosh(x)
tanh(x)
```

Hyperbolic functions are not affected by Rad/Deg mode.

## 11.4 Roots and absolute value

```text
sqrt(x)
abs(x)
```

A real-number square root of a negative number is reported as undefined.

## 11.5 Exponential and logarithms

```text
exp(x)
ln(x)
log(x)
log10(x)
```

Meanings:

- `exp(x)` = `e^x`
- `ln(x)` = natural logarithm
- `log(x)` = base-10 logarithm
- `log10(x)` = base-10 logarithm

The logarithm inputs must be positive for real-number results.

## 11.6 Rounding / sign

```text
floor(x)
ceil(x)
round(x)
sign(x)
```

## 11.7 Multiple arguments

```text
min(a,b,...)
max(a,b,...)
pow(a,b)
```

Examples:

```text
min(4,2,9,-1)
max(4,2,9,-1)
pow(2,10)
```

`pow(a,b)` is another way of expressing:

```text
a^b
```

Functions require a parenthesis or brace group. For example:

```text
sin(2)
```

is valid, but writing only:

```text
sin
```

is not a complete function call.

---

# 12. Radians and Degrees

The calculator has a **Rad / Deg** selector.

Default:

```text
Rad
```

In radians:

```text
sin(pi/2) = 1
```

In degrees:

```text
sin(90) = 1
```

Degree mode applies to:

```text
sin
cos
tan
asin
acos
atan
```

For direct trig:

- `sin`, `cos`, `tan` interpret their input in degrees.

For inverse trig:

- `asin`, `acos`, `atan` return degrees.

Examples in degree mode:

```text
sin(30) = 0.5
cos(60) = 0.5
asin(1) = 90
```

The evaluator special-cases exact quarter-turn degree angles so common values such as `sin(180)` and `cos(90)` do not expose tiny floating-point remnants.

`tan(90)` in degree mode is reported as undefined.

---

# 13. Result Format

Every calculator has two result-display choices:

```text
123
1e3
```

`123` means decimal display.

`1e3` means scientific display.

The actual scientific output is formatted visually, for example:

```text
1.235 × 10⁸
```

The reader may switch format at any time.

Predefined repeated-variable mirror fields use the same precision and current formula result format.

---

# 14. Precision

Precision controls the maximum number of **significant digits** shown in results.

Default:

```text
6
```

Example:

```latex
\begin{calculator}[precision=4]
\end{calculator}
```

A value such as:

```text
12345.678
```

may display as approximately:

```text
12350
```

in decimal mode with four significant digits, or:

```text
1.235 × 10⁴
```

in scientific mode.

Precision affects display. The underlying expression is evaluated with JavaScript numeric precision before formatting.

---

# 15. Free Calculator Toolbar

The free calculator currently provides expression helper buttons for:

- Fraction (`a/b`)
- Power (`xʸ`)
- Square root (`√`)
- Pi (`π`)
- Sine (`sin`)
- Natural logarithm (`ln`)

These insert text snippets at the current cursor location.

For example, the fraction helper inserts:

```text
()/()
```

The square-root helper inserts:

```text
sqrt()
```

The helper buttons are conveniences. The reader can always type calculator syntax directly.

The right-hand controls provide:

- Preview on/off.
- Rad / Deg.
- Decimal / scientific result format.
- Formula/Free mode switch when applicable.

---

# 16. Live LaTeX Preview

A free calculator can show a live MathJax preview of the parsed expression.

Toggle it with:

```text
Preview
```

The preview is:

- Compact by default.
- Expandable with the `+` control.
- Reducible with the `−` control.
- Horizontally scrollable if an unusually wide expression requires it.
- Not intended to use a separate vertical scrolling viewport.

The preview is generated from the calculator's parsed expression tree, not by directly injecting arbitrary reader input as LaTeX.

This is useful for catching typing mistakes in expressions such as:

```text
(1+2)/(3+4)
```

or:

```text
sqrt(2*pi)^3
```

before adding the final `=`.

If the expression cannot currently be parsed, the preview displays a completion message instead of malformed math.

---

# 17. Formula Rendering

Predefined formulas are not rendered by trying to insert HTML inputs into normal MathJax output.

Instead, the calculator has its own compact React/CSS math renderer.

It directly renders:

- Numbers.
- Constants.
- Variables.
- Operators.
- Fractions.
- Powers.
- Parentheses.
- Square roots.
- Named functions.

Fractions are laid out as numerator and denominator separated by a CSS fraction line.

Powers are displayed with a smaller raised exponent.

Function names such as:

```text
sin
cos
ln
```

are rendered upright rather than italic, matching normal mathematical typography.

The design intentionally supports the subset of mathematics useful for interactive calculators rather than attempting to become a complete LaTeX renderer.

---

# 18. Formula / Free Switching

Every predefined formula calculator includes a:

```text
Free
```

button.

This temporarily turns the block into a regular free calculator.

The Free calculator includes a:

```text
Formula
```

button to return to the authored formula.

Both sides preserve state while the calculator remains mounted.

Formula state includes:

- Variable expressions.
- Computed repeated-variable values.
- Formula result format.
- Formula angle mode where editable.

Free state includes:

- Free expression text.
- Its calculated result.
- Result format.
- Rad/Deg mode.
- Preview on/off.
- Preview compact/expanded state.

When Free mode is opened for the first time, it starts from the Formula calculator's current result format and angle mode.

An author angle lock never prevents the reader from changing Rad/Deg in Free mode.

Calculator state is component-local; it is not currently persisted to browser storage across a full page reload or remount.

---

# 19. Error and Incomplete-Input Behavior

The feature distinguishes author errors, reader syntax errors, incomplete typing, and mathematically undefined results.

## 19.1 Author errors

Invalid predefined syntax is reported through the note diagnostic system.

Examples include:

- Missing output assignment.
- Invalid output label.
- Malformed fraction/grouping.
- Unknown formula name.
- Invalid `[variable]`.
- More than one top-level equals sign.
- A predefined formula with no input variables.
- Invalid calculator option values.

The note can therefore be marked invalid before a broken calculator reaches normal rendering.

---

## 19.2 Incomplete reader input

While typing, incomplete values are kept quiet where possible.

Examples:

```text
1e-
sqrt(
2*
```

The UI does not need to display `NaN` simply because the reader has not finished typing.

---

## 19.3 Undefined results

Undefined real-number calculations are shown as:

```text
undefined
```

with a descriptive message.

Examples:

```text
1/0
sqrt(-1)
ln(-2)
acos(2)
```

The calculator does not expose raw JavaScript `Infinity` or `NaN` as the answer.

---

## 19.4 Syntax errors

Malformed expressions display:

```text
error
```

with a parser message.

For example, unknown names or unmatched groups are surfaced as reader-visible calculation errors.

---

# 20. Real-Number Scope

The calculator is currently a **real-number calculator**.

It does not implement complex arithmetic.

Therefore expressions such as:

```text
sqrt(-1)
```

or a power operation that only has a complex result are reported as undefined.

---

# 21. Responsive and Theme Behavior

The calculator is designed to work inside the existing note layout on desktop and mobile.

Important behavior:

- Predefined formulas stay compact.
- Wide formulas may scroll horizontally rather than wrapping into a very tall block.
- Variable inputs are kept reasonably small but wide enough for expressions such as `sqrt(2)`.
- Repeated variables are visually disabled.
- Toolbar controls can reflow for narrow screens.
- The live preview is compact by default.
- The calculator uses the site's existing theme/color variables rather than hard-coded light-only colors.
- It is intended to remain readable in both light and dark themes.

---

# 22. Accessibility Behavior

The implementation uses normal form elements.

Examples include:

- Native text inputs.
- Native buttons.
- `aria-label` values for variable inputs.
- Disabled repeated-variable mirror fields.
- `aria-pressed` for segmented/toggle controls.
- `aria-live="polite"` on results.

Editable variables are labelled conceptually as:

```text
Expression for m
```

Repeated mirrors are labelled as:

```text
Computed value for m
```

---

# 23. Calculator Expression Architecture

The calculator uses a small parser and expression tree.

For example:

```text
2*pi*r^2
```

is conceptually represented as a tree containing multiplication, constants, and a power operation.

The actual node types include:

- `number`
- `variable`
- `constant`
- `unary`
- `binary`
- `function`

Binary operators include:

```text
+
-
*
/
^
```

This expression tree is useful because the same parsed expression can be:

1. Evaluated numerically.
2. Rendered as a custom predefined formula.
3. Converted back into LaTeX for the free calculator preview.

This avoids maintaining three unrelated interpretations of the same expression.

---

# 24. Parsing Stages

A calculator block follows this broad flow:

```text
note source
    ↓
transformCalculatorEnvironments
    ↓
parse calculator options
    ↓
validate predefined formula, if present
    ↓
encode calculator command token
    ↓
Markdown/command rendering
    ↓
CalculatorCommandRenderer
    ↓
Calculator React component
```

Inside the calculator:

```text
expression text
    ↓
tokenizer
    ↓
parser
    ↓
expression tree
    ↓
evaluator / formula renderer / LaTeX converter
```

---

# 25. Relevant Source Files

Core calculator files:

```text
src/calculators/Calculator.tsx
src/calculators/Calculator.css
src/calculators/CalculatorExpression.ts
```

Content integration:

```text
src/content/transformers/transformCalculatorEnvironments.ts
src/content/commands/renderers/CalculatorCommandRenderer.tsx
src/content/commands/CommandToken.ts
```

The command is also integrated into the site's command registry and source-transform pipeline.

### Responsibilities

`CalculatorExpression.ts`

- Tokenization.
- Parsing.
- Expression-tree types.
- Formula-definition parsing.
- Variable collection.
- Evaluation.
- Rad/Deg behavior.
- Domain checks.
- LaTeX conversion.

`Calculator.tsx`

- Blank calculator UI.
- Predefined calculator UI.
- Variable-expression evaluation.
- Repeated-variable mirrors.
- Formula/Free state.
- Toolbar controls.
- Preview state.
- Result formatting.
- Custom expression rendering.

`Calculator.css`

- Responsive calculator layout.
- Fraction/power/root styling.
- Variable field styling.
- Mirror/disabled states.
- Toolbars.
- Preview sizing.
- Theme-aware visual presentation.

`transformCalculatorEnvironments.ts`

- Finds `calculator` environments.
- Parses options.
- Applies defaults.
- Validates predefined formulas.
- Produces diagnostics.
- Converts the environment to a calculator command token.

`CalculatorCommandRenderer.tsx`

- Decodes command arguments.
- Applies safe fallbacks.
- Instantiates the Calculator component.

---

# 26. No Additional Runtime Dependency

The feature does not require a new calculator/math parsing npm package.

The expression parser/evaluator is implemented in the project.

The free preview uses the site's existing MathJax setup.

---

# 27. Recommended Authoring Style

For readability, prefer bracket placeholders for all reader-provided quantities:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Prefer explicit `*` where adjacency would be difficult for a human to read:

```latex
\begin{calculator}
E=0.5*[m]*[v]^2
\end{calculator}
```

Use `\frac` when the fraction structure is important visually:

```latex
\begin{calculator}
F=[G]\frac{[m_1]*[m_2]}{[r]^2}
\end{calculator}
```

Use plain Greek names when convenient:

```latex
\begin{calculator}[angle=deg]
y=[A]*sin([theta])
\end{calculator}
```

Use `angle-lock=true` when a formula is physically or pedagogically defined to expect a specific angle unit:

```latex
\begin{calculator}[angle=deg,angle-lock=true]
h=[d]*tan([theta])
\end{calculator}
```

---

# 28. Current Limitations

The current implementation intentionally has boundaries.

- It is not a complete LaTeX parser.
- It is not a complete MathJax replacement.
- It is a real-number calculator, not a complex-number system.
- It does not solve equations symbolically.
- It does not infer units or perform dimensional analysis.
- It does not currently persist state across a full page reload.
- Free mode does not support arbitrary named symbolic variables; it evaluates numeric expressions using constants/functions.
- Predefined reader variables must be explicitly marked with `[variable]`.
- Deeply nested mathematical layouts are supported by the expression structure but are not intended to match full TeX typography.
- `preview` is a free-calculator feature; authored formulas already use their own interactive formula renderer.

These constraints keep the calculator predictable and compact for STEM-note use.

---

# 29. Quick Reference

## Blank calculator

```latex
\begin{calculator}
\end{calculator}
```

## Predefined calculator

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

## Options

```latex
\begin{calculator}[
    precision=6,
    format=decimal,
    preview=false,
    angle=rad,
    angle-lock=false
]
...
\end{calculator}
```

Write them on one line in normal note source if preferred:

```latex
\begin{calculator}[precision=6,format=decimal,angle=rad]
F=[m][a]
\end{calculator}
```

## Reader constants

```text
pi
π
e
```

## Reader operators

```text
+  -  *  /  ^  **
×  ·  ⋅  ÷
```

## Common functions

```text
sin cos tan
asin acos atan
sinh cosh tanh
sqrt abs
exp ln log log10
floor ceil round sign
min max pow
```

## Free result trigger

```text
=
```

at the end of the expression.

## Formula input marker

```text
[variable]
```

---

# 30. Minimal Test Set

After changing calculator code, these are useful smoke tests.

### Free arithmetic

```text
2+2 =
```

Expected:

```text
4
```

### Constant / power

```text
2*pi*3^2 =
```

### Scientific notation

```text
6.022e23/2 =
```

### Root

```text
sqrt(25) =
```

Expected:

```text
5
```

### Degree trig

Switch to Deg:

```text
sin(90) =
```

Expected:

```text
1
```

### Radian trig

Switch to Rad:

```text
sin(pi/2) =
```

Expected:

```text
1
```

### Undefined

```text
1/0 =
```

Expected result label:

```text
undefined
```

### Predefined formula

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Enter:

```text
m = 10
a = 9.81
```

### Variable expressions

```latex
\begin{calculator}
y=[x]^2+2*[x]
\end{calculator}
```

Enter into the first `x`:

```text
2*pi
```

The later `x` should be a disabled computed mirror.

### Formula/Free state

1. Enter values in the formula.
2. Switch to Free.
3. Type a free expression.
4. Enable and enlarge Preview.
5. Switch to Formula.
6. Switch back to Free.

Both sides should retain their own state.

---

# 31. Summary

The calculator feature is designed as a compact interactive STEM-note tool rather than a full computer algebra system.

Its central ideas are:

- Simple `\begin{calculator}` author syntax.
- Free and predefined calculators.
- Explicit `[variable]` placeholders.
- Formula inputs that can themselves contain calculations.
- Repeated-variable mirrors.
- Safe AST-based parsing/evaluation.
- Common scientific functions and constants.
- Degree/radian control with optional author lock.
- Significant-digit result precision.
- Decimal/scientific display switching.
- Optional live MathJax preview in Free mode.
- A purpose-built CSS formula renderer for predefined calculators.
- Responsive light/dark-theme presentation.
- Reader-friendly error behavior that avoids raw `NaN` and `Infinity`.
