import type { ExtraProps } from "react-markdown";
import { commandRegistry } from "../../content/commands/commandRegistry";
import UiText from "../UI/UiText";

interface CommandElementProps extends ExtraProps {
    command?: string;
    arguments?: string;
}
export default function CommandTokenComponent({ command, arguments: serializedArguments }: CommandElementProps) {
    if (!command) return (
        <span className="command-error"><UiText id="commands.invalidToken" /></span>
    );
    const renderer = commandRegistry.get(command);
    if (!renderer) return (
        <span className="command-error"><UiText id="commands.unknown" values={{ name: command }} /></span>
    );
    return <>{renderer.render(parseArguments(serializedArguments))}</>;
}
function parseArguments(serializedArguments: string | undefined): string[] {
    if (!serializedArguments) return [];
    try {
        const parsed: unknown = JSON.parse(serializedArguments);
        if (Array.isArray(parsed) && parsed.every(value => typeof value === "string")) return parsed;
    } catch { /* Let the renderer handle invalid arguments. */ }
    return [];
}
