import type {
    CommandRenderer,
} from "../CommandRenderer";

const SectionAnchorCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const anchorId =
                arguments_[0];

            if (!anchorId) {
                return (
                    <span className="command-error">
                        Invalid section anchor
                    </span>
                );
            }

            return (
                <span
                    id={anchorId}
                    className="section-anchor"
                    aria-hidden="true"
                />
            );
        },
    };

export default SectionAnchorCommandRenderer;
