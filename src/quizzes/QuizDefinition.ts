import {
    evaluateCalculatorExpression,
    parseCalculatorDefinition,
} from "../calculators/CalculatorExpression";
import type {
    CalculatorDefinition,
} from "../calculators/CalculatorExpression";

export interface Flashcard {
    question: string;
    answer: string;
}

export interface FlashcardQuizDefinition {
    kind: "flashcard";
    cards: Flashcard[];
}

export interface QuizVariableRange {
    name: string;
    minimum: number;
    maximum: number;
    step: number;
    count: number;
}

export interface MathQuizDefinition {
    kind: "math";
    question: string;
    formula: CalculatorDefinition;
    variables: QuizVariableRange[];
    tolerance: number;
}

export type QuizDefinition = FlashcardQuizDefinition | MathQuizDefinition;

const numeric = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?`;
const rangePattern = new RegExp(
    `^([a-zA-Z][a-zA-Z0-9_]*)\\s*=\\s*(${numeric})\\s*\\.\\.\\s*(${numeric})(?:\\s+step\\s+(${numeric}))?\\s*$`,
);

/** Same parser is used for author diagnostics and the React component. */
export function parseQuizDefinition(
    kind: string,
    body: string,
    tolerance: number,
): QuizDefinition {
    if (kind !== "flashcard" && kind !== "math") {
        throw new Error('Quiz type must be "flashcard" or "math".');
    }
    const lines = body.trim().split(/\r?\n/);

    if (kind === "flashcard") {
        const cards: Flashcard[] = [];
        let question = "";
        let answer = "";
        let section: "question" | "answer" | null = null;
        function finish() {
            if (!question.trim() && !answer.trim()) return;
            if (!question.trim() || !answer.trim()) {
                throw new Error(`Flashcard ${cards.length + 1} needs both Q: and A:.`);
            }
            cards.push({ question: question.trim(), answer: answer.trim() });
            question = "";
            answer = "";
        }
        for (const line of lines) {
            const marker = line.match(/^\s*([QA]):\s*(.*)$/i);
            if (marker) {
                const isQ = marker[1].toUpperCase() === "Q";
                if (isQ) {
                    finish();
                    question = marker[2];
                    section = "question";
                } else {
                    if (!question.trim() || section === "answer") {
                        throw new Error('Every A: needs one preceding Q:.');
                    }
                    answer = marker[2];
                    section = "answer";
                }
            } else if (section === "question") {
                question += "\n" + line;
            } else if (section === "answer") {
                answer += "\n" + line;
            } else if (line.trim()) {
                throw new Error('Flashcards must start with Q: followed by A:.');
            }
        }
        finish();
        if (!cards.length) throw new Error('Flashcard quiz needs at least one Q:/A: pair.');
        return { kind: "flashcard", cards };
    }

    if (!Number.isFinite(tolerance) || tolerance < 0) {
        throw new Error("Tolerance must be finite and non-negative.");
    }
    let question: string | undefined;
    let answer: string | undefined;
    const variables: QuizVariableRange[] = [];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const questionLine = line.match(/^Question:\s*(.*)$/i);
        if (questionLine) {
            if (question !== undefined) throw new Error("Duplicate Question: line.");
            question = questionLine[1].trim();
            continue;
        }
        const answerLine = line.match(/^answer\s*=\s*(.*)$/i);
        if (answerLine) {
            if (answer !== undefined) throw new Error("Duplicate answer = line.");
            answer = answerLine[1].trim();
            continue;
        }
        const match = line.match(rangePattern);
        if (!match) throw new Error(`Unknown math quiz line: "${line}".`);
        const [, name, minSource, maxSource, stepSource] = match;
        if (variables.some((variable) => variable.name === name)) {
            throw new Error(`Duplicate range for ${name}.`);
        }
        const minimum = Number(minSource);
        const maximum = Number(maxSource);
        const step = stepSource === undefined ? 1 : Number(stepSource);
        if (![minimum, maximum, step].every(Number.isFinite) || maximum < minimum || step <= 0) {
            throw new Error(`Invalid range for ${name}: use min..max step positiveNumber.`);
        }
        const count = Math.floor((maximum - minimum) / step + 1e-10) + 1;
        if (!Number.isSafeInteger(count) || count < 1 || count > 10000) {
            throw new Error(`${name} must have 1–10000 possible values.`);
        }
        variables.push({ name, minimum, maximum, step, count });
    }
    if (!question || !answer || !variables.length) {
        throw new Error("Math quiz needs Question:, variable ranges, and answer = LABEL = FORMULA.");
    }
    const formula = parseCalculatorDefinition(answer);
    const defined = new Set(variables.map(({ name }) => name));
    for (const name of formula.variables) {
        if (!defined.has(name)) throw new Error(`Formula variable [${name}] is missing its range.`);
    }
    for (const [, name] of question.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g)) {
        if (!defined.has(name)) throw new Error(`Question placeholder {{${name}}} has no range.`);
    }
    if (!question.includes("{{")) {
        throw new Error("Question needs at least one {{variable}} placeholder.");
    }
    return { kind: "math", question, formula, variables, tolerance };
}

export function sampleQuizVariables(
    ranges: ReadonlyArray<QuizVariableRange>,
    random: () => number = Math.random,
): Record<string, number> {
    const values: Record<string, number> = {};
    for (const range of ranges) {
        const sample = random();
        const index = Math.min(range.count - 1, Math.max(0, Math.floor(sample * range.count)));
        values[range.name] = valueAt(range, index);
    }
    return values;
}

export function valueAt(range: QuizVariableRange, index: number): number {
    return Number((range.minimum + index * range.step).toPrecision(12));
}

export function equalQuizValues(a: Record<string, number>, b: Record<string, number>): boolean {
    return Object.keys(a).every((name) => Object.is(a[name], b[name]));
}

export function fillQuizQuestion(question: string, values: Readonly<Record<string, number>>): string {
    return question.replace(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g, (_, name: string) =>
        String(values[name] ?? `{{${name}}}`),
    );
}

/** A generated numerical question and the answer computed from the SAME values. */
export type QuizProblem =
    | { status: "ready"; values: Record<string, number>; answer: number }
    | { status: "error"; message: string };

function evaluateProblem(definition: MathQuizDefinition, values: Record<string, number>): QuizProblem {
    const result = evaluateCalculatorExpression(definition.formula.expression, values);
    return result.status === "success" && Number.isFinite(result.value)
        ? { status: "ready", values, answer: result.value }
        : { status: "error", message: "No valid answer for this set of values." };
}

export function generateMathProblem(
    definition: MathQuizDefinition,
    previous?: QuizProblem,
    random: () => number = Math.random,
): QuizProblem {
    const old = previous?.status === "ready" ? previous.values : undefined;
    // Never present the same set again if an alternative valid set exists.
    for (let tries = 0; tries < 120; tries++) {
        const values = sampleQuizVariables(definition.variables, random);
        if (old && equalQuizValues(values, old)) continue;
        const result = evaluateProblem(definition, values);
        if (result.status === "ready") return result;
    }
    // A deterministic fallback also works if the RNG repeatedly returns
    // identical values (or in tests with a fixed random source).
    if (old) {
        for (const range of definition.variables) {
            if (range.count < 2) continue;
            for (let step = 1; step < range.count; step++) {
                const currentIndex = Math.round((old[range.name] - range.minimum) / range.step);
                const index = (currentIndex + step) % range.count;
                const values = { ...old, [range.name]: valueAt(range, index) };
                const result = evaluateProblem(definition, values);
                if (result.status === "ready") return result;
            }
        }
    }
    return {
        status: "error",
        message: old
            ? "No different valid values are available with these ranges."
            : "No valid combination could be generated. Check the ranges and formula.",
    };
}
