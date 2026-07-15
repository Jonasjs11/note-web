import type { ExtraProps } from "react-markdown";

import { commandRegistry } from "../../content/commands/commandRegistry";

interface CommandElementProps extends ExtraProps {
    command?: string;
    arguments?: string;
}

export default function CommandTokenComponent({
    command,
    arguments: serializedArguments,
}: CommandElementProps) {
    if (!command) {
        return (
            <span className="command-error">
                Invalid command token
            </span>
        );
    }

    const renderer = commandRegistry.get(command);

    if (!renderer) {
        return (
            <span className="command-error">
                Unknown command: \{command}
            </span>
        );
    }

    const arguments_ = parseArguments(
        serializedArguments,
    );

    return <>{renderer.render(arguments_)}</>;
}

function parseArguments(
    serializedArguments: string | undefined,
): string[] {
    if (!serializedArguments) {
        return [];
    }

    try {
        const parsed: unknown = JSON.parse(
            serializedArguments,
        );

        if (
            Array.isArray(parsed) &&
            parsed.every(
                (value) =>
                    typeof value === "string",
            )
        ) {
            return parsed;
        }
    } catch {
        // The error component below is preferable
        // to crashing the entire document.
    }

    return [];
}