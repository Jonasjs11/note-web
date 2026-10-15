import { Fragment } from "react";
import type { ReactNode } from "react";
import type { ReferenceType } from "../../references/ReferenceTarget";
import type { CommandRenderer } from "../CommandRenderer";
import DocumentAnchorLink from "../../../components/DocumentAnchorLink";
import { useUiTranslation } from "../../../i18n/useUiTranslation";
import type { UiTranslationKey } from "../../../i18n/uiTranslations";

interface RenderTarget {
    type: ReferenceType;
    anchorId: string;
    displayText: string;
}
type T = ReturnType<typeof useUiTranslation>;
type NumberedReferenceType = Exclude<ReferenceType, "section">;
const singularNames: Record<NumberedReferenceType, UiTranslationKey> = {
    equation: "reference.equation",
    figure: "reference.figure",
    table: "reference.table",
};
const pluralNames: Record<NumberedReferenceType, UiTranslationKey> = {
    equation: "reference.equations",
    figure: "reference.figures",
    table: "reference.tables",
};
const ReferenceCommandRenderer: CommandRenderer = {
    render(arguments_) {
        return <ReferenceContents args={arguments_} />;
    },
};
function ReferenceContents({ args }: { args: string[] }) {
    const t = useUiTranslation();
    const targets = parseTargets(args.slice(1));
    if (!targets.length) return <span className="command-error">{t("reference.invalid")}</span>;
    return (
        <span className="reference">
            {renderTargets(targets, args[0] === "true", t)}
        </span>
    );
}
function parseTargets(arguments_: string[]): RenderTarget[] {
    const targets: RenderTarget[] = [];
    for (let index = 0; index + 2 < arguments_.length; index += 3) {
        const type = arguments_[index];
        const anchorId = arguments_[index + 1];
        const displayText = arguments_[index + 2];
        if (!isReferenceType(type) || !anchorId || !displayText) continue;
        targets.push({ type, anchorId, displayText });
    }
    return targets;
}
function renderTargets(targets: RenderTarget[], capitalize: boolean, t: T): ReactNode {
    const firstType = targets[0].type;
    const sameType = targets.every(target => target.type === firstType);
    if (sameType) {
        if (firstType === "section") {
            return joinNodes(targets.map((target, index) =>
                renderSectionLink(target, capitalize && index === 0)), t);
        }
        return renderSameNumberedType(targets, firstType, capitalize, t);
    }
    return joinNodes(targets.map((target, index) =>
        renderMixedTarget(target, capitalize && index === 0, t)), t);
}
function renderSameNumberedType(targets: RenderTarget[], type: NumberedReferenceType,
    capitalize: boolean, t: T): ReactNode {
    if (targets.length === 1) {
        const prefix = applyCapitalization(t(singularNames[type]), capitalize);
        return (
            <DocumentAnchorLink anchorId={targets[0].anchorId} className="reference-link">
                {prefix} {targets[0].displayText}
            </DocumentAnchorLink>
        );
    }
    const prefix = applyCapitalization(t(pluralNames[type]), capitalize);
    return <>{prefix} {joinNodes(targets.map(renderNumberLink), t)}</>;
}
function renderMixedTarget(target: RenderTarget, capitalize: boolean, t: T): ReactNode {
    if (target.type === "section") return renderSectionLink(target, capitalize);
    const prefix = applyCapitalization(t(singularNames[target.type]), capitalize);
    return (
        <DocumentAnchorLink key={target.anchorId} anchorId={target.anchorId}
            className="reference-link">{prefix} {target.displayText}</DocumentAnchorLink>
    );
}
function renderSectionLink(target: RenderTarget, capitalize: boolean): ReactNode {
    return (
        <DocumentAnchorLink key={target.anchorId} anchorId={target.anchorId}
            className="reference-link reference-link--section">
            {applyCapitalization(target.displayText, capitalize)}
        </DocumentAnchorLink>
    );
}
function renderNumberLink(target: RenderTarget): ReactNode {
    return (
        <DocumentAnchorLink key={target.anchorId} anchorId={target.anchorId}
            className="reference-link">{target.displayText}</DocumentAnchorLink>
    );
}
function joinNodes(nodes: ReactNode[], t: T): ReactNode {
    if (nodes.length <= 1) return nodes[0] ?? null;
    if (nodes.length === 2) return <>{nodes[0]} {t("reference.and")} {nodes[1]}</>;
    return nodes.map((node, index) => (
        <Fragment key={index}>
            {index === 0 ? "" : index === nodes.length - 1 ? t("reference.lastSeparator") : ", "}
            {node}
        </Fragment>
    ));
}
function applyCapitalization(value: string, capitalize: boolean): string {
    if (!capitalize) return value;
    const letterIndex = value.search(/[A-Za-zÆØÅæøå]/);
    if (letterIndex === -1) return value;
    return value.slice(0, letterIndex) + value[letterIndex].toLocaleUpperCase() + value.slice(letterIndex + 1);
}
function isReferenceType(value: string): value is ReferenceType {
    return value === "equation" || value === "figure" || value === "table" || value === "section";
}
export default ReferenceCommandRenderer;
