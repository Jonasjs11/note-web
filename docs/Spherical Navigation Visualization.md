# Spherical navigation visualisation

Embedding: \`\\simulation{orthodrome-loxodrome}\` in any authored note. Standalone default note: \`src/content/notes/navigation/Ortodromer og loksodromer.mdx\`.

The component is lazy-loaded by \`SimulationCommandRenderer\`. The existing \`SimulationPlayer\` is a time-stepped Canvas2D physics runtime with a 2D world; the new geographical renderer is intentionally an independent interactive canvas view while preserving the public simulation command. Generic pieces live in \`src/simulations/runtime/geography/\`.

- \`sphericalNavigation.ts\`: pure spherical geometry, great-circle interpolation, rhumb interpolation via Mercator latitude, bearings, distances in nautical miles, meridian crossings, vector math. Earth radius: 6,371.0088 km.
- \`GeographicViewport.tsx\`: projection and rendering layer; orthographic globe, Mercator, equirectangular; pointer interaction; great-circle plane; country outlines; per-route hover inspection.
- \`countries.json\`: simplified geographic polygon boundary rings bundled locally. Source: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson (country polygon coordinates). Country boundaries are for illustration, not navigation.
- \`OrthodromeLoxodrome.tsx\`: controls, route presets, coordinate editor, distance comparison, language-aware labels.
- \`orthodrome-loxodrome.css\`: adaptive styling using existing simulation CSS variables.

Implementation notes:
- **Spherical, not ellipsoidal**: use ellipsoid geodesics for real high-precision navigation.
- **Rhumb longitude**: the short signed change in longitude is used; the global infinite loxodrome is not drawn.
- **Antipodal points**: the chosen great-circle plane is mathematically non-unique and deterministic only for display.
- **Hover bearing**: "angle to latitude" means the undirected acute angle between the track tangent and local parallel, not the normal navigation bearing from north. The true track is also shown.
- **Mercator latitude**: limited to ±85° to keep a finite map.
- **Interaction**: drag rotates the globe or pans a flat map, tap picks selected A or B; hover works with a mouse, while touch users can use the endpoint true tracks and touch interaction. A dedicated tap-to-inspect interaction can be added later.
- **No WebGL dependency**: canvas draws an orthographic 3D sphere with depth-aware geographic paths; good support on older devices without hardware GPU requirements. It is not a physically shaded, textured WebGL globe.
- **Projection animation**: morphs positions from an orthographic globe into the selected flat projection. This is a graphical transition, not a physically exact peeling/unfolding of a sphere.
