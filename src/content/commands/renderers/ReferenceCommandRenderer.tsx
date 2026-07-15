import type { CommandRenderer } from "../CommandRenderer";

const ReferenceCommandRenderer: CommandRenderer = {
    render(arguments_) {
        const anchorId = arguments_[0];
        const text = arguments_[1];

        if (!anchorId || !text) {
            return (
                <span className="command-error">
                    Invalid reference
                </span>
            );
        }

        return (
            <a
                href={`#${anchorId}`}
                className="reference-link"
            >
                {text}
            </a>
        );
    },
};

export default ReferenceCommandRenderer;