import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax/browser";

import { parseNumericInput } from "../calculators/CalculatorExpression";
import {
    fillQuizQuestion,
    generateMathProblem,
    parseQuizDefinition,
} from "./QuizDefinition";
import type {
    FlashcardQuizDefinition,
    MathQuizDefinition,
    QuizProblem,
} from "./QuizDefinition";
import "./Quiz.css";

interface QuizProps {
    type: string;
    source: string;
    tolerance: number;
    title?: string;
    unit?: string;
}

/**
 * The existing site uses the browser MathJax script from index.html.
 * Queue our typesetting requests, just like the calculator's MathJaxPreview.
 * Do not import rehype-mathjax/svg or mathjax-full into the browser bundle.
 */
let typesetQueue: Promise<void> = Promise.resolve();

const QuizMarkdown = memo(function QuizMarkdown({
    source,
    inline = false,
}: {
    source: string;
    inline?: boolean;
}) {
    const elementRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const element = elementRef.current;
        if (!element) return;
        const root = element;
        let cancelled = false;

        function scheduleTypeset(): void {
            typesetQueue = typesetQueue.catch(() => undefined).then(async () => {
                const mathJax = window.MathJax;
                if (cancelled || !root.isConnected || !mathJax) return;
                try {
                    await mathJax.startup?.promise;
                    if (cancelled || !root.isConnected) return;
                    await mathJax.typesetPromise?.([root]);
                } catch (error: unknown) {
                    if (!cancelled) console.error("Quiz MathJax typesetting failed.", error);
                }
            });
        }

        const mathJaxScript = document.getElementById("MathJax-script");
        if (window.MathJax?.typesetPromise) {
            scheduleTypeset();
        } else {
            // index.html loads MathJax asynchronously. window.MathJax may
            // initially hold configuration only, without typesetPromise.
            mathJaxScript?.addEventListener("load", scheduleTypeset);
        }

        return () => {
            cancelled = true;
            mathJaxScript?.removeEventListener("load", scheduleTypeset);
            // Clear MathJax's bookkeeping for this exact subtree. React only
            // unmounts the keyed wrapper, never updates MathJax-owned nodes.
            window.MathJax?.typesetClear?.([root]);
        };
    }, [source]);

    const rendered = (
        <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            skipHtml
            components={inline ? {
                p: ({ children }: { children?: ReactNode }) => <>{children}</>,
            } : undefined}
        >
            {source}
        </Markdown>
    );

    if (inline) {
        return (
            <span className="quiz__markdown quiz__markdown--inline">
                <span key={source} ref={(node: HTMLSpanElement | null) => { elementRef.current = node; }}>{rendered}</span>
            </span>
        );
    }
    return (
        <div className="quiz__markdown">
            <div key={source} ref={(node: HTMLDivElement | null) => { elementRef.current = node; }}>{rendered}</div>
        </div>
    );
});

export default function Quiz({
    type,
    source,
    tolerance,
    title = "",
    unit = "",
}: QuizProps) {
    const parsed = useMemo(() => {
        try {
            return { definition: parseQuizDefinition(type, source, tolerance) };
        } catch (error: unknown) {
            return { error: error instanceof Error ? error.message : "Invalid quiz" };
        }
    }, [type, source, tolerance]);

    if (!parsed.definition) {
        return <div className="quiz quiz--error" role="alert">{parsed.error}</div>;
    }

    const key = `${type}\u0000${source}\u0000${tolerance}\u0000${unit}`;
    return parsed.definition.kind === "flashcard"
        ? <FlashcardQuiz key={key} definition={parsed.definition} title={title} />
        : <MathQuiz key={key} definition={parsed.definition} title={title} unit={unit} />;
}

function QuizHeading({ title }: { title: string }) {
    if (!title.trim() || title.trim().toLowerCase() === "none") return null;
    return <h3 className="quiz__heading">{title}</h3>;
}

function FlashcardQuiz({
    definition,
    title,
}: {
    definition: FlashcardQuizDefinition;
    title: string;
}) {
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const card = definition.cards[index];

    function changeCard(direction: number) {
        setIndex((previous) =>
            (previous + direction + definition.cards.length) % definition.cards.length,
        );
        setRevealed(false);
    }

    return (
        <section className="quiz quiz--flashcards" aria-label={title || "Flashcards"}>
            <QuizHeading title={title} />
            <div className="quiz__flashcard-progress" aria-live="polite">
                Card {index + 1} of {definition.cards.length}
            </div>
            <div className={`quiz__flashcard-stage${revealed ? " quiz__flashcard-stage--flipped" : ""}`}>
                <div className="quiz__flashcard-face" key={`${index}:${revealed}`} aria-live="polite">
                    <QuizMarkdown source={revealed ? card.answer : card.question} />
                </div>
            </div>
            <div className="quiz__actions quiz__flashcard-controls">
                <button type="button" className="quiz__button quiz__button--secondary"
                    onClick={() => changeCard(-1)} disabled={definition.cards.length === 1}>
                    Previous
                </button>
                <button type="button" className="quiz__button" aria-expanded={revealed}
                    onClick={() => setRevealed((previous) => !previous)}>
                    {revealed ? "Show question" : "Reveal answer"}
                </button>
                <button type="button" className="quiz__button quiz__button--secondary"
                    onClick={() => changeCard(1)} disabled={definition.cards.length === 1}>
                    Next
                </button>
            </div>
        </section>
    );
}

function MathQuiz({ definition, title, unit }: {
    definition: MathQuizDefinition;
    title: string;
    unit: string;
}) {
    const inputId = useId();
    const [problem, setProblem] = useState<QuizProblem>(() => generateMathProblem(definition));
    const [response, setResponse] = useState("");
    const [checked, setChecked] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const numericResponse = parseNumericInput(response.trim().replace(",", "."));
    const correct = problem.status === "ready" && numericResponse.status === "valid"
        && Math.abs(numericResponse.value - problem.answer) <= definition.tolerance;
    const canChangeValues = definition.variables.some(({ count }) => count > 1);

    function regenerate(): void {
        setProblem((previous) => generateMathProblem(definition, previous));
        setResponse("");
        setChecked(false);
        setRevealed(false);
    }

    return (
        <section className="quiz quiz--math" aria-label={title || "Mathematics quiz"}>
            <QuizHeading title={title} />
            {problem.status === "error" ? (
                <div role="alert">{problem.message}</div>
            ) : (
                <>
                    <div className="quiz__question">
                        <QuizMarkdown source={fillQuizQuestion(definition.question, problem.values)} />
                    </div>
                    <form className="quiz__form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        setChecked(true);
                    }}>
                        <label className="quiz__label" htmlFor={inputId}>Your answer</label>
                        <div className="quiz__input-wrap">
                            <input id={inputId} className="quiz__input" type="text" inputMode="decimal"
                                value={response} placeholder="Enter a number"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    setResponse(event.target.value);
                                    setChecked(false);
                                }}
                                autoComplete="off" />
                            {unit && (
                                <span className="quiz__unit" aria-label={`Expected unit: ${unit}`}>
                                    <QuizMarkdown source={`$${unit}$`} inline />
                                </span>
                            )}
                        </div>
                        <button type="submit" className="quiz__button">Check</button>
                    </form>
                    {checked && (
                        <p className={`quiz__feedback ${correct ? "quiz__feedback--correct" : ""}`}
                            role="status">
                            {numericResponse.status !== "valid" ? "Enter a valid number."
                                : correct ? "Correct!" : "Not quite. Try again."}
                        </p>
                    )}
                    {revealed && (
                        <p className="quiz__solution">
                            Answer: {String(Number(problem.answer.toPrecision(12)))}
                            {unit && <> <span className="quiz__solution-unit">
                                <QuizMarkdown source={`$${unit}$`} inline />
                            </span></>}
                        </p>
                    )}
                    <div className="quiz__actions">
                        <button type="button" className="quiz__button quiz__button--secondary"
                            onClick={() => setRevealed((previous) => !previous)}>
                            {revealed ? "Hide solution" : "Show solution"}
                        </button>
                        <button type="button" className="quiz__button quiz__button--secondary"
                            onClick={regenerate} disabled={!canChangeValues}>
                            New values
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
