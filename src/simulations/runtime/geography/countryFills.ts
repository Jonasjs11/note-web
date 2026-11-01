/**
 * Fill country polygons at the globe limb and at flat-map wrap seams.
 * The old "all vertices visible" rule left coastlines hollow at edges.
 */
import {add, dot, localFrame, multiply, toVector, unit, wrapLon} from "./sphericalNavigation";
import type {GeoPoint, Vec3} from "./sphericalNavigation";

type Projected={x:number;y:number;z:number;v:Vec3};
const LAND="#3d806c", COAST="#a3d9d2";

function paint(ctx:CanvasRenderingContext2D,alpha:number){
    ctx.closePath();
    ctx.fillStyle=LAND;
    ctx.globalAlpha=alpha*0.64;
    ctx.fill();
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=COAST;
    ctx.lineWidth=0.7;
    ctx.stroke();
    ctx.globalAlpha=1;
}

/**
 * Clip a spherical polygon against the visible hemisphere (z >= 0).
 * Where an edge exits the sphere, close the polygon along the globe limb
 * instead of dropping its fill or drawing across the back hemisphere.
 */
export function fillGlobeCountry(
    ring:number[][],ctx:CanvasRenderingContext2D,view:GeoPoint,
    cx:number,cy:number,radius:number,translucent:boolean,
):void{
    if(ring.length<3)return;
    const basis=localFrame(view);
    const pts:Projected[]=ring.map(([lon,lat])=>{
        const v=toVector({lon,lat});
        return {x:cx+dot(v,basis.east)*radius,y:cy-dot(v,basis.north)*radius,
            z:dot(v,basis.up),v};
    });
    const firstHidden=pts.findIndex(p=>p.z<0);
    const alpha=translucent?0.50:0.74;
    if(firstHidden<0){
        ctx.beginPath();
        pts.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
        paint(ctx,alpha);
        return;
    }
    if(pts.every(p=>p.z<0))return;
    const limb=(a:Projected,b:Projected)=>{
        const t=a.z/(a.z-b.z);
        const v=unit(add(multiply(a.v,1-t),multiply(b.v,t)));
        return {x:cx+dot(v,basis.east)*radius,y:cy-dot(v,basis.north)*radius};
    };
    let start:{x:number;y:number}|null=null;
    for(let k=0;k<pts.length;k++){
        const a=pts[(firstHidden+k)%pts.length];
        const b=pts[(firstHidden+k+1)%pts.length];
        if(a.z<0&&b.z>=0){
            start=limb(a,b);
            ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(b.x,b.y);
        }else if(a.z>=0&&b.z>=0){
            ctx.lineTo(b.x,b.y);
        }else if(a.z>=0&&b.z<0&&start){
            const end=limb(a,b);
            ctx.lineTo(end.x,end.y);
            const thetaA=Math.atan2(end.y-cy,end.x-cx);
            const thetaB=Math.atan2(start.y-cy,start.x-cx);
            // Country boundaries near the limb generally occupy the shorter
            // arc. Follow the circumference, not a chord across the interior.
            const signed=wrapLon((thetaB-thetaA)*180/Math.PI)*Math.PI/180;
            ctx.arc(cx,cy,radius,thetaA,thetaA+signed,signed<0);
            paint(ctx,alpha);
            start=null;
        }
    }
}

/**
 * Clip polygons in longitude/latitude *before* projecting them.
 *
 * Longitude-latitude charts are cut at their ±180° seam, and Mercator is
 * clipped to ±85° latitude. Closing an Antarctic polygon directly across the
 * longitude seam would fill a giant rectangular region outside the continent.
 * In Lambert, unbounded global polygons would extend/overlap outside the
 * useful local conic chart. Both are prevented by the geographic clip.
 */
type LonLat={lon:number;lat:number};

function clipEdge(
    vertices:LonLat[],
    axis:"lat"|"lon",
    boundary:number,
    keepGreater:boolean,
):LonLat[]{
    if(vertices.length===0)return [];
    const inside=(p:LonLat)=>keepGreater?p[axis]>=boundary:p[axis]<=boundary;
    const result:LonLat[]=[];
    let prev=vertices[vertices.length-1];
    for(const current of vertices){
        const prevInside=inside(prev),currentInside=inside(current);
        if(prevInside!==currentInside){
            const denominator=current[axis]-prev[axis];
            if(Math.abs(denominator)>1e-12){
                const t=(boundary-prev[axis])/denominator;
                result.push({
                    lon:prev.lon+(current.lon-prev.lon)*t,
                    lat:prev.lat+(current.lat-prev.lat)*t,
                });
            }
        }
        if(currentInside)result.push(current);
        prev=current;
    }
    return result;
}
function clipGeography(polygon:LonLat[],minLon:number,maxLon:number,minLat:number,maxLat:number){
    return clipEdge(
        clipEdge(
            clipEdge(
                clipEdge(polygon,"lon",minLon,true),
            "lon",maxLon,false),
        "lat",minLat,true),
    "lat",maxLat,false);
}

function unwrapCountry(ring:number[][],centralLon:number):LonLat[]{
    let previous=wrapLon(ring[0][0]-centralLon);
    const points:LonLat[]=[];
    for(let i=0;i<ring.length;i++){
        const [lon,lat]=ring[i];
        if(i>0){
            let difference=wrapLon(lon-centralLon)-wrapLon(previous);
            if(difference>180)difference-=360;
            if(difference< -180)difference+=360;
            previous+=difference;
        }
        points.push({lon:centralLon+previous,lat});
    }
    // A polar continent wraps the meridian once. Its coastline's first and
    // last vertices coincide geographically but differ by 360° after
    // unwrapping. Finish via the chart's polar boundary, NOT with a diagonal
    // directly connecting the coast ends (the Antarctica rectangle bug).
    const winding=points[points.length-1].lon-points[0].lon;
    const nearSouth=points.every(p=>p.lat< -45);
    const nearNorth=points.every(p=>p.lat>45);
    if(Math.abs(winding)>300&&(nearSouth||nearNorth)){
        const cap=nearSouth?-85:85;
        points.push(
            {lon:points[points.length-1].lon,lat:cap},
            {lon:points[0].lon,lat:cap},
        );
    }
    return points;
}

/** Draw a clipped land polygon in the selected flat projection. */
export function fillFlatCountry(
    ring:number[][],ctx:CanvasRenderingContext2D,
    projection:"mercator"|"lambert",centralLon:number,
    project:(point:GeoPoint,longitude?:number)=>{x:number;y:number},
    _mapWidth:number,
):void{
    if(ring.length<3)return;
    const unwrapped=unwrapCountry(ring,centralLon);
    const latLimit=85;
    // A local Lambert chart is a single conical sheet, not a world map.
    // Restrict longitude to the part of the sheet around its central meridian.
    const lonLimit=projection==="lambert"?125:180;
    const minLon=centralLon-lonLimit,maxLon=centralLon+lonLimit;
    const viewportWidth=ctx.canvas.clientWidth||ctx.canvas.width;
    const viewportHeight=ctx.canvas.clientHeight||ctx.canvas.height;
    for(const shift of [-360,0,360]){
        const shifted=unwrapped.map(p=>({lon:p.lon+shift,lat:p.lat}));
        const lons=shifted.map(p=>p.lon);
        if(Math.max(...lons)<minLon||Math.min(...lons)>maxLon)continue;
        const clipped=clipGeography(shifted,minLon,maxLon,-latLimit,latLimit);
        if(clipped.length<3)continue;
        const pts=clipped.map(p=>project(p,p.lon));
        if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))continue;
        const left=Math.min(...pts.map(p=>p.x)),right=Math.max(...pts.map(p=>p.x));
        const top=Math.min(...pts.map(p=>p.y)),bottom=Math.max(...pts.map(p=>p.y));
        if(right< -3||left>viewportWidth+3||bottom< -3||top>viewportHeight+3)continue;
        ctx.beginPath();
        for(let i=0;i<pts.length;i++){
            const p=pts[i];
            if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
        }
        paint(ctx,0.73);
    }
}
