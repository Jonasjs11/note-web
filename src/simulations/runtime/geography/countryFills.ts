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
 * Unwrap each polygon ring before plotting it, then make wrapped copies on
 * Mercator. Canvas clipping handles the visible chart edge during filling.
 */
export function fillFlatCountry(
    ring:number[][],ctx:CanvasRenderingContext2D,
    projection:"mercator"|"lambert",centralLon:number,
    project:(point:GeoPoint,longitude?:number)=>{x:number;y:number},
    mapWidth:number,
):void{
    if(ring.length<3)return;
    const unwrapped:GeoPoint[]=[];
    let previous=wrapLon(ring[0][0]-centralLon);
    for(let i=0;i<ring.length;i++){
        const [lon,lat]=ring[i];
        const relative=wrapLon(lon-centralLon);
        if(i>0){
            let delta=relative-wrapLon(previous);
            if(delta>180)delta-=360;
            if(delta< -180)delta+=360;
            previous+=delta;
        }
        unwrapped.push({lon:centralLon+previous,lat});
    }
    // Lambert has a longitude seam too, but is conic rather than cylindrical.
    const shifts=projection==="mercator"?[-360,0,360]:[-360,0,360];
    for(const shift of shifts){
        const pts=unwrapped.map(p=>project(p,p.lon+shift));
        if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||
            Math.abs(p.x)>200000||Math.abs(p.y)>200000))continue;
        // Very distant wraps never touch the chart; skip for performance.
        const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x));
        if(projection==="mercator"&&maxX< -mapWidth*1.5)continue;
        if(projection==="mercator"&&minX> mapWidth*2.5)continue;
        ctx.beginPath();
        pts.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
        paint(ctx,0.73);
    }
}
