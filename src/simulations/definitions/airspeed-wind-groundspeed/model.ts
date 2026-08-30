/**
 * Pure math and simplified 2-D aircraft-response helpers for the
 * airspeed / wind / groundspeed teaching simulation.
 *
 * Coordinate convention:
 *   +x = east, +y = north
 *   headings/bearings are aviation degrees (0 = north, 90 = east)
 *   speeds are knots
 */

export interface Vector2 {
  x: number;
  y: number;
}

export type ControlMode = "free" | "heading-hold" | "track-hold";
export type GustMode =
  | "off"
  | "headwind"
  | "tailwind"
  | "crosswind-left"
  | "crosswind-right";

export interface GustFieldInput {
  mode: GustMode;
  strength: number;
  position: Vector2;
  elapsedTime: number;
  baseWind: Vector2;
  courseDegrees: number;
  origin: Vector2;
  firstBandOffset?: number;
  bandSpacing?: number;
  bandHalfWidth?: number;
  bandCoreHalfWidth?: number;
}

export interface GustFieldSample {
  vector: Vector2;
  envelope: number;
  signedDistance: number;
  bandCenterCoordinate: number;
  axis: Vector2;
}

export interface DynamicsInput {
  groundVelocity: Vector2;
  localWind: Vector2;
  targetTas: number;
  commandDegrees: number;
  bodyHeadingDegrees: number;
  controlMode: ControlMode;
  deltaTime: number;
  responseTimeSeconds?: number;
  maxAccelerationKnotsPerSecond?: number;
  maxTurnRateDegreesPerSecond?: number;
}

export interface DynamicsOutput {
  groundVelocity: Vector2;
  airVelocity: Vector2;
  desiredAirVelocity: Vector2;
  acceleration: Vector2;
  bodyHeadingDegrees: number;
}

export const POSITION_SCALE = 0.012;
export const DEFAULT_GUST_FIRST_OFFSET = 8;
export const DEFAULT_GUST_SPACING = 30;
// A compact gust cell with a brief full-strength core and smooth edges.
export const DEFAULT_GUST_HALF_WIDTH = 2.4;
export const DEFAULT_GUST_CORE_HALF_WIDTH = 0.9;

export const vector = (x = 0, y = 0): Vector2 => ({ x, y });

export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const scale = (value: Vector2, scalar: number): Vector2 => ({
  x: value.x * scalar,
  y: value.y * scalar,
});

export const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

export const magnitudeSquared = (value: Vector2): number => dot(value, value);

export const magnitude = (value: Vector2): number => Math.sqrt(magnitudeSquared(value));

export const normalize = (value: Vector2, fallback: Vector2 = { x: 0, y: 1 }): Vector2 => {
  const length = magnitude(value);
  if (length < 1e-9) {
    return { ...fallback };
  }
  return scale(value, 1 / length);
};

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const clampMagnitude = (value: Vector2, maximum: number): Vector2 => {
  const length = magnitude(value);
  if (length <= maximum || length < 1e-9) {
    return value;
  }
  return scale(value, maximum / length);
};

export const wrapDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360;

export const shortestAngleDifference = (fromDegrees: number, toDegrees: number): number => {
  const difference = wrapDegrees(toDegrees) - wrapDegrees(fromDegrees);
  return ((difference + 540) % 360) - 180;
};

export const moveAngleToward = (
  currentDegrees: number,
  targetDegrees: number,
  maximumDeltaDegrees: number,
): number => {
  const difference = shortestAngleDifference(currentDegrees, targetDegrees);
  return wrapDegrees(currentDegrees + clamp(difference, -maximumDeltaDegrees, maximumDeltaDegrees));
};

/** Unit vector pointing toward an aviation heading. */
export const headingVector = (degrees: number): Vector2 => {
  const radians = (wrapDegrees(degrees) * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: Math.cos(radians),
  };
};

/** Aviation bearing of a vector, 0° north and increasing clockwise. */
export const vectorBearing = (value: Vector2, fallbackDegrees = 0): number => {
  if (magnitudeSquared(value) < 1e-12) {
    return wrapDegrees(fallbackDegrees);
  }
  return wrapDegrees((Math.atan2(value.x, value.y) * 180) / Math.PI);
};

/**
 * Meteorological/aviation winds are named for the direction they come FROM.
 * This returns the velocity vector of the air, which points TO the opposite direction.
 */
export const windVectorFromAviation = (speed: number, windFromDegrees: number): Vector2 =>
  scale(headingVector(windFromDegrees + 180), Math.max(0, speed));

export const velocityIdentity = (airVelocity: Vector2, windVelocity: Vector2): Vector2 =>
  add(airVelocity, windVelocity);

const rightPerpendicular = (value: Vector2): Vector2 => ({ x: value.y, y: -value.x });

/**
 * Computes the air-relative velocity required to fly a chosen ground track.
 * If the crosswind exceeds TAS, the result saturates to a near-90° crab angle.
 */
export const trackHoldAirVelocity = (
  targetTas: number,
  trackDegrees: number,
  localWind: Vector2,
): Vector2 => {
  const tas = Math.max(0, targetTas);
  const along = headingVector(trackDegrees);
  const right = rightPerpendicular(along);
  const windAcrossTrack = dot(localWind, right);
  const airAcrossTrack = clamp(-windAcrossTrack, -tas * 0.999, tas * 0.999);
  const airAlongTrack = Math.sqrt(Math.max(0, tas * tas - airAcrossTrack * airAcrossTrack));

  return add(scale(along, airAlongTrack), scale(right, airAcrossTrack));
};

export const desiredAirVelocityForMode = (
  controlMode: ControlMode,
  targetTas: number,
  commandDegrees: number,
  bodyHeadingDegrees: number,
  currentAirVelocity: Vector2,
  localWind: Vector2,
): Vector2 => {
  if (controlMode === "track-hold") {
    return trackHoldAirVelocity(targetTas, commandDegrees, localWind);
  }

  if (controlMode === "heading-hold") {
    return scale(headingVector(commandDegrees), Math.max(0, targetTas));
  }

  // "Free response" is still a deliberately stable educational model: the
  // aircraft trims toward the selected TAS but initially keeps its present nose direction.
  const fallbackHeading = vectorBearing(currentAirVelocity, bodyHeadingDegrees);
  return scale(headingVector(fallbackHeading), Math.max(0, targetTas));
};

const gustDirection = (mode: GustMode, courseDegrees: number): Vector2 => {
  switch (mode) {
    case "headwind":
      return headingVector(courseDegrees + 180);
    case "tailwind":
      return headingVector(courseDegrees);
    case "crosswind-left":
      // Wind acting from the aircraft's left, therefore moving toward its right.
      return headingVector(courseDegrees + 90);
    case "crosswind-right":
      return headingVector(courseDegrees - 90);
    case "off":
    default:
      return vector();
  }
};

/**
 * Samples a repeating set of smooth gust fronts embedded in the moving air mass.
 * The fronts translate with the base wind, so an aircraft encounters them by flying
 * through the air rather than because they are painted onto the ground.
 */
export const sampleGustField = ({
  mode,
  strength,
  position,
  elapsedTime,
  baseWind,
  courseDegrees,
  origin,
  firstBandOffset = DEFAULT_GUST_FIRST_OFFSET,
  bandSpacing = DEFAULT_GUST_SPACING,
  bandHalfWidth = DEFAULT_GUST_HALF_WIDTH,
  bandCoreHalfWidth = DEFAULT_GUST_CORE_HALF_WIDTH,
}: GustFieldInput): GustFieldSample => {
  const axis = headingVector(courseDegrees);
  if (mode === "off" || strength <= 0 || bandSpacing <= 0 || bandHalfWidth <= 0) {
    return {
      vector: vector(),
      envelope: 0,
      signedDistance: Number.POSITIVE_INFINITY,
      bandCenterCoordinate: firstBandOffset,
      axis,
    };
  }

  // Remove the air mass's ground translation. In this air-relative coordinate
  // system, gust fronts remain stationary and repeat along the commanded course.
  const airMassTranslation = scale(baseWind, elapsedTime * POSITION_SCALE);
  const airRelativePosition = subtract(subtract(position, origin), airMassTranslation);
  const longitudinalCoordinate = dot(airRelativePosition, axis);
  const nearestBandIndex = Math.round((longitudinalCoordinate - firstBandOffset) / bandSpacing);
  const bandCenterCoordinate = firstBandOffset + nearestBandIndex * bandSpacing;
  const signedDistance = longitudinalCoordinate - bandCenterCoordinate;
  const absoluteDistance = Math.abs(signedDistance);

  if (absoluteDistance >= bandHalfWidth) {
    return {
      vector: vector(),
      envelope: 0,
      signedDistance,
      bandCenterCoordinate,
      axis,
    };
  }

  // Smooth-edged top-hat gust: the short center section reaches full strength,
  // while cosine transitions prevent an unrealistic instantaneous wind jump.
  const coreHalfWidth = clamp(bandCoreHalfWidth, 0, bandHalfWidth);
  let envelope = 1;
  if (absoluteDistance > coreHalfWidth) {
    const transitionWidth = Math.max(1e-9, bandHalfWidth - coreHalfWidth);
    const transitionProgress = clamp(
      (absoluteDistance - coreHalfWidth) / transitionWidth,
      0,
      1,
    );
    envelope = 0.5 * (1 + Math.cos(Math.PI * transitionProgress));
  }
  return {
    vector: scale(gustDirection(mode, courseDegrees), strength * envelope),
    envelope,
    signedDistance,
    bandCenterCoordinate,
    axis,
  };
};

export const localWindAt = (
  baseWind: Vector2,
  gustInput: Omit<GustFieldInput, "baseWind">,
): { localWind: Vector2; gust: GustFieldSample } => {
  const gust = sampleGustField({ ...gustInput, baseWind });
  return {
    localWind: add(baseWind, gust.vector),
    gust,
  };
};

/** One semi-implicit Euler step of the intentionally simplified response model. */
export const stepAircraftDynamics = ({
  groundVelocity,
  localWind,
  targetTas,
  commandDegrees,
  bodyHeadingDegrees,
  controlMode,
  deltaTime,
  responseTimeSeconds = controlMode === "free" ? 4.5 : 2.4,
  maxAccelerationKnotsPerSecond = 18,
  maxTurnRateDegreesPerSecond = controlMode === "free" ? 16 : 32,
}: DynamicsInput): DynamicsOutput => {
  const dt = clamp(deltaTime, 0, 0.05);
  const currentAirVelocity = subtract(groundVelocity, localWind);
  const desiredAirVelocity = desiredAirVelocityForMode(
    controlMode,
    targetTas,
    commandDegrees,
    bodyHeadingDegrees,
    currentAirVelocity,
    localWind,
  );

  const rawAcceleration = scale(
    subtract(desiredAirVelocity, currentAirVelocity),
    1 / Math.max(0.1, responseTimeSeconds),
  );
  const acceleration = clampMagnitude(rawAcceleration, Math.max(0, maxAccelerationKnotsPerSecond));
  const nextGroundVelocity = add(groundVelocity, scale(acceleration, dt));
  const nextAirVelocity = subtract(nextGroundVelocity, localWind);

  const targetBodyHeading =
    controlMode === "heading-hold"
      ? commandDegrees
      : vectorBearing(desiredAirVelocity, bodyHeadingDegrees);
  const nextBodyHeading = moveAngleToward(
    bodyHeadingDegrees,
    targetBodyHeading,
    Math.max(0, maxTurnRateDegreesPerSecond) * dt,
  );

  return {
    groundVelocity: nextGroundVelocity,
    airVelocity: nextAirVelocity,
    desiredAirVelocity,
    acceleration,
    bodyHeadingDegrees: nextBodyHeading,
  };
};

export const finiteVector = (value: Vector2): boolean =>
  Number.isFinite(value.x) && Number.isFinite(value.y);
