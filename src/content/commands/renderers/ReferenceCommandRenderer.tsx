import type {
    MouseEvent,
    ReactNode,
} from "react";

import type { ReferenceType } from "../../references/ReferenceTarget";

import type { CommandRenderer } from "../CommandRenderer";

interface RenderTarget {
    type: ReferenceType;
    anchorId: string;
    number: string;
}

const ReferenceCommandRenderer: CommandRenderer = {
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

        return renderReferenceList(
            targets,
            capitalize,
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
        const number =
            arguments_[index + 2];

        if (
            !isReferenceType(type) ||
            !anchorId ||
            !number
        ) {
            continue;
        }

        targets.push({
            type,
            anchorId,
            number,
        });
    }

    return targets;
}

function renderReferenceList(
    targets: RenderTarget[],
    capitalize: boolean,
): ReactNode {
    const allSameType = targets.every(
        (target) => {
            return (
                target.type ===
                targets[0].type
            );
        },
    );

    if (allSameType) {
        return renderSameTypeReferences(
            targets,
            capitalize,
        );
    }

    return renderMixedReferences(
        targets,
        capitalize,
    );
}

function renderSameTypeReferences(
    targets: RenderTarget[],
    capitalize: boolean,
): ReactNode {
    const typeName = getTypeName(
        targets[0].type,
        targets.length > 1,
    );

    const displayedTypeName = capitalize
        ? capitalizeFirst(typeName)
        : typeName;

    if (targets.length === 1) {
        const target = targets[0];

        return (
            <ReferenceLink target={target}>
                {displayedTypeName}{" "}
                {target.number}
            </ReferenceLink>
        );
    }

    return (
        <>
            {displayedTypeName}
            {" "}
            {renderLinkedNumbers(targets)}
        </>
    );
}
function renderMixedReferences(
    targets: RenderTarget[],
    capitalize: boolean,
): ReactNode {
    return (
        <>
            {targets.map(
                (target, index) => {
                    const typeName =
                        getTypeName(
                            target.type,
                            false,
                        );

                    const displayedTypeName =
                        index === 0 &&
                        capitalize
                            ? capitalizeFirst(
                                  typeName,
                              )
                            : typeName;

                    return (
                        <span key={target.anchorId}>
                            {index > 0 &&
                                getSeparator(
                                    index,
                                    targets.length,
                                )}

                            {displayedTypeName}
                            {" "}

                            <ReferenceLink
                                target={target}
                            />
                        </span>
                    );
                },
            )}
        </>
    );
}

function renderLinkedNumbers(
    targets: RenderTarget[],
): ReactNode {
    return targets.map(
        (target, index) => (
            <span key={target.anchorId}>
                {index > 0 &&
                    getSeparator(
                        index,
                        targets.length,
                    )}

                <ReferenceLink
                    target={target}
                />
            </span>
        ),
    );
}

function ReferenceLink({
    target,
    children,
}: {
    target: RenderTarget;
    children?: ReactNode;
}) {
    function handleClick(
        event: MouseEvent<HTMLAnchorElement>,
    ): void {
        event.preventDefault();

        scrollToReferenceTarget(
            target.anchorId,
        );
    }

    return (
        <a
            href={`#${target.anchorId}`}
            className="reference-link"
            onClick={handleClick}
        >
            {children ?? target.number}
        </a>
    );
}

function scrollToReferenceTarget(
    anchorId: string,
): void {
    const target =
        document.getElementById(anchorId);

    if (!target) {
        console.warn(
            `Reference target "${anchorId}" was not found.`,
        );

        return;
    }

    const scrollContainer =
        findScrollableAncestor(target);

    const topOffset = 18; // CHANGE THIS

    if (scrollContainer) {
        const containerRect =
            scrollContainer.getBoundingClientRect();

        const targetRect =
            target.getBoundingClientRect();

        const targetTop =
            scrollContainer.scrollTop +
            targetRect.top -
            containerRect.top -
            topOffset;

        scrollContainer.scrollTo({
            top: targetTop,
            behavior: "smooth",
        });
    } else {
        const targetTop =
            window.scrollY +
            target.getBoundingClientRect().top -
            topOffset;

        window.scrollTo({
            top: targetTop,
            behavior: "smooth",
        });
    }

    window.history.pushState(
        null,
        "",
        `#${anchorId}`,
    );
}

function findScrollableAncestor(
    element: Element,
): HTMLElement | undefined {
    let parent = element.parentElement;

    while (parent) {
        const style =
            window.getComputedStyle(parent);

        const overflowY =
            style.overflowY;

        const canScroll =
            (
                overflowY === "auto" ||
                overflowY === "scroll"
            ) &&
            parent.scrollHeight >
                parent.clientHeight;

        if (canScroll) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return undefined;
}

function getSeparator(
    index: number,
    total: number,
): string {
    if (index === total - 1) {
        return total === 2
            ? " and "
            : ", and ";
    }

    return ", ";
}

function getTypeName(
    type: ReferenceType,
    plural: boolean,
): string {
    switch (type) {
        case "equation":
            return plural
                ? "equations"
                : "equation";

        case "figure":
            return plural
                ? "figures"
                : "figure";

        case "table":
            return plural
                ? "tables"
                : "table";

        case "section":
            return plural
                ? "sections"
                : "section";
    }
}

function capitalizeFirst(
    value: string,
): string {
    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
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