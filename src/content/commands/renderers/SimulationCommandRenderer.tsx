import SimulationPlayer
    from "../../../simulations/runtime/SimulationPlayer";

import type {
    CommandRenderer,
} from "../CommandRenderer";

const SimulationCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const simulationId =
                arguments_[0]?.trim();

            if (!simulationId) {
                return (
                    <div className="command-error">
                        Invalid simulation
                    </div>
                );
            }

            return (
                <SimulationPlayer
                    simulationId={simulationId}
                />
            );
        },
    };

export default SimulationCommandRenderer;
