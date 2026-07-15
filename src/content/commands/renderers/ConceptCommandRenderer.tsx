import ConceptReference from "../../../components/Concept/ConceptReference";

import type { CommandRenderer } from "../CommandRenderer";

const ConceptCommandRenderer: CommandRenderer = {
    render(arguments_) {
        const id = arguments_[0];
        const alias = arguments_[1];

        if (!id) {
            return (
                <span className="command-error">
                    Missing concept ID
                </span>
            );
        }

        return (
            <ConceptReference
                id={id}
                alias={alias}
            />
        );
    },
};

export default ConceptCommandRenderer;