import { Link } from "react-router-dom";

import type { CommandRenderer } from "../CommandRenderer";

const ConceptCommandRenderer: CommandRenderer = {

    render(args) {

        const id = args[0];

        const alias = args[1];

        return (

            <Link
                to={`/concepts/${id}`}
                className="concept-link"
            >
                {alias ?? id}
            </Link>

        );

    },

};

export default ConceptCommandRenderer;