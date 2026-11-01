/** Navigation on a spherical Earth (mean radius 6,371.0088 km). */
export interface GeoPoint { lat: number; lon: number }
export type Vec3 = [number, number, number];
export type RouteKind = "greatCircle" | "rhumb";
export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;
export const EARTH_RADIUS_NM = 6371.0088 / 1.852;
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const wrapLon = (longitude: number) => ((longitude + 180) % 360 + 360) % 360 - 180;
export const deltaLongitude = (a: number, b: number) => wrapLon(b - a);
export const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
export const multiply = (a: Vec3, s: number): Vec3 => [a[0]*s, a[1]*s, a[2]*s];
export const cross = (a: Vec3, b: Vec3): Vec3 =>
    [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export function unit(a: Vec3): Vec3 {
    const len = Math.hypot(...a);
    return len < 1e-12 ? [0, 0, 0] : multiply(a, 1 / len);
}
export function toVector(p: GeoPoint): Vec3 {
    const lat = p.lat * RAD, lon = p.lon * RAD;
    return [Math.cos(lat)*Math.sin(lon), Math.sin(lat), Math.cos(lat)*Math.cos(lon)];
}
export function fromVector(v: Vec3): GeoPoint {
    return {lat: Math.asin(clamp(v[1], -1, 1))*DEG, lon: wrapLon(Math.atan2(v[0], v[2])*DEG)};
}
export function localFrame(p: GeoPoint) {
    const lat = p.lat*RAD, lon = p.lon*RAD;
    const east: Vec3 = [Math.cos(lon), 0, -Math.sin(lon)];
    const north: Vec3 = [-Math.sin(lat)*Math.sin(lon), Math.cos(lat), -Math.sin(lat)*Math.cos(lon)];
    return {east, north, up: toVector(p)};
}
export function mercatorY(lat: number) {
    const phi = clamp(lat, -85, 85)*RAD;
    return Math.log(Math.tan(Math.PI/4+phi/2));
}
export const inverseMercatorY = (psi: number) => (2*Math.atan(Math.exp(psi))-Math.PI/2)*DEG;
export function courseDegrees(vector: Vec3, p: GeoPoint) {
    const {east,north} = localFrame(p);
    return ((Math.atan2(dot(vector,east), dot(vector,north))*DEG)%360+360)%360;
}
export function initialRhumbBearing(a: GeoPoint,b: GeoPoint) {
    const dpsi=mercatorY(b.lat)-mercatorY(a.lat);
    return ((Math.atan2(deltaLongitude(a.lon,b.lon)*RAD,dpsi)*DEG)%360+360)%360;
}
export function rhumbDistanceNm(a:GeoPoint,b:GeoPoint) {
    const dphi=(b.lat-a.lat)*RAD, dpsi=mercatorY(b.lat)-mercatorY(a.lat);
    const q=Math.abs(dpsi)>1e-11?dphi/dpsi:Math.cos(a.lat*RAD);
    return Math.hypot(dphi,q*deltaLongitude(a.lon,b.lon)*RAD)*EARTH_RADIUS_NM;
}
export function greatCircleDistanceNm(a:GeoPoint,b:GeoPoint) {
    const va=toVector(a),vb=toVector(b);
    return Math.atan2(Math.hypot(...cross(va,vb)),dot(va,vb))*EARTH_RADIUS_NM;
}
export function rhumbPoint(a:GeoPoint,b:GeoPoint,t:number):GeoPoint {
    const psi=mercatorY(a.lat)+(mercatorY(b.lat)-mercatorY(a.lat))*t;
    return {lat: inverseMercatorY(psi),lon:wrapLon(a.lon+deltaLongitude(a.lon,b.lon)*t)};
}
export function greatCirclePlane(a:GeoPoint,b:GeoPoint) {
    const va=toVector(a), vb=toVector(b);
    const cosine=clamp(dot(va,vb),-1,1);
    const angle=Math.acos(cosine);
    let normal=unit(cross(va,vb));
    // A deterministic fallback for coincident/antipodal endpoints.
    if (Math.hypot(...normal)<0.5)
        normal=unit(cross(va,Math.abs(va[1])<0.9?[0,1,0]:[1,0,0]));
    const tangent=unit(cross(normal,va));
    return {va,normal,tangent,angle};
}
export function greatCirclePoint(a:GeoPoint,b:GeoPoint,t:number):GeoPoint {
    const p=greatCirclePlane(a,b);
    return fromVector(add(multiply(p.va,Math.cos(p.angle*t)),multiply(p.tangent,Math.sin(p.angle*t))));
}
export function pointOnRoute(kind:RouteKind,a:GeoPoint,b:GeoPoint,t:number):GeoPoint {
    return kind==="rhumb"?rhumbPoint(a,b,t):greatCirclePoint(a,b,t);
}
export function greatCircleBearing(a:GeoPoint,b:GeoPoint,t:number) {
    const plane=greatCirclePlane(a,b);
    const angle=plane.angle*t;
    const position=add(multiply(plane.va,Math.cos(angle)),multiply(plane.tangent,Math.sin(angle)));
    const tangent=unit(cross(plane.normal,position));
    return courseDegrees(tangent,fromVector(position));
}
export function routeBearing(kind:RouteKind,a:GeoPoint,b:GeoPoint,t:number) {
    return kind==="rhumb"?initialRhumbBearing(a,b):greatCircleBearing(a,b,t);
}
/** Acute angle between the route and the local meridian (longitude line), 0°–90°. */
export function meridianAngle(bearing:number) {
    const angle=bearing*RAD;
    return Math.atan2(Math.abs(Math.sin(angle)),Math.abs(Math.cos(angle)))*DEG;
}

export interface RouteSample { point:GeoPoint; t:number }

/** All 360° of the great circle containing both endpoints (not just the minor arc). */
export function completeGreatCircle(a:GeoPoint,b:GeoPoint,steps=720):RouteSample[] {
    const plane=greatCirclePlane(a,b);
    return Array.from({length:steps+1},(_,i)=>{
        const theta=i/steps*2*Math.PI;
        return {
            point:fromVector(add(multiply(plane.va,Math.cos(theta)),
                multiply(plane.tangent,Math.sin(theta)))),
            t:plane.angle>1e-9?theta/plane.angle:0,
        };
    });
}

/**
 * A loxodrome usually spirals toward the poles forever. The visual extension
 * stops at Mercator latitude ±6.3 (about ±89.79°) to avoid singular poles.
 * An east–west rhumb follows a complete parallel instead.
 */
export function extendedRhumbLine(a:GeoPoint,b:GeoPoint,psiLimit=6.3):RouteSample[] {
    const dpsi=mercatorY(b.lat)-mercatorY(a.lat);
    const dlon=deltaLongitude(a.lon,b.lon);
    if(Math.abs(dpsi)<1e-9){
        if(Math.abs(dlon)<1e-9)return [];
        // A due-east/west rhumb is the entire closed latitude circle.
        return Array.from({length:721},(_,i)=>{
            const t=(Math.sign(dlon)*360*i/720)/dlon;
            return {point:rhumbPoint(a,b,t),t};
        });
    }
    const psiA=mercatorY(a.lat), psiB=mercatorY(b.lat);
    let tMin=Math.min((-Math.abs(psiLimit)-psiA)/dpsi,
                      (Math.abs(psiLimit)-psiA)/dpsi);
    let tMax=Math.max((-Math.abs(psiLimit)-psiA)/dpsi,
                      (Math.abs(psiLimit)-psiA)/dpsi);
    // The mathematical loxodrome never ends. Limit the displayed continuation
    // to ONE full longitude revolution in total. Otherwise almost-east/west
    // cases (e.g. Cape Town–Sydney) draw hundreds of nearly overlapping loops.
    if(Math.abs(dlon)>1e-10){
        const fullTurn=Math.max(1,360/Math.abs(dlon));
        const center=0.5;
        tMin=Math.max(tMin,center-fullTurn/2);
        tMax=Math.min(tMax,center+fullTurn/2);
    }
    // Preserve the original A→B segment even in extreme cases.
    tMin=Math.min(tMin,0);
    tMax=Math.max(tMax,1);
    const steps=Math.max(160,Math.min(720,Math.ceil((tMax-tMin)*Math.abs(dlon)*2)));
    return Array.from({length:steps+1},(_,i)=>{
        const t=tMin+(tMax-tMin)*i/steps;
        return {point:rhumbPoint(a,b,t),t};
    });
}

/** True (undirected, acute) angle between a route tangent and the local parallel. */
export function parallelAngle(bearing:number) {
    const angle=bearing*RAD;
    return Math.atan2(Math.abs(Math.cos(angle)),Math.abs(Math.sin(angle)))*DEG;
}
/** Rhumb intersections with the meridians visible in a chosen graticule spacing. */
export function rhumbMeridianCrossings(a:GeoPoint,b:GeoPoint,step:number) {
    const start=a.lon,end=a.lon+deltaLongitude(a.lon,b.lon);
    if(Math.abs(end-start)<1e-9)return [] as GeoPoint[];
    const lo=Math.min(start,end),hi=Math.max(start,end);
    const result:GeoPoint[]=[];
    for(let longitude=Math.ceil(lo/step)*step;longitude<hi;longitude+=step){
        const t=(longitude-start)/(end-start);
        if(t>0.01&&t<0.99)result.push(rhumbPoint(a,b,t));
    }
    return result;
}
