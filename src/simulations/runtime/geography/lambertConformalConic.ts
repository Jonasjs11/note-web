/**
 * Spherical Lambert Conformal Conic (two standard parallels).
 * All coordinates are dimensionless multiples of the sphere radius.
 * See USGS Snyder, Map Projections: A Working Manual, section 15.
 */
import {clamp, DEG, deltaLongitude, greatCirclePoint, RAD, wrapLon} from "./sphericalNavigation";
import type {GeoPoint} from "./sphericalNavigation";

export interface LambertProjection {
    lon0:number; lat0:number;
    standardParallels:readonly [number,number];
    project:(point:GeoPoint,unwrappedLongitude?:number)=>{x:number;y:number};
    inverse:(x:number,y:number)=>GeoPoint;
}

export function createLambertProjection(a:GeoPoint,b:GeoPoint):LambertProjection {
    // Choose parameters for the *route*, not a fixed country chart:
    // the great-circle midpoint provides the central meridian, and two
    // standard parallels surround the route's average latitude.
    const mid=greatCirclePoint(a,b,0.5);
    let sum=0;
    for(let i=0;i<=20;i++)sum+=greatCirclePoint(a,b,i/20).lat;
    const avg=sum/21;
    const lat0=clamp(Math.abs(avg)<9?(avg<0?-9:9):avg,-73,73);
    const phi1=clamp(lat0-8,-82,82)*RAD;
    const phi2=clamp(lat0+8,-82,82)*RAD;
    const phi0=lat0*RAD;
    const t=(phi:number)=>Math.tan(Math.PI/4+clamp(phi,-89.99*RAD,89.99*RAD)/2);
    const n=Math.log(Math.cos(phi1)/Math.cos(phi2))/Math.log(t(phi2)/t(phi1));
    const f=Math.cos(phi1)*Math.pow(t(phi1),n)/n;
    const rho0=f/Math.pow(t(phi0),n);
    const lon0=mid.lon;
    const project=(point:GeoPoint,unwrappedLongitude?:number)=>{
        const phi=clamp(point.lat,-89.5,89.5)*RAD;
        const rho=f/Math.pow(t(phi),n);
        const delta=(unwrappedLongitude===undefined?
            deltaLongitude(lon0,point.lon):unwrappedLongitude-lon0)*RAD;
        const theta=n*delta;
        return {x:rho*Math.sin(theta),y:rho0-rho*Math.cos(theta)};
    };
    const inverse=(x:number,y:number):GeoPoint=>{
        const rho=Math.sign(n)*Math.hypot(x,rho0-y);
        const theta=Math.atan2(Math.sign(n)*x,Math.sign(n)*(rho0-y));
        const phi=2*Math.atan(Math.pow(f/rho,1/n))-Math.PI/2;
        return {lat:clamp(phi*DEG,-90,90),lon:wrapLon(lon0+theta/n*DEG)};
    };
    return {lon0,lat0,standardParallels:[phi1*DEG,phi2*DEG],project,inverse};
}
