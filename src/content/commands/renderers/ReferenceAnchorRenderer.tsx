import type { CommandRenderer } from "../CommandRenderer";

const ReferenceAnchorRenderer: CommandRenderer = {
    render(arguments_) {
        const anchorId = arguments_[0];

        if (!anchorId) {
            return null;
        }

        return (
            <span
                id={anchorId}
                className="reference-anchor"
                aria-hidden="true"
            />
        );
    },
};

export default ReferenceAnchorRenderer;