# Spherical navigation visualisation

Embedding: \`\\simulation{orthodrome-loxodrome}\` in any authored note. Standalone default note: \`src/content/notes/navigation/Ortodromer og loksodromer.mdx\`.

The component is lazy-loaded by \`SimulationCommandRenderer\`. The existing \`SimulationPlayer\` is a time-stepped Canvas2D physics runtime with a 2D world; the new geographical renderer is intentionally an independent interactive canvas view while preserving the public simulation command. Generic pieces live in \`src/simulations/runtime/geography/\`.

- \`sphericalNavigation.ts\`: pure spherical geometry, great-circle interpolation, rhumb interpolation via Mercator latitude, bearings, spherical distances in nautical miles (with kilometers derived using 1 NM = 1.852 km), meridian crossings, complete great-circle and near-polar rhumb continuation, vector math. Earth radius: 6,371.0088 km.
- \`GeographicViewport.tsx\`: projection and rendering layer; orthographic globe and Mercator; pointer interaction; great-circle plane; country outlines; per-route hover inspection.
- \`countries.json\`: simplified geographic polygon boundary rings bundled locally. Source: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson (country polygon coordinates). Country boundaries are for illustration, not navigation.
- \`OrthodromeLoxodrome.tsx\`: controls, route presets, coordinate editor, distance comparison in NM and km, selection modes that clear after each point, full-route toggle, language-aware labels.
- \`orthodrome-loxodrome.css\`: adaptive styling using existing simulation CSS variables.

Implementation notes:
- **Spherical, not ellipsoidal**: use ellipsoid geodesics for real high-precision navigation.
- **Rhumb longitude**: the short signed change in longitude selects the A→B route. When showing complete routes, the infinitely spiraling loxodrome is drawn as far as ±89.8° on the globe (or the Mercator ±85° map limit). Constant-latitude rhumb lines close around a parallel. The complete orthodrome draws all 360° of its great circle.
- **Antipodal points**: the chosen great-circle plane is mathematically non-unique and deterministic only for display.
- **Hover bearing**: "angle to meridian" is the undirected acute 0–90° angle between the tangent and the local north/south meridian. This differs from the signed true track angle (0–360° clockwise from north), which is also shown.
- **Mercator latitude**: limited to ±85° to keep a finite map. Full-route samples above this range are hidden to avoid drawing artificial horizontal polar lines.
- **Interaction**: drag rotates the globe or pans a flat map, tap picks selected A or B; hover works with a mouse, while touch users can use the endpoint true tracks and touch interaction. A dedicated tap-to-inspect interaction can be added later.
- **No WebGL dependency**: canvas draws an orthographic 3D sphere with depth-aware geographic paths; good support on older devices without hardware GPU requirements. It is not a physically shaded, textured WebGL globe.
- **Projection animation**: morphs positions from an orthographic globe into the selected flat projection. This is a graphical transition, not a physically exact peeling/unfolding of a sphere.
