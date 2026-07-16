import {
    Fragment,
} from "react";

import type {
    ReactNode,
} from "react";

import type {
    ReferenceType,
} from "../../references/ReferenceTarget";

import type {
    CommandRenderer,
} from "../CommandRenderer";

interface RenderTarget {
    type: ReferenceType;
    anchorId: string;
    displayText: string;
}

const singularNames: Record<
    Exclude<ReferenceType, "section">,
    string
> = {
    equation: "equation",
    figure: "figure",
    table: "table",
};

const pluralNames: Record<
    Exclude<ReferenceType, "section">,
    string
> = {
    equation: "equations",
    figure: "figures",
    table: "tables",
};

const ReferenceCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const capitalize =
                arguments_[0] === "true";

            const targets =
                parseTargets(
                    arguments_.slice(1),
                );

            if (targets.length === 0) {
                return (
                    <span className="command-error">
                        Invalid reference
                    </span>
                );
            }

            return (
                <span className="reference">
                    {renderTargets(
                        targets,
                        capitalize,
                    )}
                </span>
            );
        },
    };

function parseTargets(
    arguments_: string[],
): RenderTarget[] {
    const targets: RenderTarget[] = [];

    for (
        let index = 0;
        index + 2 < arguments_.length;
        index += 3
    ) {
        const type = arguments_[index];
        const anchorId =
            arguments_[index + 1];
        const displayText =
            arguments_[index + 2];

        if (
            !isReferenceType(type) ||
            !anchorId ||
            !displayText
        ) {
            continue;
        }

        targets.push({
            type,
            anchorId,
            displayText,
        });
    }

    return targets;
}

function renderTargets(
    targets: RenderTarget[],
    capitalize: boolean,
): ReactNode {
    const firstType =
        targets[0].type;

    const sameType = targets.every(
        (target) =>
            target.type === firstType,
    );

    if (sameType) {
        if (firstType === "section") {
            return joinNodes(
                targets.map(
                    (target, index) =>
                        renderSectionLink(
                            target,
                            capitalize &&
                                index === 0,
                        ),
                ),
            );
        }

        return renderSameNumberedType(
            targets,
            firstType,
            capitalize,
        );
    }

    return joinNodes(
        targets.map(
            (target, index) =>
                renderMixedTarget(
                    target,
                    capitalize && index === 0,
                ),
        ),
    );
}

function renderSameNumberedType(
    targets: RenderTarget[],
    type: Exclude<
        ReferenceType,
        "section"
    >,
    capitalize: boolean,
): ReactNode {
    if (targets.length === 1) {
        const prefix =
            applyCapitalization(
                singularNames[type],
                capitalize,
            );

        return (
            <a
                href={`#${targets[0].anchorId}`}
                className="reference-link"
            >
                {prefix} {targets[0].displayText}
            </a>
        );
    }

    const prefix =
        applyCapitalization(
            pluralNames[type],
            capitalize,
        );

    return (
        <>
            {prefix}{" "}
            {joinNodes(
                targets.map(
                    renderNumberLink,
                ),
            )}
        </>
    );
}

function renderMixedTarget(
    target: RenderTarget,
    capitalize: boolean,
): ReactNode {
    if (target.type === "section") {
        return renderSectionLink(
            target,
            capitalize,
        );
    }

    const prefix =
        applyCapitalization(
            singularNames[target.type],
            capitalize,
        );

    return (
        <a
            key={target.anchorId}
            href={`#${target.anchorId}`}
            className="reference-link"
        >
            {prefix} {target.displayText}
        </a>
    );
}

function renderSectionLink(
    target: RenderTarget,
    capitalize: boolean,
): ReactNode {
    return (
        <a
            key={target.anchorId}
            href={`#${target.anchorId}`}
            className="reference-link reference-link--section"
        >
            {applyCapitalization(
                target.displayText,
                capitalize,
            )}
        </a>
    );
}

function renderNumberLink(
    target: RenderTarget,
): ReactNode {
    return (
        <a
            key={target.anchorId}
            href={`#${target.anchorId}`}
            className="reference-link"
        >
            {target.displayText}
        </a>
    );
}

function joinNodes(
    nodes: ReactNode[],
): ReactNode {
    if (nodes.length <= 1) {
        return nodes[0] ?? null;
    }

    if (nodes.length === 2) {
        return (
            <>
                {nodes[0]} and {nodes[1]}
            </>
        );
    }

    return nodes.map(
        (node, index) => (
            <Fragment key={index}>
                {index === 0
                    ? ""
                    : index ===
                        nodes.length - 1
                      ? ", and "
                      : ", "}
                {node}
            </Fragment>
        ),
    );
}

function applyCapitalization(
    value: string,
    capitalize: boolean,
): string {
    if (!capitalize) {
        return value;
    }

    const letterIndex =
        value.search(/[A-Za-zÆØÅæøå]/);

    if (letterIndex === -1) {
        return value;
    }

    return (
        value.slice(0, letterIndex) +
        value[letterIndex].toLocaleUpperCase() +
        value.slice(letterIndex + 1)
    );
}

function isReferenceType(
    value: string,
): value is ReferenceType {
    return (
        value === "equation" ||
        value === "figure" ||
        value === "table" ||
        value === "section"
    );
}

export default ReferenceCommandRenderer;
