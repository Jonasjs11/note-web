import {lazy, Suspense} from "react";
const OrthodromeLoxodrome=lazy(()=>import("../../../simulations/definitions/orthodrome-loxodrome/OrthodromeLoxodrome"));
import SimulationPlayer from "../../../simulations/runtime/SimulationPlayer";
import type { CommandRenderer } from "../CommandRenderer";
import UiText from "../../../components/UI/UiText";

const SimulationCommandRenderer: CommandRenderer = {
    render(arguments_) {
        const simulationId = arguments_[0]?.trim();
        if (!simulationId) return (
            <div className="command-error"><UiText id="simulation.invalid" /></div>
        );
        if (simulationId === "orthodrome-loxodrome") return <Suspense fallback={<div className="simulation-player__placeholder">Loading globe…</div>}><OrthodromeLoxodrome /></Suspense>;
        return <SimulationPlayer simulationId={simulationId} />;
    },
};
export default SimulationCommandRenderer;
