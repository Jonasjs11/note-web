import MarkdownRenderer from "../Markdown/MarkdownRenderer";

import { commandRegistry } from "../../content/commands/commandRegistry";

import { parseCommandTokens } from "../../content/commands/parseCommandTokens";

interface Props {
    source: string;
}

export default function DocumentRenderer({
    source,
}: Props) {

    const nodes =
        parseCommandTokens(source);

    return (

        <>

            {
                nodes.map(
                    (node, index) => {

                        if (
                            node.type === "text"
                        ) {

                            return (
                                <MarkdownRenderer
                                    key={index}
                                    source={node.text}
                                />
                            );

                        }

                        const renderer =
                            commandRegistry.get(
                                node.command,
                            );

                        if (!renderer) {

                            return (
                                <span
                                    key={index}
                                    style={{
                                        color: "red",
                                    }}
                                >
                                    Unknown command "{node.command}"
                                </span>
                            );

                        }

                        return (
                            <span key={index}>
                                {
                                    renderer.render(
                                        node.arguments,
                                    )
                                }
                            </span>
                        );

                    },
                )
            }

        </>

    );

}