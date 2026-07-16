const assetModules = import.meta.glob(
    "../assets/**/*.{png,jpg,jpeg,webp,svg}",
    {
        eager: true,
        query: "?url",
        import: "default",
    },
) as Record<string, string>;

const assetsByPath = new Map<string, string>(
    Object.entries(assetModules).map(
        ([modulePath, url]) => {
            const assetPath = modulePath
                .replace("../assets/", "")
                .replaceAll("\\", "/");

            return [
                normalizeAssetPath(assetPath),
                url,
            ];
        },
    ),
);

export function findFigureAsset(
    authoredPath: string,
): string | undefined {
    return assetsByPath.get(
        normalizeAssetPath(authoredPath),
    );
}

export function getFigureAssetPaths(): string[] {
    return [
        ...assetsByPath.keys(),
    ];
}

function normalizeAssetPath(
    path: string,
): string {
    return path
        .trim()
        .replaceAll("\\", "/")
        .replace(/^\.?\//, "")
        .toLowerCase();
}