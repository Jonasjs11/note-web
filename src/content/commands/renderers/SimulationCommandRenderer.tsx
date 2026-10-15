import SimulationPlayer from "../../../simulations/runtime/SimulationPlayer";
import type { CommandRenderer } from "../CommandRenderer";
import UiText from "../../../components/UI/UiText";

const SimulationCommandRenderer: CommandRenderer = {
    render(arguments_) {
        const simulationId = arguments_[0]?.trim();
        if (!simulationId) return (
            <div className="command-error"><UiText id="simulation.invalid" /></div>
        );
        return <SimulationPlayer simulationId={simulationId} />;
    },
};
export default SimulationCommandRenderer;
