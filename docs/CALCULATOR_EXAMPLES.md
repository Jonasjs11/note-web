# Calculator Examples Cookbook

This file contains a large collection of copy-pasteable examples for the `calculator` feature.

It is intended both as:

- An author cookbook.
- A test suite of realistic calculator use cases.
- A quick way to discover supported syntax.

Unless otherwise stated, each calculator can be pasted directly into an `.mdx` note.

---

# Part A — Blank / Free Calculators

## 1. Simplest blank calculator

```latex
\begin{calculator}
\end{calculator}
```

Reader input to try:

```text
2+2 =
```

---

## 2. Blank calculator with preview visible

```latex
\begin{calculator}[preview=true]
\end{calculator}
```

Try:

```text
sqrt(2*pi)^3
```

Then add:

```text
=
```

---

## 3. Blank calculator starting in scientific format

```latex
\begin{calculator}[format=scientific]
\end{calculator}
```

Try:

```text
602200000000000000000000 =
```

---

## 4. Blank calculator with high precision

```latex
\begin{calculator}[precision=12]
\end{calculator}
```

Try:

```text
1/7 =
```

---

## 5. Blank calculator starting in degrees

```latex
\begin{calculator}[angle=deg]
\end{calculator}
```

Try:

```text
sin(30) =
```

---

## 6. Blank calculator starting in radians

```latex
\begin{calculator}[angle=rad]
\end{calculator}
```

Try:

```text
sin(pi/6) =
```

---

## 7. Blank calculator with several options

```latex
\begin{calculator}[precision=8,format=scientific,preview=true,angle=deg]
\end{calculator}
```

Try:

```text
cos(60)*6.022e23 =
```

---

# Part B — Basic Reader Arithmetic

These inputs are intended for a blank calculator or a predefined variable field.

## 8. Addition

```text
12+7 =
```

## 9. Subtraction

```text
12-7 =
```

## 10. Negative numbers

```text
-12+5 =
```

## 11. Multiplication with `*`

```text
12*7 =
```

## 12. Multiplication with `×`

```text
12×7 =
```

## 13. Multiplication with middle dot

```text
12·7 =
```

## 14. Division with `/`

```text
84/7 =
```

## 15. Division with `÷`

```text
84÷7 =
```

## 16. Parentheses

```text
(3+5)*4 =
```

## 17. Adjacent parenthesis multiplication

```text
(2+3)(4+1) =
```

## 18. Number followed by parentheses

```text
3(4+2) =
```

---

# Part C — Powers and Scientific Notation

## 19. Power with caret

```text
2^10 =
```

## 20. Power with double asterisk

```text
2**10 =
```

## 21. Negative exponent

```text
10^-3 =
```

## 22. Group raised to a power

```text
(3+4)^2 =
```

## 23. Standard scientific notation

```text
6.022e23 =
```

## 24. Negative scientific exponent

```text
2.5e-8 =
```

## 25. Explicit positive scientific exponent

```text
1.25e+6 =
```

## 26. Arithmetic with scientific notation

```text
6.022e23/2 =
```

## 27. Scientific notation inside a variable field

Author:

```latex
\begin{calculator}
y=2*[x]
\end{calculator}
```

Reader enters for `x`:

```text
1.5e8
```

---

# Part D — Constants

## 28. Pi by name

```text
pi =
```

## 29. Pi glyph

```text
π =
```

## 30. LaTeX-style pi

```text
\pi =
```

## 31. Euler's number

```text
e =
```

## 32. Implicit multiplication with pi

```text
2pi =
```

## 33. Circle area as a free expression

```text
pi*3^2 =
```

## 34. Exponential constant

```text
e^2 =
```

---

# Part E — Roots and Absolute Value

## 35. Square root

```text
sqrt(25) =
```

## 36. Square root with braces

```text
sqrt{25} =
```

## 37. Unicode root with group

```text
√(25) =
```

## 38. Root of an expression

```text
sqrt(3^2+4^2) =
```

## 39. Absolute value

```text
abs(-12.5) =
```

## 40. Root used in a predefined variable

Author:

```latex
\begin{calculator}
A=[x]^2
\end{calculator}
```

Reader enters:

```text
sqrt(2)
```

---

# Part F — Trigonometry in Radians

## 41. Sine

Use Rad:

```text
sin(pi/2) =
```

## 42. Cosine

Use Rad:

```text
cos(pi) =
```

## 43. Tangent

Use Rad:

```text
tan(pi/4) =
```

## 44. Inverse sine

Use Rad:

```text
asin(1) =
```

## 45. Inverse cosine

Use Rad:

```text
acos(0) =
```

## 46. Inverse tangent

Use Rad:

```text
atan(1) =
```

## 47. Nested trig

Use Rad:

```text
sin(atan(1)) =
```

---

# Part G — Trigonometry in Degrees

## 48. Degree sine

Switch to Deg:

```text
sin(30) =
```

Expected:

```text
0.5
```

## 49. Degree cosine

```text
cos(60) =
```

Expected:

```text
0.5
```

## 50. Degree sine at 90 degrees

```text
sin(90) =
```

Expected:

```text
1
```

## 51. Exact zero handling

```text
sin(180) =
```

Expected:

```text
0
```

## 52. Undefined tangent

```text
tan(90) =
```

Expected:

```text
undefined
```

## 53. Degree inverse sine

```text
asin(1) =
```

Expected:

```text
90
```

---

# Part H — Hyperbolic Functions

These are not changed by the Rad/Deg selector.

## 54. Hyperbolic sine

```text
sinh(1) =
```

## 55. Hyperbolic cosine

```text
cosh(1) =
```

## 56. Hyperbolic tangent

```text
tanh(1) =
```

---

# Part I — Exponentials and Logarithms

## 57. Natural exponential

```text
exp(1) =
```

## 58. Natural logarithm

```text
ln(e) =
```

## 59. Common logarithm

```text
log(1000) =
```

## 60. Explicit base-10 logarithm

```text
log10(1000) =
```

## 61. Logarithm inside a larger expression

```text
2*ln(e^3) =
```

---

# Part J — Utility Functions

## 62. Floor

```text
floor(3.9) =
```

## 63. Ceiling

```text
ceil(3.1) =
```

## 64. Round

```text
round(3.6) =
```

## 65. Sign of a negative value

```text
sign(-12) =
```

## 66. Minimum

```text
min(4,8,-2,10) =
```

## 67. Maximum

```text
max(4,8,-2,10) =
```

## 68. `pow`

```text
pow(2,10) =
```

---

# Part K — Very Simple Predefined Calculators

## 69. Newton's second law

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Try:

```text
m = 10
a = 9.81
```

---

## 70. Velocity

```latex
\begin{calculator}
v=\frac{[d]}{[t]}
\end{calculator}
```

Try:

```text
d = 100
t = 9.58
```

---

## 71. Density

```latex
\begin{calculator}
rho=\frac{[m]}{[V]}
\end{calculator}
```

---

## 72. Pressure

```latex
\begin{calculator}
P=\frac{[F]}{[A]}
\end{calculator}
```

---

## 73. Momentum

```latex
\begin{calculator}
p=[m][v]
\end{calculator}
```

---

## 74. Kinetic energy

```latex
\begin{calculator}
E=0.5*[m]*[v]^2
\end{calculator}
```

---

## 75. Gravitational potential energy

```latex
\begin{calculator}
E=[m][g][h]
\end{calculator}
```

Try entering:

```text
g = 9.81
```

---

# Part L — Fractions

## 76. General fraction

```latex
\begin{calculator}
y=\frac{[a]}{[b]}
\end{calculator}
```

---

## 77. Fraction with multiplication in numerator

```latex
\begin{calculator}
y=\frac{[a]*[b]}{[c]}
\end{calculator}
```

---

## 78. Newtonian gravitation

```latex
\begin{calculator}[precision=8,format=scientific]
F=[G]\frac{[m_1]*[m_2]}{[r]^2}
\end{calculator}
```

Try:

```text
G = 6.67430e-11
m_1 = 5.972e24
m_2 = 1000
r = 6.371e6
```

---

## 79. Coulomb-style inverse-square structure

```latex
\begin{calculator}[format=scientific]
F=[k]\frac{[q_1]*[q_2]}{[r]^2}
\end{calculator}
```

---

## 80. Resistance from voltage and current

```latex
\begin{calculator}
R=\frac{[V]}{[I]}
\end{calculator}
```

---

# Part M — Powers in Predefined Formulas

## 81. Area of a circle

```latex
\begin{calculator}
A=pi*[r]^2
\end{calculator}
```

---

## 82. Volume of a sphere

```latex
\begin{calculator}
V=\frac{4}{3}*pi*[r]^3
\end{calculator}
```

---

## 83. Kinetic energy with power

```latex
\begin{calculator}
E=\frac{1}{2}*[m]*[v]^2
\end{calculator}
```

---

## 84. Pythagorean hypotenuse

```latex
\begin{calculator}
c=sqrt([a]^2+[b]^2)
\end{calculator}
```

Try:

```text
a = 3
b = 4
```

Expected:

```text
5
```

---

# Part N — Kinematics

## 85. Uniform motion

```latex
\begin{calculator}
x=[v][t]
\end{calculator}
```

---

## 86. Position under constant acceleration

```latex
\begin{calculator}
x=[v_0][t]+\frac{1}{2}*[a]*[t]^2
\end{calculator}
```

The second `t` is a computed mirror.

---

## 87. Final velocity

```latex
\begin{calculator}
v_f=[v_0]+[a][t]
\end{calculator}
```

---

## 88. Velocity-squared relation

```latex
\begin{calculator}
v_f=sqrt([v_0]^2+2*[a]*[x])
\end{calculator}
```

---

# Part O — Trigonometric Predefined Formulas

## 89. Horizontal component in degrees

```latex
\begin{calculator}[angle=deg]
x=[v]*cos([theta])
\end{calculator}
```

Try:

```text
v = 20
theta = 60
```

---

## 90. Vertical component in degrees

```latex
\begin{calculator}[angle=deg]
y=[v]*sin([theta])
\end{calculator}
```

---

## 91. Locked degree formula

```latex
\begin{calculator}[angle=deg,angle-lock=true]
h=[d]*tan([theta])
\end{calculator}
```

In Formula mode, Deg is locked.

Switch to **Free** and the reader can change Rad/Deg normally.

---

## 92. Locked radian formula

```latex
\begin{calculator}[angle=rad,angle-lock=true]
y=[A]*sin([omega]*[t]+[phi])
\end{calculator}
```

---

## 93. Law-of-cosines style formula

```latex
\begin{calculator}[angle=deg]
c=sqrt([a]^2+[b]^2-2*[a]*[b]*cos([gamma]))
\end{calculator}
```

---

# Part P — Repeated Variables

## 94. Quadratic expression

```latex
\begin{calculator}
y=[x]^2+2*[x]+1
\end{calculator}
```

Only the first `x` is editable.

Try:

```text
x = 3
```

The second `x` displays the computed `3`.

---

## 95. Repeated variable with expression input

```latex
\begin{calculator}
y=[x]^2+2*[x]
\end{calculator}
```

Enter into the first `x`:

```text
2*pi
```

The later `x` displays the computed numeric value of `2*pi`.

---

## 96. Repeated time in kinematics

```latex
\begin{calculator}
x=[v_0][t]+\frac{1}{2}*[a]*[t]^2
\end{calculator}
```

Only the first `t` can be edited.

---

## 97. Repeated radius

```latex
\begin{calculator}
y=2*pi*[r]+pi*[r]^2
\end{calculator}
```

Only the first `r` is editable.

---

# Part Q — Variable Fields Containing Calculations

## 98. Pi as a variable value

```latex
\begin{calculator}
y=2*[x]
\end{calculator}
```

Enter:

```text
pi
```

for `x`.

---

## 99. Arithmetic as a variable value

```latex
\begin{calculator}
y=[x]^2
\end{calculator}
```

Enter:

```text
3+4
```

for `x`.

The formula receives `7`.

---

## 100. Root as a variable value

```latex
\begin{calculator}
y=[x]^2
\end{calculator}
```

Enter:

```text
sqrt(2)
```

for `x`.

---

## 101. Scientific notation as a variable value

```latex
\begin{calculator}[format=scientific]
y=[x]*[k]
\end{calculator}
```

Try:

```text
x = 6.022e23
k = 1.38e-23
```

---

## 102. Trig as a variable value in degree mode

```latex
\begin{calculator}[angle=deg]
y=3*[x]
\end{calculator}
```

Enter:

```text
sin(90)
```

for `x`.

Expected `x` value:

```text
1
```

---

## 103. Nested expression as variable value

```latex
\begin{calculator}
y=[x]+1
\end{calculator}
```

Enter:

```text
sqrt(3^2+4^2)
```

for `x`.

The formula receives `5`.

---

# Part R — Greek Variables

## 104. Theta

```latex
\begin{calculator}[angle=deg]
y=sin([theta])
\end{calculator}
```

---

## 105. Backslash theta

```latex
\begin{calculator}[angle=deg]
y=sin([\theta])
\end{calculator}
```

---

## 106. Omega

```latex
\begin{calculator}
v=[omega]*[r]
\end{calculator}
```

---

## 107. Lambda

```latex
\begin{calculator}
f=\frac{[c]}{[lambda]}
\end{calculator}
```

---

## 108. Rho with subscript-like related variables

```latex
\begin{calculator}
y=\frac{[rho_1]}{[rho_2]}
\end{calculator}
```

---

# Part S — Subscripts

## 109. Initial and final velocity

```latex
\begin{calculator}
v_f=[v_0]+[a][t]
\end{calculator}
```

---

## 110. Two masses

```latex
\begin{calculator}
M=[m_1]+[m_2]
\end{calculator}
```

---

## 111. Temperatures

```latex
\begin{calculator}
T_f=\frac{[T_1]+[T_2]}{2}
\end{calculator}
```

---

## 112. Two charges

```latex
\begin{calculator}
q=[q_1]+[q_2]
\end{calculator}
```

---

# Part T — Precision and Formatting

## 113. Three significant digits

```latex
\begin{calculator}[precision=3]
\end{calculator}
```

Try:

```text
1/3 =
```

---

## 114. Twelve significant digits

```latex
\begin{calculator}[precision=12]
\end{calculator}
```

Try:

```text
pi =
```

---

## 115. Scientific default

```latex
\begin{calculator}[precision=5,format=scientific]
E=[m]*[c]^2
\end{calculator}
```

Try:

```text
m = 1
c = 299792458
```

---

## 116. Decimal default for a small value

```latex
\begin{calculator}[precision=8,format=decimal]
y=[x]
\end{calculator}
```

Try:

```text
x = 1e-7
```

Then switch between `123` and `1e3`.

---

# Part U — Formula / Free Switching

## 117. Basic mode-switch test

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Test:

1. Enter `m = 10`.
2. Enter `a = 9.81`.
3. Press **Free**.
4. Type `2*pi =`.
5. Press **Formula**.
6. Confirm the original values remain.
7. Press **Free** again.
8. Confirm `2*pi =` remains.

---

## 118. Preview state preservation

```latex
\begin{calculator}
E=0.5*[m]*[v]^2
\end{calculator}
```

Test:

1. Switch to **Free**.
2. Enable **Preview**.
3. Press `+` to enlarge it.
4. Type `sqrt(2*pi)`.
5. Switch to **Formula**.
6. Switch back to **Free**.
7. Confirm the free expression, Preview toggle, and zoom state remain.

---

## 119. Angle lock released in Free mode

```latex
\begin{calculator}[angle=deg,angle-lock=true]
y=[A]*sin([theta])
\end{calculator}
```

Test:

1. Confirm Deg is locked in Formula mode.
2. Press **Free**.
3. Confirm Rad/Deg is editable.
4. Change to Rad.
5. Return to Formula.
6. Confirm the authored formula remains locked to Deg.

---

# Part V — Preview-Oriented Examples

These are good expressions for testing whether the MathJax preview matches the reader's intended grouping.

## 120. Fraction-like typed expression

```text
(1+2)/(3+4)
```

## 121. Nested root

```text
sqrt(2+sqrt(3))
```

## 122. Power over a group

```text
(1+sqrt(5))^2
```

## 123. Trigonometric fraction

```text
sin(pi/4)/cos(pi/4)
```

## 124. Scientific notation preview

```text
6.022e23*1.38e-23
```

---

# Part W — Undefined / Domain Examples

These are useful for testing error UX.

## 125. Division by zero

```text
1/0 =
```

Expected:

```text
undefined
```

with a division-by-zero explanation.

---

## 126. Negative square root

```text
sqrt(-1) =
```

Expected:

```text
undefined
```

---

## 127. Invalid natural logarithm

```text
ln(0) =
```

Expected:

```text
undefined
```

---

## 128. Negative logarithm

```text
log(-10) =
```

Expected:

```text
undefined
```

---

## 129. Inverse sine outside domain

```text
asin(2) =
```

Expected:

```text
undefined
```

---

## 130. Complex-only power result

```text
(-1)^0.5 =
```

Expected:

```text
undefined
```

---

# Part X — Parser Error Examples

These are intentionally invalid and should be used as tests rather than copied into normal finished notes.

## 131. Unknown free name

```text
banana(2) =
```

Expected:

```text
error
```

---

## 132. Missing closing parenthesis

```text
sqrt(2 =
```

Expected:

```text
error
```

after the final equals is requested.

---

## 133. Function without arguments

```text
sin =
```

Expected:

```text
error
```

---

## 134. Empty calculation

```text
=
```

Expected:

```text
error
```

with a message asking for an expression before `=`.

---

# Part Y — Author Diagnostic Examples

The following calculator blocks are intentionally invalid. They are useful for testing note diagnostics.

## 135. Missing assignment

```latex
\begin{calculator}
[m][a]
\end{calculator}
```

The predefined formula needs an output assignment.

---

## 136. Missing RHS

```latex
\begin{calculator}
F=
\end{calculator}
```

---

## 137. No input variables

```latex
\begin{calculator}
F=2*pi
\end{calculator}
```

A predefined calculator currently requires at least one `[variable]`.

---

## 138. Unknown author name without brackets

```latex
\begin{calculator}
F=mass*acceleration
\end{calculator}
```

Use explicit reader variables instead:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

---

## 139. Malformed variable

```latex
\begin{calculator}
F=[mass][a]
\end{calculator}
```

The intended variable-label style is a compact mathematical symbol such as `[m]`, `[v_f]`, or `[theta]`.

---

## 140. Invalid precision option

```latex
\begin{calculator}[precision=20]
F=[m][a]
\end{calculator}
```

---

## 141. Invalid result format

```latex
\begin{calculator}[format=engineering]
F=[m][a]
\end{calculator}
```

---

## 142. Invalid angle

```latex
\begin{calculator}[angle=gradians]
y=sin([theta])
\end{calculator}
```

---

## 143. Meaningless lock on blank calculator

```latex
\begin{calculator}[angle=deg,angle-lock=true]
\end{calculator}
```

The calculator remains unlocked and the author gets a warning because angle locking is defined only for authored Formula mode.

---

# Part Z — More STEM Examples

## 144. Frequency and period

```latex
\begin{calculator}
f=\frac{1}{[T]}
\end{calculator}
```

---

## 145. Angular frequency

```latex
\begin{calculator}
omega=2*pi*[f]
\end{calculator}
```

---

## 146. Wave speed

```latex
\begin{calculator}
v=[f][lambda]
\end{calculator}
```

---

## 147. Ohm's law — voltage

```latex
\begin{calculator}
V=[I][R]
\end{calculator}
```

---

## 148. Electric power

```latex
\begin{calculator}
P=[V][I]
\end{calculator}
```

---

## 149. Resistive power from current

```latex
\begin{calculator}
P=[I]^2*[R]
\end{calculator}
```

---

## 150. Capacitor energy

```latex
\begin{calculator}
E=\frac{1}{2}*[C]*[V]^2
\end{calculator}
```

---

## 151. Photon energy

```latex
\begin{calculator}[format=scientific]
E=[h][f]
\end{calculator}
```

Try:

```text
h = 6.62607015e-34
f = 5e14
```

---

## 152. Relativistic rest energy

```latex
\begin{calculator}[format=scientific]
E=[m]*[c]^2
\end{calculator}
```

---

## 153. Ideal-gas style expression

```latex
\begin{calculator}
P=\frac{[n]*[R]*[T]}{[V]}
\end{calculator}
```

---

## 154. Simple pendulum small-angle period

```latex
\begin{calculator}
T=2*pi*sqrt(\frac{[L]}{[g]})
\end{calculator}
```

---

## 155. Centripetal acceleration

```latex
\begin{calculator}
a=\frac{[v]^2}{[r]}
\end{calculator}
```

---

## 156. Centripetal force

```latex
\begin{calculator}
F=[m]\frac{[v]^2}{[r]}
\end{calculator}
```

---

## 157. Escape-speed structure

```latex
\begin{calculator}
v=sqrt(\frac{2*[G]*[M]}{[r]})
\end{calculator}
```

---

## 158. Spring energy

```latex
\begin{calculator}
E=\frac{1}{2}*[k]*[x]^2
\end{calculator}
```

---

## 159. Hooke's law magnitude

```latex
\begin{calculator}
F=[k][x]
\end{calculator}
```

---

## 160. RMS from peak voltage

```latex
\begin{calculator}
V=\frac{[V_0]}{sqrt(2)}
\end{calculator}
```

---

# Part AA — Mathematics Examples

## 161. Quadratic expression evaluator

```latex
\begin{calculator}
y=[a]*[x]^2+[b]*[x]+[c]
\end{calculator}
```

---

## 162. Distance formula in 2D

```latex
\begin{calculator}
d=sqrt(([x_2]-[x_1])^2+([y_2]-[y_1])^2)
\end{calculator}
```

---

## 163. Midpoint x-coordinate

```latex
\begin{calculator}
x=\frac{[x_1]+[x_2]}{2}
\end{calculator}
```

---

## 164. Arithmetic mean of three values

```latex
\begin{calculator}
x=\frac{[a]+[b]+[c]}{3}
\end{calculator}
```

---

## 165. Geometric-style magnitude

```latex
\begin{calculator}
r=sqrt([x]^2+[y]^2+[z]^2)
\end{calculator}
```

---

## 166. Exponential decay

```latex
\begin{calculator}
N=[N_0]*exp(-[lambda]*[t])
\end{calculator}
```

---

## 167. Logarithmic relation

```latex
\begin{calculator}
y=ln([x])
\end{calculator}
```

---

## 168. Base-10 logarithmic relation

```latex
\begin{calculator}
y=log([x])
\end{calculator}
```

---

## 169. Minimum of three reader values

```latex
\begin{calculator}
m=min([a],[b],[c])
\end{calculator}
```

---

## 170. Maximum of three reader values

```latex
\begin{calculator}
m=max([a],[b],[c])
\end{calculator}
```

---

# Part AB — Chemistry / General Science Examples

## 171. Amount from mass and molar mass

```latex
\begin{calculator}
n=\frac{[m]}{[M]}
\end{calculator}
```

---

## 172. Concentration

```latex
\begin{calculator}
c=\frac{[n]}{[V]}
\end{calculator}
```

---

## 173. Dilution relation solved as authored direct formula

```latex
\begin{calculator}
c_2=\frac{[c_1]*[V_1]}{[V_2]}
\end{calculator}
```

---

## 174. Number of particles

```latex
\begin{calculator}[format=scientific]
N=[n]*[N_A]
\end{calculator}
```

Try:

```text
N_A = 6.02214076e23
```

Note: a label like `[N_A]` uses the supported one-subscript convention.

---

## 175. Density from mass and volume

```latex
\begin{calculator}
rho=\frac{[m]}{[V]}
\end{calculator}
```

---

# Part AC — Reader Input Flexibility Tests

Use these in a blank calculator.

## 176. Whitespace

```text
2 * pi * 3 ^ 2 =
```

---

## 177. Unicode operators

```text
2 × π × 3^2 =
```

---

## 178. LaTeX multiplication command

```text
2\cdot pi\cdot3^2 =
```

---

## 179. LaTeX division command

```text
10\div2 =
```

---

## 180. LaTeX fraction

```text
\frac{1+2}{3+4} =
```

---

## 181. LaTeX left/right ignored for grouping convenience

```text
\left(2+3\right)*4 =
```

---

## 182. Function with braces

```text
sin{pi/2} =
```

---

## 183. Multiple implicit products

```text
2pi(3+1) =
```

---

# Part AD — Variable Field Expression Stress Tests

## 184. Arithmetic in every field

```latex
\begin{calculator}
y=[a]+[b]
\end{calculator}
```

Try:

```text
a = 2*pi
b = sqrt(2)+3
```

---

## 185. Degree trig in field

```latex
\begin{calculator}[angle=deg]
y=[x]^2
\end{calculator}
```

Enter:

```text
x = cos(60)
```

---

## 186. Radian trig in field

```latex
\begin{calculator}[angle=rad]
y=[x]^2
\end{calculator}
```

Enter:

```text
x = sin(pi/4)
```

---

## 187. Function composition in field

```latex
\begin{calculator}
y=2*[x]
\end{calculator}
```

Enter:

```text
x = abs(sin(pi/2)-2)
```

---

## 188. Trailing equals inside variable input

```latex
\begin{calculator}
y=[x]+1
\end{calculator}
```

Enter:

```text
x = 2*pi =
```

This is accepted; the equals is optional in variable fields.

---

# Part AE — Suggested Author Patterns

## 189. Prefer simple variable symbols

Good:

```latex
\begin{calculator}
F=[m][a]
\end{calculator}
```

Instead of trying to use long prose variable identifiers.

---

## 190. Use subscripts when quantities need distinction

```latex
\begin{calculator}
v_f=[v_0]+[a][t]
\end{calculator}
```

---

## 191. Use a locked angle mode when necessary

```latex
\begin{calculator}[angle=deg,angle-lock=true]
y=[v]*sin([theta])
\end{calculator}
```

---

## 192. Use scientific default for very large/small outputs

```latex
\begin{calculator}[format=scientific,precision=6]
E=[h][f]
\end{calculator}
```

---

## 193. Use higher precision for constants-heavy work

```latex
\begin{calculator}[precision=10]
y=[a]/[b]
\end{calculator}
```

---

# Part AF — Compact Regression Test Note

This section can be pasted into one test MDX file to exercise most major features quickly.

```mdx
# Calculator regression test

## Free

\begin{calculator}[preview=true]
\end{calculator}

## Basic formula

\begin{calculator}
F=[m][a]
\end{calculator}

## Fraction and power

\begin{calculator}[format=scientific,precision=8]
F=[G]\frac{[m_1]*[m_2]}{[r]^2}
\end{calculator}

## Repeated variable

\begin{calculator}
y=[x]^2+2*[x]+1
\end{calculator}

## Degree formula

\begin{calculator}[angle=deg]
y=[A]*sin([theta])
\end{calculator}

## Locked degree formula

\begin{calculator}[angle=deg,angle-lock=true]
h=[d]*tan([theta])
\end{calculator}

## Root

\begin{calculator}
c=sqrt([a]^2+[b]^2)
\end{calculator}

## Variable expressions

\begin{calculator}
y=[x]^2+2*[x]+[a]
\end{calculator}
```

Suggested reader tests:

```text
Free: 2*pi*3^2 =
Repeated x: 2*pi
Degree theta: 30
Locked degree theta: 45
Root a: 3
Root b: 4
Variable x: sqrt(2)
Variable a: pi
```

Then test Formula → Free → Formula switching and confirm both sides retain their state.

---

# Part AG — Quick Syntax Cheat Sheet

## Environment

```latex
\begin{calculator}[options]
formula
\end{calculator}
```

## Blank

```latex
\begin{calculator}
\end{calculator}
```

## Input variable

```text
[x]
[v_0]
[theta]
```

## Operators

```text
+ - * / ^ **
```

Also accepted:

```text
× · ⋅ ÷
\cdot \times \div
```

## Constants

```text
pi
π
\pi
e
```

## Functions

```text
sin cos tan
asin acos atan
sinh cosh tanh
sqrt abs
exp ln log log10
floor ceil round sign
min max pow
```

## Author options

```text
precision=1..15
format=decimal|scientific
preview=true|false
angle=rad|deg
angle-lock=true|false
```

## Free calculator result

End with:

```text
=
```

## Variable field result

No final equals is required.

---

# Final Note

The calculator is intentionally permissive for reader-entered numeric expressions while keeping authored formula variables explicit with `[variable]`.

When writing new examples, a good pattern is:

1. Keep the output label simple.
2. Mark every reader quantity with square brackets.
3. Use `\frac` and `^` when the visual structure matters.
4. Use `angle=deg` or `angle=rad` when trigonometry is central.
5. Use `angle-lock=true` only when the authored formula must enforce that convention.
6. Choose scientific default for outputs that naturally span many orders of magnitude.
7. Remember that reader variable fields can contain calculations, not just numbers.
