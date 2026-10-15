import type { ChangeEvent } from "react";
import { useLanguage } from "../../app/LanguageContext";
import { localizedDefinitionLabel } from "../../i18n/simulationLocalization";
import type {
    RuntimeParameterValues,
    SimulationParameterDefinitions,
    SimulationParameterValue,
} from "./simulationTypes";

interface SimulationControlsProps {
    definitions: SimulationParameterDefinitions;
    values: RuntimeParameterValues;
    onChange(key: string, value: SimulationParameterValue): void;
}
export default function SimulationControls({ definitions, values, onChange }: SimulationControlsProps) {
    const { language } = useLanguage();
    return (
        <div className="simulation-controls__parameters">
            {Object.entries(definitions).map(([key, definition]) => {
                const value = values[key];
                const label = localizedDefinitionLabel(definition, language);
                if (definition.kind === "range") {
                    const numberValue = typeof value === "number" ? value : definition.initial;
                    return (
                        <label key={key} className="simulation-control simulation-control--range">
                            <span className="simulation-control__heading">
                                <span>{label}</span>
                                <output>
                                    {new Intl.NumberFormat(language === "da" ? "da-DK" : "en-GB", {
                                        maximumFractionDigits: 3,
                                    }).format(numberValue)}
                                    {definition.unit ? ` ${definition.unit}` : ""}
                                </output>
                            </span>
                            <input type="range" min={definition.min} max={definition.max}
                                step={definition.step ?? "any"} value={numberValue}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    onChange(key, Number(event.currentTarget.value))} />
                        </label>
                    );
                }
                if (definition.kind === "boolean") {
                    const checked = typeof value === "boolean" ? value : definition.initial;
                    return (
                        <label key={key} className="simulation-control simulation-control--boolean">
                            <input type="checkbox" checked={checked}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    onChange(key, event.currentTarget.checked)} />
                            <span>{label}</span>
                        </label>
                    );
                }
                const selectedValue = typeof value === "string" ? value : definition.initial;
                return (
                    <label key={key} className="simulation-control simulation-control--select">
                        <span>{label}</span>
                        <select value={selectedValue}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                onChange(key, event.currentTarget.value)}>
                            {definition.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {localizedDefinitionLabel(option, language)}
                                </option>
                            ))}
                        </select>
                    </label>
                );
            })}
        </div>
    );
}
