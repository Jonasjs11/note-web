import type {
    RuntimeSimulationDefinition,
    SimulationModule,
} from "../runtime/defineSimulation";

export type SimulationLoader =
    () => Promise<SimulationModule>;

const moduleLoaders =
    import.meta.glob<SimulationModule>(
        "../definitions/*/simulation.ts",
    );

const loadedSimulationPromises =
    new Map<
        string,
        Promise<RuntimeSimulationDefinition>
    >();

export function listSimulationIds(): string[] {
    return Object.keys(moduleLoaders)
        .map(extractSimulationId)
        .filter(
            (id): id is string =>
                id !== undefined,
        )
        .sort();
}

export function hasSimulation(
    simulationId: string,
): boolean {
    return (
        getSimulationLoader(simulationId) !==
        undefined
    );
}

export function getSimulationLoader(
    simulationId: string,
): SimulationLoader | undefined {
    return moduleLoaders[
        createModulePath(simulationId)
    ];
}

export function loadSimulation(
    simulationId: string,
): Promise<RuntimeSimulationDefinition> {
    const cached =
        loadedSimulationPromises.get(
            simulationId,
        );

    if (cached) {
        return cached;
    }

    const loader =
        getSimulationLoader(simulationId);

    if (!loader) {
        return Promise.reject(
            new Error(
                `Unknown simulation "${simulationId}".`,
            ),
        );
    }

    const promise = loader().then(
        ({ default: definition }) => {
            if (
                !definition ||
                definition.id !== simulationId
            ) {
                throw new Error(
                    `Simulation module "${simulationId}" must export a definition with the same id.`,
                );
            }

            return definition;
        },
    );

    loadedSimulationPromises.set(
        simulationId,
        promise,
    );

    promise.catch(() => {
        loadedSimulationPromises.delete(
            simulationId,
        );
    });

    return promise;
}

function createModulePath(
    simulationId: string,
): string {
    return `../definitions/${simulationId}/simulation.ts`;
}

function extractSimulationId(
    path: string,
): string | undefined {
    const match = path.match(
        /^\.\.\/definitions\/([^/]+)\/simulation\.ts$/,
    );

    return match?.[1];
}
