import {
  booleanParameter,
  defineSimulation,
  rangeParameter,
  selectParameter,
  type SimulationDrawContext,
} from "../../runtime";
import {
  POSITION_SCALE,
  DEFAULT_GUST_FIRST_OFFSET,
  DEFAULT_GUST_HALF_WIDTH,
  DEFAULT_GUST_SPACING,
  add,
  clamp,
  clampMagnitude,
  finiteVector,
  headingVector,
  localWindAt,
  magnitude,
  normalize,
  scale,
  shortestAngleDifference,
  stepAircraftDynamics,
  subtract,
  vectorBearing,
  velocityIdentity,
  windVectorFromAviation,
  type ControlMode,
  type GustMode,
  type Vector2,
} from "./model";

const parameters = {
  targetTas: rangeParameter({
    label: "Target true airspeed",
    initial: 70,
    min: 20,
    max: 160,
    step: 1,
    unit: "kt",
    description: "The aircraft's selected speed relative to the surrounding air.",
    resetOnChange: false,
  }),
  commandCourse: rangeParameter({
    label: "Commanded heading / track",
    initial: 90,
    min: 0,
    max: 359,
    step: 1,
    unit: "°",
    description: "Used as heading in heading-hold mode and ground track in track-hold mode.",
    resetOnChange: false,
  }),
  windSpeed: rangeParameter({
    label: "Steady wind speed",
    initial: 20,
    min: 0,
    max: 80,
    step: 1,
    unit: "kt",
    description: "Speed of the air mass over the ground.",
    resetOnChange: false,
  }),
  windFrom: rangeParameter({
    label: "Wind from",
    initial: 270,
    min: 0,
    max: 359,
    step: 1,
    unit: "°",
    description: "Aviation convention: the direction the wind comes from.",
    resetOnChange: false,
  }),
  controlMode: selectParameter({
    label: "Pilot task",
    initial: "heading-hold",
    options: [
      { value: "free", label: "Hands off — trimmed TAS only" },
      { value: "heading-hold", label: "Hold selected heading" },
      { value: "track-hold", label: "Hold selected ground track" },
    ],
    description:
      "Choose what the pilot/autopilot corrects after wind changes. Track hold turns into the wind; heading hold allows drift.",
    resetOnChange: false,
  }),
  referenceFrame: selectParameter({
    label: "Reference frame",
    initial: "ground",
    options: [
      { value: "ground", label: "Ground-relative view" },
      { value: "aircraft", label: "Aircraft-relative view" },
    ],
    description: "Ground objects are fixed in ground view; the aircraft is fixed in aircraft view.",
    resetOnChange: false,
  }),
  gustMode: selectParameter({
    label: "Temporary gust",
    initial: "crosswind-left",
    options: [
      { value: "off", label: "Off — steady wind only" },
      { value: "headwind", label: "Headwind gust — briefly increases air moving against flight" },
      { value: "tailwind", label: "Tailwind gust — briefly increases air moving with flight" },
      { value: "crosswind-left", label: "Crosswind from left — briefly pushes the aircraft right" },
      { value: "crosswind-right", label: "Crosswind from right — briefly pushes the aircraft left" },
    ],
    description:
      "The aircraft periodically crosses a compact gust: a quick smooth transition, a short full-strength section, then a quick smooth return to the steady wind.",
    resetOnChange: false,
  }),
  gustStrength: rangeParameter({
    label: "Gust strength (extra wind)",
    initial: 25,
    min: 0,
    max: 60,
    step: 1,
    unit: "kt",
    description: "Extra wind during the short full-strength center of each gust.",
    resetOnChange: false,
  }),
  showParticles: booleanParameter({
    label: "Show wind tracers",
    initial: true,
    description:
      "Each tracer is a moving air parcel shown as a circle with a short tail. Faster apparent airflow produces a longer tail.",
    resetOnChange: false,
  }),
  showTrails: booleanParameter({
    label: "Show ground and air trails",
    initial: true,
    description: "Solid breadcrumbs stay on the ground; dashed breadcrumbs move with the air.",
    resetOnChange: false,
  }),
  showVectors: booleanParameter({
    label: "Show velocity vectors",
    initial: true,
    description: "Display TAS, wind speed, and groundspeed vectors.",
    resetOnChange: false,
  }),
  showPilotInput: booleanParameter({
    label: "Show pilot correction",
    initial: true,
    description:
      "Highlight when the pilot/autopilot is turning or restoring airspeed after a wind change.",
    resetOnChange: false,
  }),
  showTriangle: booleanParameter({
    label: "Show velocity triangle",
    initial: true,
    description: "Display the three velocity vectors as a fitted triangle.",
    resetOnChange: false,
  }),
};

type ReferenceFrame = "ground" | "aircraft";

interface Particle {
  position: Vector2;
  size: number;
}

interface AirTrailPoint {
  position: Vector2;
  age: number;
}

interface State {
  position: Vector2;
  groundVelocity: Vector2;
  bodyHeadingDegrees: number;
  acceleration: Vector2;
  desiredAirVelocity: Vector2;
  pilotHeadingErrorDegrees: number;
  pilotSpeedError: number;
  elapsedTime: number;
  groundCamera: Vector2;
  groundCameraTarget: Vector2;
  groundCameraPanning: boolean;
  particles: Particle[];
  groundTrail: Vector2[];
  airTrail: AirTrailPoint[];
  trailAccumulator: number;
  recycleCounter: number;
}



type DrawContext = SimulationDrawContext<State, typeof parameters, {}>;
type Graphics = DrawContext["graphics"];
type Viewport = DrawContext["viewport"];
type ParameterValues = DrawContext["parameters"];
type PolylineStyle = Parameters<Graphics["polyline"]>[1];

const WORLD_WIDTH = 14;
const WORLD_HEIGHT = 8;
const WORLD_CENTER = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
const INITIAL_POSITION = { x: 0, y: 0 };
const PARTICLE_COUNT = 420;
const PARTICLE_RADIUS = 15;
const TRAIL_INTERVAL_SECONDS = 0.18;
const MAX_TRAIL_POINTS = 320;
const AIR_TRAIL_MAX_AGE_SECONDS = 48;
const VECTOR_PIXEL_SCALE = 1.6;
const GLIDER_SCALE = 3.2;

const asControlMode = (value: string): ControlMode => {
  if (value === "free" || value === "track-hold") {
    return value;
  }
  return "heading-hold";
};

const asReferenceFrame = (value: string): ReferenceFrame =>
  value === "aircraft" ? "aircraft" : "ground";

const asGustMode = (value: string): GustMode => {
  if (
    value === "headwind" ||
    value === "tailwind" ||
    value === "crosswind-left" ||
    value === "crosswind-right"
  ) {
    return value;
  }
  return "off";
};

const controlModeLabel = (mode: ControlMode): string => {
  switch (mode) {
    case "free":
      return "hands off — trimmed TAS";
    case "track-hold":
      return "pilot holding ground track";
    case "heading-hold":
    default:
      return "pilot holding heading";
  }
};

const gustEffectLabel = (mode: GustMode): string => {
  switch (mode) {
    case "headwind":
      return "extra wind against course";
    case "tailwind":
      return "extra wind along course";
    case "crosswind-left":
      return "from left → pushes right";
    case "crosswind-right":
      return "from right → pushes left";
    case "off":
    default:
      return "steady wind only";
  }
};

const fractional = (value: number): number => value - Math.floor(value);
const hash = (value: number): number => fractional(Math.sin(value * 127.1 + 311.7) * 43758.5453);
const hash2 = (x: number, y: number, salt = 0): number =>
  fractional(Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453);

const particleFromSeed = (seed: number, center: Vector2): Particle => {
  const angle = hash(seed * 3.17) * Math.PI * 2;
  const radius = Math.sqrt(hash(seed * 5.31 + 4)) * PARTICLE_RADIUS;
  return {
    position: {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    },
    size: 1.7 + hash(seed * 12.87) * 2.2,
  };
};

const keepLast = <T,>(items: T[], maximum: number): void => {
  if (items.length > maximum) {
    items.splice(0, items.length - maximum);
  }
};

const formatBearing = (degrees: number): string =>
  `${Math.round(((degrees % 360) + 360) % 360).toString().padStart(3, "0")}°`;

const screenPoint = (
  viewport: Viewport,
  worldPoint: Vector2,
  camera: Vector2,
): { x: number; y: number } =>
  viewport.point(
    worldPoint.x - camera.x + WORLD_CENTER.x,
    worldPoint.y - camera.y + WORLD_CENTER.y,
  );

const screenVector = (value: Vector2, scaleFactor: number): Vector2 => ({
  x: value.x * scaleFactor,
  y: -value.y * scaleFactor,
});

const currentWind = (
  currentParameters: ParameterValues,
  position: Vector2,
  elapsedTime: number,
): { baseWind: Vector2; localWind: Vector2; gustEnvelope: number; gustDistance: number } => {
  const baseWind = windVectorFromAviation(currentParameters.windSpeed, currentParameters.windFrom);
  const sample = localWindAt(baseWind, {
    mode: asGustMode(currentParameters.gustMode),
    strength: currentParameters.gustStrength,
    position,
    elapsedTime,
    courseDegrees: currentParameters.commandCourse,
    origin: INITIAL_POSITION,
  });
  return {
    baseWind,
    localWind: sample.localWind,
    gustEnvelope: sample.gust.envelope,
    gustDistance: sample.gust.signedDistance,
  };
};

interface GroundCameraState {
  camera: Vector2;
  target: Vector2;
  panning: boolean;
}

/**
 * Ground view behaves like a sequence of fixed ground cameras. The camera holds
 * completely still while the aircraft crosses the scene, then makes one short,
 * explicit repositioning move when the aircraft reaches the edge. This keeps the
 * view visually distinct from the continuously aircraft-locked reference frame.
 */
const updateGroundCamera = (
  camera: Vector2,
  target: Vector2,
  panning: boolean,
  aircraft: Vector2,
  groundVelocity: Vector2,
  deltaTime: number,
): GroundCameraState => {
  let nextTarget = target;
  let nextPanning = panning;
  const local = subtract(aircraft, camera);
  const outsideObservationWindow = Math.abs(local.x) > 5.15 || Math.abs(local.y) > 2.75;

  if (!nextPanning && outsideObservationWindow) {
    const travelDirection = normalize(groundVelocity, { x: 1, y: 0 });
    // Move the camera ahead of the aircraft. After the reposition, the aircraft
    // appears toward the trailing side and can visibly cross a fresh ground area.
    nextTarget = add(aircraft, scale(travelDirection, 3.25));
    nextPanning = true;
  }

  if (!nextPanning) {
    return { camera, target: nextTarget, panning: false };
  }

  const blend = 1 - Math.exp(-Math.max(0, deltaTime) * 4.2);
  const cameraDifference = subtract(nextTarget, camera);
  const smoothStep = scale(cameraDifference, blend);
  const maximumStep = Math.max(0, deltaTime) * 6;
  let nextCamera = add(camera, clampMagnitude(smoothStep, maximumStep));
  if (magnitude(subtract(nextTarget, nextCamera)) < 0.035) {
    nextCamera = { ...nextTarget };
    nextPanning = false;
  }

  return { camera: nextCamera, target: nextTarget, panning: nextPanning };
};

const recycleParticle = (state: State, particle: Particle): void => {
  state.recycleCounter += 1;
  const replacement = particleFromSeed(state.recycleCounter + 1000, state.position);
  particle.position = replacement.position;
  particle.size = replacement.size;
};

const drawPolyline = (
  graphics: Graphics,
  points: { x: number; y: number }[],
  style: PolylineStyle,
): void => {
  if (points.length >= 2) {
    graphics.polyline(points, style);
  }
};

const drawScenery = (
  graphics: Graphics,
  viewport: Viewport,
  camera: Vector2,
): void => {
  const minX = Math.floor((camera.x - 10) / 2.5) - 1;
  const maxX = Math.ceil((camera.x + 10) / 2.5) + 1;
  const minY = Math.floor((camera.y - 7) / 2.5) - 1;
  const maxY = Math.ceil((camera.y + 7) / 2.5) + 1;

  // Trees and houses provide the fixed ground reference without field grids or roads.

  for (let cellX = minX; cellX <= maxX; cellX += 1) {
    for (let cellY = minY; cellY <= maxY; cellY += 1) {
      const chance = hash2(cellX, cellY, 1);
      if (chance < 0.38) continue;

      const position = {
        x: cellX * 2.5 + (hash2(cellX, cellY, 2) - 0.5) * 1.5,
        y: cellY * 2.5 + (hash2(cellX, cellY, 3) - 0.5) * 1.5,
      };
      const point = screenPoint(viewport, position, camera);

      if (chance > 0.79) {
        const size = 7 + hash2(cellX, cellY, 4) * 5;
        graphics.rectangle(point.x - size * 0.65, point.y - size * 0.45, size * 1.3, size * 0.9, {
          fill: graphics.palette.muted,
          stroke: graphics.palette.foreground,
          strokeWidth: 0.8,
          alpha: 0.34,
        });
        graphics.line(
          { x: point.x - size * 0.78, y: point.y - size * 0.45 },
          { x: point.x, y: point.y - size * 0.95 },
          { color: graphics.palette.foreground, width: 1, alpha: 0.38 },
        );
        graphics.line(
          { x: point.x, y: point.y - size * 0.95 },
          { x: point.x + size * 0.78, y: point.y - size * 0.45 },
          { color: graphics.palette.foreground, width: 1, alpha: 0.38 },
        );
      } else {
        const radius = 4 + hash2(cellX, cellY, 5) * 3;
        graphics.line(
          { x: point.x, y: point.y + radius * 0.8 },
          { x: point.x, y: point.y + radius * 1.8 },
          { color: graphics.palette.muted, width: 2, alpha: 0.38 },
        );
        graphics.circle(point, radius, {
          fill: graphics.palette.secondary,
          stroke: graphics.palette.foreground,
          strokeWidth: 0.7,
          alpha: 0.25,
        });
      }
    }
  }
};

const drawTrails = (graphics: Graphics, viewport: Viewport, state: State, camera: Vector2): void => {
  // Include the live aircraft position as the newest ground point so the line
  // grows smoothly every frame instead of jumping at the breadcrumb interval.
  const groundPoints = [
    ...state.groundTrail.map((point) => screenPoint(viewport, point, camera)),
    screenPoint(viewport, state.position, camera),
  ];
  const airPoints = [
    ...state.airTrail.map((point) => screenPoint(viewport, point.position, camera)),
    screenPoint(viewport, state.position, camera),
  ];

  drawPolyline(graphics, groundPoints, {
    color: graphics.palette.foreground,
    width: 2.5,
    alpha: 0.72,
  });
  drawPolyline(graphics, airPoints, {
    color: graphics.palette.accent,
    width: 2.2,
    alpha: 0.82,
    pattern: [7, 6],
  });
};

const drawTrailLegend = (graphics: Graphics, viewport: Viewport): void => {
  const anchor = viewport.point(0.45, 7.45);
  graphics.line(anchor, { x: anchor.x + 28, y: anchor.y }, {
    color: graphics.palette.foreground,
    width: 2.5,
    alpha: 0.82,
  });
  graphics.text({
    x: anchor.x + 35,
    y: anchor.y + 4,
    text: "ground history → GS",
    color: graphics.palette.foreground,
    size: 10.5,
    weight: 600,
  });
  const airStart = { x: anchor.x + 158, y: anchor.y };
  graphics.line(airStart, { x: airStart.x + 28, y: airStart.y }, {
    color: graphics.palette.accent,
    width: 2.2,
    alpha: 0.9,
    pattern: [7, 6],
  });
  graphics.text({
    x: airStart.x + 35,
    y: airStart.y + 4,
    text: "air history → TAS",
    color: graphics.palette.accent,
    size: 10.5,
    weight: 600,
  });
};

const drawGustAreas = (
  graphics: Graphics,
  viewport: Viewport,
  camera: Vector2,
  currentParameters: ParameterValues,
  elapsedTime: number,
  baseWind: Vector2,
): void => {
  const gustMode = asGustMode(currentParameters.gustMode);
  if (gustMode === "off" || currentParameters.gustStrength <= 0) return;

  const axis = headingVector(currentParameters.commandCourse);
  const across = { x: axis.y, y: -axis.x };
  const translation = scale(baseWind, elapsedTime * POSITION_SCALE);
  const cameraInAir = subtract(subtract(camera, INITIAL_POSITION), translation);
  const cameraCoordinate = cameraInAir.x * axis.x + cameraInAir.y * axis.y;
  const centerIndex = Math.round(
    (cameraCoordinate - DEFAULT_GUST_FIRST_OFFSET) / DEFAULT_GUST_SPACING,
  );
  const acrossExtent = 30;
  const context = graphics.rawContext as CanvasRenderingContext2D;

  context.save();
  for (let index = centerIndex - 1; index <= centerIndex + 1; index += 1) {
    const coordinate = DEFAULT_GUST_FIRST_OFFSET + index * DEFAULT_GUST_SPACING;
    const center = add(add(INITIAL_POSITION, translation), scale(axis, coordinate));
    const corners = [
      add(add(center, scale(axis, -DEFAULT_GUST_HALF_WIDTH)), scale(across, -acrossExtent)),
      add(add(center, scale(axis, DEFAULT_GUST_HALF_WIDTH)), scale(across, -acrossExtent)),
      add(add(center, scale(axis, DEFAULT_GUST_HALF_WIDTH)), scale(across, acrossExtent)),
      add(add(center, scale(axis, -DEFAULT_GUST_HALF_WIDTH)), scale(across, acrossExtent)),
    ].map((point) => screenPoint(viewport, point, camera));

    context.beginPath();
    context.moveTo(corners[0].x, corners[0].y);
    for (let cornerIndex = 1; cornerIndex < corners.length; cornerIndex += 1) {
      context.lineTo(corners[cornerIndex].x, corners[cornerIndex].y);
    }
    context.closePath();
    context.fillStyle = graphics.palette.danger;
    context.globalAlpha = 0.11;
    context.fill();
    context.strokeStyle = graphics.palette.danger;
    context.lineWidth = 1.15;
    context.globalAlpha = 0.34;
    context.stroke();
  }
  context.restore();
};

const drawParticles = (
  graphics: Graphics,
  viewport: Viewport,
  state: State,
  camera: Vector2,
  currentParameters: ParameterValues,
): void => {
  const referenceFrame = asReferenceFrame(currentParameters.referenceFrame);

  for (const particle of state.particles) {
    const windSample = currentWind(currentParameters, particle.position, state.elapsedTime);
    const point = screenPoint(viewport, particle.position, camera);

    // The tail shows the particle's actual apparent motion in the selected
    // reference frame. In ground view this is local wind; in aircraft view it
    // is the air parcel's motion relative to the aircraft.
    const apparentVelocity = referenceFrame === "aircraft"
      ? subtract(windSample.localWind, state.groundVelocity)
      : windSample.localWind;
    const apparentSpeed = magnitude(apparentVelocity);
    const direction = normalize(screenVector(apparentVelocity, 1), { x: 1, y: 0 });
    const tailLength = clamp(apparentSpeed * 0.45, 4, 42);
    const circleRadius = 1.8 + particle.size * 0.42;
    const gustEmphasis = windSample.gustEnvelope * 0.16;
    const tailStart = {
      x: point.x - direction.x * tailLength,
      y: point.y - direction.y * tailLength,
    };

    const particleColor = windSample.gustEnvelope > 0.01
      ? graphics.palette.danger
      : graphics.palette.accent;

    if (apparentSpeed > 0.35) {
      graphics.line(tailStart, point, {
        color: particleColor,
        width: Math.max(1.3, particle.size * 0.62),
        alpha: 0.34 + gustEmphasis,
      });
    }

    graphics.circle(point, circleRadius, {
      fill: particleColor,
      stroke: graphics.palette.background,
      strokeWidth: 0.55,
      alpha: 0.72 + gustEmphasis,
    });
  }
};
const drawGlider = (
  graphics: Graphics,
  aircraftPoint: { x: number; y: number },
  headingDegrees: number,
): void => {
  const context = graphics.rawContext as CanvasRenderingContext2D;
  context.save();
  context.translate(aircraftPoint.x, aircraftPoint.y);
  context.rotate((headingDegrees * Math.PI) / 180);
  context.scale(GLIDER_SCALE, GLIDER_SCALE);
  context.lineCap = "round";
  context.lineJoin = "round";

  const strokeScale = 1 / GLIDER_SCALE;

  // Long, narrow, tapered sailplane wings.
  context.fillStyle = graphics.palette.accent;
  context.strokeStyle = graphics.palette.foreground;
  context.globalAlpha = 0.5;
  context.lineWidth = 1.55 * strokeScale;
  context.beginPath();
  context.moveTo(-30.5, -1.4);
  context.bezierCurveTo(-24, -2.5, -13, -4.3, -4.2, -3.6);
  context.bezierCurveTo(-2.2, -3.45, -1.1, -3.15, 0, -2.85);
  context.bezierCurveTo(1.1, -3.15, 2.2, -3.45, 4.2, -3.6);
  context.bezierCurveTo(13, -4.3, 24, -2.5, 30.5, -1.4);
  context.bezierCurveTo(31.2, -0.8, 31.1, 0.25, 30.1, 0.8);
  context.bezierCurveTo(21, 1.8, 12.2, 3.1, 4.6, 3.2);
  context.bezierCurveTo(2.5, 3.2, 1.2, 2.75, 0, 2.25);
  context.bezierCurveTo(-1.2, 2.75, -2.5, 3.2, -4.6, 3.2);
  context.bezierCurveTo(-12.2, 3.1, -21, 1.8, -30.1, 0.8);
  context.bezierCurveTo(-31.1, 0.25, -31.2, -0.8, -30.5, -1.4);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.96;
  context.stroke();

  // Slender fuselage with a rounded nose and narrow tail boom.
  context.fillStyle = graphics.palette.background;
  context.strokeStyle = graphics.palette.foreground;
  context.lineWidth = 1.8 * strokeScale;
  context.beginPath();
  context.moveTo(0, -19);
  context.bezierCurveTo(2.6, -17.2, 3.15, -12.2, 2.8, -6.2);
  context.bezierCurveTo(2.55, -1.5, 2.15, 5.8, 1.35, 12.7);
  context.bezierCurveTo(1.05, 15.4, 0.55, 17.1, 0, 17.8);
  context.bezierCurveTo(-0.55, 17.1, -1.05, 15.4, -1.35, 12.7);
  context.bezierCurveTo(-2.15, 5.8, -2.55, -1.5, -2.8, -6.2);
  context.bezierCurveTo(-3.15, -12.2, -2.6, -17.2, 0, -19);
  context.closePath();
  context.fill();
  context.stroke();

  // Bubble canopy.
  context.fillStyle = graphics.palette.secondary;
  context.strokeStyle = graphics.palette.foreground;
  context.globalAlpha = 0.72;
  context.lineWidth = 1.1 * strokeScale;
  context.beginPath();
  context.ellipse(0, -10.2, 1.65, 4.6, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Narrow tailplane and vertical-fin cue.
  context.fillStyle = graphics.palette.accent;
  context.globalAlpha = 0.48;
  context.beginPath();
  context.moveTo(-10.2, 13.2);
  context.lineTo(-1.15, 11.4);
  context.lineTo(0, 12.1);
  context.lineTo(1.15, 11.4);
  context.lineTo(10.2, 13.2);
  context.lineTo(1.25, 14.5);
  context.lineTo(0, 14.1);
  context.lineTo(-1.25, 14.5);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.96;
  context.stroke();

  context.fillStyle = graphics.palette.foreground;
  context.globalAlpha = 0.88;
  context.beginPath();
  context.moveTo(0, 9.3);
  context.lineTo(1.05, 15.4);
  context.lineTo(0, 14.1);
  context.lineTo(-1.05, 15.4);
  context.closePath();
  context.fill();

  // Nose cue and center seam make heading obvious without looking like a propeller aircraft.
  context.strokeStyle = graphics.palette.foreground;
  context.globalAlpha = 0.68;
  context.lineWidth = 0.9 * strokeScale;
  context.beginPath();
  context.moveTo(0, -18.2);
  context.lineTo(0, 16.1);
  context.stroke();
  context.fillStyle = graphics.palette.foreground;
  context.globalAlpha = 0.95;
  context.beginPath();
  context.arc(0, -18.1, 0.9, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

interface BadgeRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlapArea = (a: BadgeRect, b: BadgeRect): number => {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
};

const drawVectorBadge = (
  graphics: Graphics,
  candidates: Array<{ x: number; y: number }>,
  text: string,
  color: string,
  occupied: BadgeRect[],
): BadgeRect => {
  const width = Math.max(46, text.length * 6.15 + 12);
  const height = 20;
  const makePlacement = (candidate: { x: number; y: number }) => {
    const point = {
      x: clamp(candidate.x, width / 2 + 5, graphics.width - width / 2 - 5),
      y: clamp(candidate.y, height / 2 + 4, graphics.height - height / 2 - 4),
    };
    const rect: BadgeRect = {
      left: point.x - width / 2 - 3,
      right: point.x + width / 2 + 3,
      top: point.y - height / 2 - 3,
      bottom: point.y + height / 2 + 3,
    };
    const score = occupied.reduce((total, item) => total + overlapArea(rect, item), 0);
    return { point, rect, score };
  };

  const placements = candidates.map(makePlacement);
  const placement = placements.find((item) => item.score === 0)
    ?? placements.reduce((best, item) => item.score < best.score ? item : best);

  graphics.rectangle(placement.point.x - width / 2, placement.point.y - height / 2, width, height, {
    fill: graphics.palette.background,
    alpha: 0.9,
  });
  graphics.text({
    x: placement.point.x,
    y: placement.point.y + 4,
    text,
    color,
    size: 10.5,
    weight: 700,
    align: "center",
  });
  occupied.push(placement.rect);
  return placement.rect;
};

const addScreen = (
  point: { x: number; y: number },
  direction: Vector2,
  distance: number,
): { x: number; y: number } => ({
  x: point.x + direction.x * distance,
  y: point.y + direction.y * distance,
});

const drawConnectedVelocityVectors = (
  graphics: Graphics,
  origin: { x: number; y: number },
  airVelocity: Vector2,
  windVelocity: Vector2,
  groundVelocity: Vector2,
): void => {
  const maximumSpeed = Math.max(
    1,
    magnitude(airVelocity),
    magnitude(windVelocity),
    magnitude(groundVelocity),
  );
  const tasUnit = screenVector(airVelocity, 1);
  const gsUnit = screenVector(groundVelocity, 1);
  const margin = 14;
  const scaleLimitFor = (screen: Vector2): number => {
    const limits = [Number.POSITIVE_INFINITY];
    if (screen.x > 0) limits.push((graphics.width - margin - origin.x) / screen.x);
    if (screen.x < 0) limits.push((origin.x - margin) / -screen.x);
    if (screen.y > 0) limits.push((graphics.height - margin - origin.y) / screen.y);
    if (screen.y < 0) limits.push((origin.y - margin) / -screen.y);
    return Math.max(0.1, Math.min(...limits));
  };
  const fittedScale = Math.min(
    VECTOR_PIXEL_SCALE,
    235 / maximumSpeed,
    scaleLimitFor(tasUnit),
    scaleLimitFor(gsUnit),
  );
  const tasScreen = scale(tasUnit, fittedScale);
  const gsScreen = scale(gsUnit, fittedScale);
  const tasTip = { x: origin.x + tasScreen.x, y: origin.y + tasScreen.y };
  const gsTip = { x: origin.x + gsScreen.x, y: origin.y + gsScreen.y };

  graphics.arrow(origin, gsTip, {
    color: graphics.palette.foreground,
    width: 2.7,
    alpha: 0.9,
    headSize: 9,
  });
  graphics.arrow(origin, tasTip, {
    color: graphics.palette.accent,
    width: 2.7,
    alpha: 0.96,
    headSize: 9,
    pattern: [7, 5],
  });
  graphics.arrow(tasTip, gsTip, {
    color: graphics.palette.secondary,
    width: 2.7,
    alpha: 0.96,
    headSize: 9,
  });

  const tasDirection = normalize({ x: tasTip.x - origin.x, y: tasTip.y - origin.y }, { x: 1, y: 0 });
  const gsDirection = normalize({ x: gsTip.x - origin.x, y: gsTip.y - origin.y }, tasDirection);
  const commonDirection = normalize(add(tasDirection, gsDirection), tasDirection);
  const commonNormal = { x: -commonDirection.y, y: commonDirection.x };
  const wsDirection = normalize({ x: gsTip.x - tasTip.x, y: gsTip.y - tasTip.y }, commonNormal);
  const wsNormal = { x: -wsDirection.y, y: wsDirection.x };
  const wsMidpoint = { x: (tasTip.x + gsTip.x) / 2, y: (tasTip.y + gsTip.y) / 2 };
  const occupied: BadgeRect[] = [{
    left: origin.x - 108,
    right: origin.x + 108,
    top: origin.y - 66,
    bottom: origin.y + 66,
  }];

  drawVectorBadge(
    graphics,
    [
      addScreen(addScreen(tasTip, tasDirection, 24), commonNormal, 34),
      addScreen(addScreen(tasTip, tasDirection, 24), commonNormal, -34),
      addScreen(tasTip, commonNormal, 54),
      addScreen(tasTip, commonNormal, -54),
    ],
    `TAS ${magnitude(airVelocity).toFixed(0)}`,
    graphics.palette.accent,
    occupied,
  );
  drawVectorBadge(
    graphics,
    [
      addScreen(addScreen(gsTip, gsDirection, 24), commonNormal, -34),
      addScreen(addScreen(gsTip, gsDirection, 24), commonNormal, 34),
      addScreen(gsTip, commonNormal, -54),
      addScreen(gsTip, commonNormal, 54),
    ],
    `GS ${magnitude(groundVelocity).toFixed(0)}`,
    graphics.palette.foreground,
    occupied,
  );
  drawVectorBadge(
    graphics,
    [
      addScreen(wsMidpoint, wsNormal, 32),
      addScreen(wsMidpoint, wsNormal, -32),
      addScreen(wsMidpoint, commonDirection, 54),
      addScreen(wsMidpoint, commonDirection, -54),
    ],
    `WS ${magnitude(windVelocity).toFixed(0)}`,
    graphics.palette.secondary,
    occupied,
  );
};
const drawPilotCorrection = (
  graphics: Graphics,
  aircraftPoint: { x: number; y: number },
  state: State,
  currentParameters: ParameterValues,
): void => {
  const mode = asControlMode(currentParameters.controlMode);
  const turnError = state.pilotHeadingErrorDegrees;
  const speedError = state.pilotSpeedError;
  const isActive = mode !== "free" &&
    (Math.abs(turnError) > 0.8 || Math.abs(speedError) > 0.8 || magnitude(state.acceleration) > 0.5);

  const panelWidth = Math.min(330, graphics.width - 24);
  const panelHeight = 38;
  const compactLayout = graphics.width < 820;
  const panelX = compactLayout ? 12 : graphics.width - panelWidth - 12;
  const panelY = compactLayout
    ? graphics.height - 182
    : graphics.height - panelHeight - 12;
  const panelColor = isActive ? graphics.palette.danger : graphics.palette.muted;
  let status = "PILOT INPUT: steady hold — no changing correction";

  if (mode === "free") {
    status = "PILOT INPUT: hands off — trimmed TAS model";
  } else if (isActive) {
    const parts: string[] = [];
    if (Math.abs(turnError) > 0.8) {
      parts.push(`turn ${turnError > 0 ? "right" : "left"} ${Math.abs(turnError).toFixed(0)}°`);
    }
    if (Math.abs(speedError) > 0.8) {
      parts.push(`${speedError > 0 ? "regain" : "reduce"} ${Math.abs(speedError).toFixed(0)} kt TAS`);
    }
    status = `PILOT INPUT: ${parts.length > 0 ? parts.join(" • ") : "correcting"}`;
  }

  graphics.rectangle(panelX, panelY, panelWidth, panelHeight, {
    fill: graphics.palette.background,
    ...(isActive ? { stroke: graphics.palette.danger, strokeWidth: 1.6 } : {}),
    alpha: 0.9,
  });
  graphics.text({
    x: panelX + 12,
    y: panelY + 24,
    text: status,
    color: panelColor,
    size: 10.5,
    weight: isActive ? 700 : 500,
  });

  if (!isActive || Math.abs(turnError) <= 0.8) return;

  const context = graphics.rawContext as CanvasRenderingContext2D;
  const turnRight = turnError > 0;
  const radius = 43;
  const startAngle = turnRight ? -2.5 : -0.65;
  const endAngle = turnRight ? -0.65 : -2.5;
  context.save();
  context.strokeStyle = graphics.palette.danger;
  context.fillStyle = graphics.palette.danger;
  context.globalAlpha = 0.9;
  context.lineWidth = 2.5;
  context.beginPath();
  context.arc(aircraftPoint.x, aircraftPoint.y, radius, startAngle, endAngle, !turnRight);
  context.stroke();
  const tipAngle = endAngle;
  const tip = {
    x: aircraftPoint.x + Math.cos(tipAngle) * radius,
    y: aircraftPoint.y + Math.sin(tipAngle) * radius,
  };
  const tangentAngle = tipAngle + (turnRight ? Math.PI / 2 : -Math.PI / 2);
  context.beginPath();
  context.moveTo(tip.x, tip.y);
  context.lineTo(
    tip.x - Math.cos(tangentAngle - 0.55) * 9,
    tip.y - Math.sin(tangentAngle - 0.55) * 9,
  );
  context.lineTo(
    tip.x - Math.cos(tangentAngle + 0.55) * 9,
    tip.y - Math.sin(tangentAngle + 0.55) * 9,
  );
  context.closePath();
  context.fill();
  context.restore();
};

const drawVelocityTriangle = (
  graphics: Graphics,
  airVelocity: Vector2,
  windVelocity: Vector2,
  groundVelocity: Vector2,
): void => {
  const box = {
    x: graphics.width - 208,
    y: 12,
    width: 196,
    height: 132,
  };
  const plot = {
    x: box.x + 18,
    y: box.y + 31,
    width: box.width - 36,
    height: 72,
  };

  // Vector triangle points in mathematical screen coordinates. C and the GS
  // endpoint should coincide, but both are retained to make numerical drift harmless.
  const rawA = { x: 0, y: 0 };
  const rawB = screenVector(airVelocity, 1);
  const rawC = add(rawB, screenVector(windVelocity, 1));
  const rawG = screenVector(groundVelocity, 1);
  const rawPoints = [rawA, rawB, rawC, rawG];
  const minX = Math.min(...rawPoints.map((point) => point.x));
  const maxX = Math.max(...rawPoints.map((point) => point.x));
  const minY = Math.min(...rawPoints.map((point) => point.y));
  const maxY = Math.max(...rawPoints.map((point) => point.y));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const fitScale = Math.min(plot.width / spanX, plot.height / spanY, 1.2);
  const usedWidth = spanX * fitScale;
  const usedHeight = spanY * fitScale;
  const offsetX = plot.x + (plot.width - usedWidth) / 2 - minX * fitScale;
  const offsetY = plot.y + (plot.height - usedHeight) / 2 - minY * fitScale;
  const project = (point: Vector2): { x: number; y: number } => ({
    x: offsetX + point.x * fitScale,
    y: offsetY + point.y * fitScale,
  });

  const a = project(rawA);
  const b = project(rawB);
  const c = project(rawC);
  const groundEnd = project(rawG);

  graphics.rectangle(box.x, box.y, box.width, box.height, {
    fill: graphics.palette.background,
    alpha: 0.9,
  });
  graphics.text({
    x: box.x + 12,
    y: box.y + 18,
    text: "Velocity triangle",
    color: graphics.palette.foreground,
    size: 11,
    weight: 700,
  });

  graphics.arrow(a, b, {
    color: graphics.palette.accent,
    width: 2.2,
    headSize: 7,
    pattern: [7, 5],
  });
  graphics.arrow(b, c, {
    color: graphics.palette.secondary,
    width: 2.2,
    headSize: 7,
  });
  graphics.arrow(a, groundEnd, {
    color: graphics.palette.foreground,
    width: 2.2,
    headSize: 7,
  });

  const legendY = box.y + box.height - 13;
  graphics.text({ x: box.x + 18, y: legendY, text: "TAS", color: graphics.palette.accent, size: 10, weight: 700 });
  graphics.text({ x: box.x + 76, y: legendY, text: "WS", color: graphics.palette.secondary, size: 10, weight: 700 });
  graphics.text({ x: box.x + 132, y: legendY, text: "GS", color: graphics.palette.foreground, size: 10, weight: 700 });
};

const drawHud = (
  graphics: Graphics,
  currentParameters: ParameterValues,
  state: State,
  airVelocity: Vector2,
  localWind: Vector2,
  gustEnvelope: number,
  groundVelocity: Vector2,
): void => {
  const boxX = 16;
  const boxY = graphics.height - 132;
  const boxWidth = Math.min(420, graphics.width - 32);
  const origin = { x: boxX + 10, y: boxY + 20 };
  const tas = magnitude(airVelocity);
  const ws = magnitude(localWind);
  const gs = magnitude(groundVelocity);
  const track = vectorBearing(groundVelocity, state.bodyHeadingDegrees);
  const frame = asReferenceFrame(currentParameters.referenceFrame);
  const mode = asControlMode(currentParameters.controlMode);
  const gustMode = asGustMode(currentParameters.gustMode);
  const localWindFrom = vectorBearing(scale(localWind, -1), currentParameters.windFrom);
  const gustStatus = gustMode === "off"
    ? "off — steady wind only"
    : `${gustEffectLabel(gustMode)} • ${gustEnvelope > 0.03
      ? `active (${Math.round(gustEnvelope * 100)}% strength)`
      : "between gusts"}`;

  graphics.rectangle(boxX, boxY, boxWidth, 120, {
    fill: graphics.palette.background,
    alpha: 0.86,
  });
  graphics.text({
    x: origin.x,
    y: origin.y,
    text: `TAS ${tas.toFixed(1)} kt   WS ${ws.toFixed(1)} kt   GS ${gs.toFixed(1)} kt`,
    color: graphics.palette.foreground,
    size: 13,
    weight: 700,
  });
  graphics.text({
    x: origin.x,
    y: origin.y + 22,
    text: `Heading ${formatBearing(state.bodyHeadingDegrees)}   Track ${formatBearing(track)}`,
    color: graphics.palette.foreground,
    size: 11,
  });
  graphics.text({
    x: origin.x,
    y: origin.y + 42,
    text: `Local wind from ${formatBearing(localWindFrom)} • ${frame === "ground" ? "ground fixed" : "aircraft fixed"}`,
    color: graphics.palette.muted,
    size: 10.5,
  });
  graphics.text({
    x: origin.x,
    y: origin.y + 62,
    text: `Control: ${controlModeLabel(mode)}`,
    color: graphics.palette.muted,
    size: 10.5,
  });
  graphics.text({
    x: origin.x,
    y: origin.y + 82,
    text: `Gust: ${gustStatus}`,
    color: gustEnvelope > 0.03 ? graphics.palette.danger : graphics.palette.secondary,
    size: 10.5,
    weight: gustEnvelope > 0.03 ? 700 : 500,
  });
};

export default defineSimulation<typeof parameters, State>({
  id: "airspeed-wind-groundspeed",
  title: "Airspeed, wind, and groundspeed",
  description:
    "Explore TAS, wind speed, and groundspeed in ground- and aircraft-relative views, including simplified gust transients.",
  parameters,
  world: {
    xMin: 0,
    xMax: WORLD_WIDTH,
    yMin: 0,
    yMax: WORLD_HEIGHT,
    padding: 0,
  },
  create(currentParameters) {
    const heading = currentParameters.commandCourse;
    const baseWind = windVectorFromAviation(currentParameters.windSpeed, currentParameters.windFrom);
    const airVelocity = scale(headingVector(heading), currentParameters.targetTas);
    const groundVelocity = velocityIdentity(airVelocity, baseWind);
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) =>
      particleFromSeed(index + 1, INITIAL_POSITION),
    );

    return {
      position: { ...INITIAL_POSITION },
      groundVelocity,
      bodyHeadingDegrees: heading,
      acceleration: { x: 0, y: 0 },
      desiredAirVelocity: { ...airVelocity },
      pilotHeadingErrorDegrees: 0,
      pilotSpeedError: 0,
      elapsedTime: 0,
      groundCamera: { ...INITIAL_POSITION },
      groundCameraTarget: { ...INITIAL_POSITION },
      groundCameraPanning: false,
      particles,
      groundTrail: [{ ...INITIAL_POSITION }],
      airTrail: [{ position: { ...INITIAL_POSITION }, age: 0 }],
      trailAccumulator: 0,
      recycleCounter: PARTICLE_COUNT,
    };
  },
  update(state, currentParameters, deltaTime) {
    const dt = clamp(deltaTime, 0, 0.05);
    state.elapsedTime += dt;

    const windAtAircraft = currentWind(currentParameters, state.position, state.elapsedTime);
    const dynamics = stepAircraftDynamics({
      groundVelocity: state.groundVelocity,
      localWind: windAtAircraft.localWind,
      targetTas: currentParameters.targetTas,
      commandDegrees: currentParameters.commandCourse,
      bodyHeadingDegrees: state.bodyHeadingDegrees,
      controlMode: asControlMode(currentParameters.controlMode),
      deltaTime: dt,
    });

    state.groundVelocity = dynamics.groundVelocity;
    state.bodyHeadingDegrees = dynamics.bodyHeadingDegrees;
    state.acceleration = dynamics.acceleration;
    state.desiredAirVelocity = dynamics.desiredAirVelocity;
    state.pilotHeadingErrorDegrees = shortestAngleDifference(
      state.bodyHeadingDegrees,
      vectorBearing(dynamics.desiredAirVelocity, state.bodyHeadingDegrees),
    );
    state.pilotSpeedError = magnitude(dynamics.desiredAirVelocity) - magnitude(dynamics.airVelocity);
    state.position = add(state.position, scale(state.groundVelocity, dt * POSITION_SCALE));
    const cameraUpdate = updateGroundCamera(
      state.groundCamera,
      state.groundCameraTarget,
      state.groundCameraPanning,
      state.position,
      state.groundVelocity,
      dt,
    );
    state.groundCamera = cameraUpdate.camera;
    state.groundCameraTarget = cameraUpdate.target;
    state.groundCameraPanning = cameraUpdate.panning;

    for (const particle of state.particles) {
      const localWind = currentWind(currentParameters, particle.position, state.elapsedTime).localWind;
      particle.position = add(particle.position, scale(localWind, dt * POSITION_SCALE));
      if (magnitude(subtract(particle.position, state.position)) > PARTICLE_RADIUS * 1.25) {
        recycleParticle(state, particle);
      }
    }

    for (const marker of state.airTrail) {
      const localWind = currentWind(currentParameters, marker.position, state.elapsedTime).localWind;
      marker.position = add(marker.position, scale(localWind, dt * POSITION_SCALE));
      marker.age += dt;
    }
    while (state.airTrail.length > 0 && state.airTrail[0].age > AIR_TRAIL_MAX_AGE_SECONDS) {
      state.airTrail.shift();
    }

    state.trailAccumulator += dt;
    if (state.trailAccumulator >= TRAIL_INTERVAL_SECONDS) {
      state.trailAccumulator %= TRAIL_INTERVAL_SECONDS;
      state.groundTrail.push({ ...state.position });
      state.airTrail.push({ position: { ...state.position }, age: 0 });
      keepLast(state.groundTrail, MAX_TRAIL_POINTS);
      keepLast(state.airTrail, MAX_TRAIL_POINTS);
    }

    if (!finiteVector(state.position) || !finiteVector(state.groundVelocity)) {
      state.position = { ...INITIAL_POSITION };
      state.groundVelocity = velocityIdentity(
        scale(headingVector(currentParameters.commandCourse), currentParameters.targetTas),
        windVectorFromAviation(currentParameters.windSpeed, currentParameters.windFrom),
      );
      state.groundCamera = { ...INITIAL_POSITION };
      state.groundCameraTarget = { ...INITIAL_POSITION };
      state.groundCameraPanning = false;
      state.desiredAirVelocity = scale(
        headingVector(currentParameters.commandCourse),
        currentParameters.targetTas,
      );
      state.pilotHeadingErrorDegrees = 0;
      state.pilotSpeedError = 0;
    }
  },
  draw({ graphics, viewport, state, parameters: currentParameters }) {
    graphics.clear();

    const referenceFrame = asReferenceFrame(currentParameters.referenceFrame);
    const camera = referenceFrame === "aircraft" ? state.position : state.groundCamera;
    const windAtAircraft = currentWind(currentParameters, state.position, state.elapsedTime);
    const airVelocity = subtract(state.groundVelocity, windAtAircraft.localWind);
    const aircraftPoint = screenPoint(viewport, state.position, camera);

    drawScenery(graphics, viewport, camera);
    drawGustAreas(
      graphics,
      viewport,
      camera,
      currentParameters,
      state.elapsedTime,
      windAtAircraft.baseWind,
    );
    if (currentParameters.showTrails) {
      drawTrails(graphics, viewport, state, camera);
      drawTrailLegend(graphics, viewport);
    }
    if (currentParameters.showParticles) {
      drawParticles(graphics, viewport, state, camera, currentParameters);
    }

    drawGlider(graphics, aircraftPoint, state.bodyHeadingDegrees);

    if (currentParameters.showVectors) {
      drawConnectedVelocityVectors(
        graphics,
        aircraftPoint,
        airVelocity,
        windAtAircraft.localWind,
        state.groundVelocity,
      );
    }

    if (currentParameters.showPilotInput) {
      drawPilotCorrection(graphics, aircraftPoint, state, currentParameters);
    }

    if (currentParameters.showTriangle) {
      drawVelocityTriangle(
        graphics,
        airVelocity,
        windAtAircraft.localWind,
        state.groundVelocity,
      );
    }

    drawHud(
      graphics,
      currentParameters,
      state,
      airVelocity,
      windAtAircraft.localWind,
      windAtAircraft.gustEnvelope,
      state.groundVelocity,
    );

    if (referenceFrame === "ground" && state.groundCameraPanning) {
      const cameraStatus = viewport.point(7, 7.45);
      graphics.text({
        x: cameraStatus.x,
        y: cameraStatus.y,
        text: "Ground camera repositioning",
        color: graphics.palette.muted,
        size: 10.5,
        weight: 600,
        align: "center",
      });
    }


  },
});
