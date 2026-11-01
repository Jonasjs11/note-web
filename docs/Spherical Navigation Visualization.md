# Spherical navigation visualisation

Embedding: \`\\simulation{orthodrome-loxodrome}\` in any authored note. Standalone default note: \`src/content/notes/navigation/Ortodromer og loksodromer.mdx\`.

The component is lazy-loaded by \`SimulationCommandRenderer\`. The existing \`SimulationPlayer\` is a time-stepped Canvas2D physics runtime with a 2D world; the new geographical renderer is intentionally an independent interactive canvas view while preserving the public simulation command. Generic pieces live in \`src/simulations/runtime/geography/\`.

- \`sphericalNavigation.ts\`: pure spherical geometry, great-circle interpolation, rhumb interpolation via Mercator latitude, bearings, spherical distances in nautical miles (with kilometers derived using 1 NM = 1.852 km), meridian crossings, complete great-circle and near-polar rhumb continuation, vector math. Earth radius: 6,371.0088 km.
- \`GeographicViewport.tsx\`: projection and rendering layer; orthographic globe, Mercator, and route-fitted spherical Lambert conformal conic (2SP); pointer interaction; great-circle plane; country outlines; per-route hover inspection.
- \`countries.json\`: simplified geographic polygon boundary rings bundled locally. Source: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson (country polygon coordinates). Country boundaries are for illustration, not navigation.
- \`OrthodromeLoxodrome.tsx\`: controls, route presets, coordinate editor, distance comparison in NM and km, selection modes that clear after each point, full-route toggle, navigation controls above route pickers, language-aware labels.
- \`orthodrome-loxodrome.css\`: adaptive styling using existing simulation CSS variables.

Implementation notes:
- **Spherical, not ellipsoidal**: use ellipsoid geodesics for real high-precision navigation.
- **Rhumb longitude**: the short signed longitude change selects the A→B route. Since non-east/west rhumb lines are infinite, the full-route toggle shows at most one complete longitude revolution (centered on the A→B leg) to prevent hundreds of near-overlapping loops on nearly east/west routes such as Cape Town–Sydney. It also stops at the near-polar limit. Constant-latitude rhumb lines close on a parallel. Orthodromes show their complete 360° great circle.
- **Antipodal points**: the chosen great-circle plane is mathematically non-unique and deterministic only for display.
- **Hover bearing**: the true-track angle (0–360° clockwise from north) is now shown alone, with a local meridian and a full clockwise 0→track-angle arc, including reflex (>180°) arcs.
- **Mercator latitude**: limited to ±85° to keep a finite map. Full-route samples above this range are hidden to avoid drawing artificial horizontal polar lines.
- **Lambert**: pure spherical 2-standard-parallel conformal conic, automatically centered on the great-circle midpoint with standards around average route latitude. Both A→B paths determine the screen fit. Great circles are generally only approximately straight, not mathematically straight. Inversion permits point picking, and flat-map drag pans the chart.
- **Countries**: spherical polygons are clipped to the visible globe hemisphere at the limb and closed along the limb; flat polygons unwrap their longitudes across the map seam and are clipped to the chart viewport.
- **Interaction**: drag rotates the globe or pans a flat map, tap picks selected A or B; hover works with a mouse, while touch users can use the endpoint true tracks and touch interaction. A dedicated tap-to-inspect interaction can be added later.
- **No WebGL dependency**: canvas draws an orthographic 3D sphere with depth-aware geographic paths; good support on older devices without hardware GPU requirements. It is not a physically shaded, textured WebGL globe.
- **Projection animation**: morphs positions from an orthographic globe into the selected flat projection. This is a graphical transition, not a physically exact peeling/unfolding of a sphere.
