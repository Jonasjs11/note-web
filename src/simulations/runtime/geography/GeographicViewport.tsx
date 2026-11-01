import {useCallback, useEffect, useRef, useState} from "react";
import type {PointerEvent} from "react";
import {
    add, clamp, dot, fromVector, greatCirclePlane, localFrame,
    multiply, parallelAngle, pointOnRoute, RAD, routeBearing, rhumbMeridianCrossings,
    toVector, unit, wrapLon,
} from "./sphericalNavigation";
import type {GeoPoint, RouteKind} from "./sphericalNavigation";

export type MapProjection = "globe" | "mercator" | "equirectangular";
type ScreenPoint = {x:number;y:number;z:number;visible:boolean;lon:number};
type RoutePixel = {x:number;y:number;t:number;visible:boolean;lon:number};
type Hover = {kind:RouteKind;t:number;x:number;y:number};
type GlobeProps = {
    from:GeoPoint; to:GeoPoint; projection:MapProjection; translucent:boolean;
    meridianStep:number; showGrid:boolean; zoom:number; focus?:GeoPoint|null;
    onPick:(point:GeoPoint)=>void; onHover?:(value:string)=>void;
};
type Camera = {lat:number;lon:number};
const ACCENT = "#ffb35c";
const SECONDARY = "#8ae4f2";
const MAX_LAT = 85;
const traceSteps = 220;
const formatAngle = (number:number) => number.toFixed(1)+"°";
const cssPoint = (event:PointerEvent<HTMLCanvasElement>,canvas:HTMLCanvasElement) => {
    const bounds=canvas.getBoundingClientRect();
    return {x:event.clientX-bounds.left,y:event.clientY-bounds.top};
};

export default function GeographicViewport({
    from,to,projection,translucent,meridianStep,showGrid,zoom,focus,onPick,onHover,
}:GlobeProps) {
    const canvasRef=useRef<HTMLCanvasElement>(null);
    const [size,setSize]=useState({width:720,height:410});
    const [camera,setCamera]=useState<Camera>({lat:45,lon:-33});
    const [world,setWorld]=useState<number[][][]>([]);
    const [hover,setHover]=useState<Hover|null>(null);
    const [morph,setMorph]=useState(projection==="globe"?0:1);
    const morphRef=useRef(morph);
    const pixelsRef=useRef<{kind:RouteKind;points:RoutePixel[]}[]>([]);
    const dragRef=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null);

    useEffect(()=>{
        let alive=true;
        void import("./countries.json").then(module=>{
            if(alive)setWorld(module.default as number[][][]);
        }).catch(()=>{ /* Graticule and routes still work without the optional map asset. */ });
        return ()=>{alive=false;};
    },[]);
    useEffect(()=>{if(focus)setCamera({lat:clamp(focus.lat,-80,80),lon:focus.lon});},[focus]);
    useEffect(()=>{
        const node=canvasRef.current;
        if(!node)return;
        const resize=()=>{
            const rect=node.getBoundingClientRect();
            setSize({width:Math.max(1,rect.width),height:Math.max(1,rect.height)});
        };
        resize();
        const observer=new ResizeObserver(resize);
        observer.observe(node);
        return ()=>observer.disconnect();
    },[]);
    useEffect(()=>{
        const target=projection==="globe"?0:1;
        const startValue=morphRef.current;
        const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if(reduced){morphRef.current=target;setMorph(target);return;}
        const start=performance.now();
        let frame=0;
        const animate=(now:number)=>{
            const t=clamp((now-start)/380,0,1);
            const smooth=t*t*(3-2*t);
            const next=startValue+(target-startValue)*smooth;
            morphRef.current=next;
            setMorph(next);
            if(t<1)frame=requestAnimationFrame(animate);
        };
        frame=requestAnimationFrame(animate);
        return ()=>cancelAnimationFrame(frame);
    },[projection]);

    const layout=useCallback(()=>{
        const {width:w,height:h}=size;
        const radius=Math.min(w*0.44,h*0.455)*zoom;
        const mapWidth=Math.min(w-24,(h-22)*2.0)*Math.min(zoom,1.12);
        return {cx:w/2,cy:h/2,radius,mapWidth,mapHeight:mapWidth/2};
    },[size,zoom]);

    const project=useCallback((p:GeoPoint):ScreenPoint=>{
        const {cx,cy,radius,mapWidth,mapHeight}=layout();
        const relative=wrapLon(p.lon-camera.lon);
        const basis=localFrame(camera),v=toVector(p);
        const gx=cx+dot(v,basis.east)*radius;
        const gy=cy-dot(v,basis.north)*radius;
        const z=dot(v,basis.up);
        const mx=cx+relative/180*mapWidth/2;
        const my=cy-(projection==="mercator"?
            Math.log(Math.tan(Math.PI/4+clamp(p.lat,-MAX_LAT,MAX_LAT)*RAD/2))/Math.PI:
            p.lat/90)*mapHeight/2;
        return {x:gx*(1-morph)+mx*morph,y:gy*(1-morph)+my*morph,
            z,visible:z>=-0.002||translucent||morph>0.3,lon:relative};
    },[camera,layout,projection,morph,translucent]);

    const unproject=useCallback((x:number,y:number):GeoPoint|null=>{
        const {cx,cy,radius,mapWidth,mapHeight}=layout();
        if(projection!=="globe"){
            const sx=(x-cx)/(mapWidth/2),sy=(cy-y)/(mapHeight/2);
            if(Math.abs(sx)>1||Math.abs(sy)>1)return null;
            const lat=projection==="mercator"?
                (2*Math.atan(Math.exp(sy*Math.PI))-Math.PI/2)/RAD:sy*90;
            return {lat:clamp(lat,-90,90),lon:wrapLon(camera.lon+sx*180)};
        }
        const nx=(x-cx)/radius,ny=-(y-cy)/radius;
        const distance=nx*nx+ny*ny;
        if(distance>1)return null;
        const basis=localFrame(camera);
        const nz=Math.sqrt(Math.max(0,1-distance));
        const v=add(add(multiply(basis.east,nx),multiply(basis.north,ny)),multiply(basis.up,nz));
        return fromVector(unit(v));
    },[camera,layout,projection]);

    useEffect(()=>{
        const canvas=canvasRef.current;
        const ctx=canvas?.getContext("2d");
        if(!canvas||!ctx)return;
        const {width:w,height:h}=size;
        const ratio=Math.min(window.devicePixelRatio||1,2);
        const pixelWidth=Math.round(w*ratio),pixelHeight=Math.round(h*ratio);
        if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){
            canvas.width=pixelWidth;canvas.height=pixelHeight;
        }
        ctx.setTransform(ratio,0,0,ratio,0,0);
        ctx.clearRect(0,0,w,h);
        const {cx,cy,radius,mapWidth,mapHeight}=layout();
        const pMap=morph;
        const inMap=projection!=="globe"&&morph>0.995;
        const inGlobe=projection==="globe"&&morph<0.005;
        const mapLonBreak=(p:ScreenPoint,q:ScreenPoint)=>inMap&&Math.abs(p.lon-q.lon)>180;
        const drawPath=(points:GeoPoint[],color:string,width:number,alpha=1,fill?:string,back=false)=>{
            if(points.length<2)return;
            ctx.beginPath();
            let started=false,prev:ScreenPoint|null=null,allVisible=true,valid=0;
            for(const geo of points){
                const current=project(geo);
                const visible=current.visible||back;
                if(!current.visible)allVisible=false;
                if(!visible|| (prev && mapLonBreak(prev,current))){
                    started=false;
                }
                if(visible){
                    if(!started)ctx.moveTo(current.x,current.y);
                    else ctx.lineTo(current.x,current.y);
                    started=true;valid++;
                }
                prev=current;
            }
            if(fill&&allVisible&&valid>2){
                ctx.closePath();
                ctx.fillStyle=fill;
                ctx.globalAlpha=alpha*0.55;
                ctx.fill();
            }
            ctx.globalAlpha=alpha;
            ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
            ctx.globalAlpha=1;
        };
        // Draw a shaded globe rather than relying on a WebGL context or network textures.
        if(pMap<1){
            ctx.save();
            ctx.globalAlpha=(1-pMap)*(translucent?0.24:1);
            ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);
            const glow=ctx.createRadialGradient(cx-radius*0.35,cy-radius*0.5,radius*0.05,cx,cy,radius*1.1);
            glow.addColorStop(0,"#397994");glow.addColorStop(0.55,"#153b57");
            glow.addColorStop(1,"#081e39");
            ctx.fillStyle=glow;ctx.fill();
            ctx.strokeStyle="#6fb9d5";ctx.lineWidth=1.6;ctx.stroke();
            ctx.restore();
        }
        if(pMap>0){
            ctx.globalAlpha=pMap;
            ctx.fillStyle="#102b40";
            ctx.fillRect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);
            ctx.strokeStyle="#4b819d";ctx.lineWidth=1;
            ctx.strokeRect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);
            ctx.globalAlpha=1;
        }
        // These clips are only needed in the settled views.
        ctx.save();
        if(inGlobe){
            ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
        }else if(inMap){
            ctx.beginPath();ctx.rect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);ctx.clip();
        }

        // Country boundaries are stored locally; no third-party network request at runtime.
        for(const ring of world){
            const shape=ring.map(([lon,lat])=>({lon,lat}));
            drawPath(shape,"#a3d9d2",0.7,0.74,"#3d806c",false);
        }

        if(showGrid){
            for(let lat=-75;lat<=75;lat+=15){
                const p:GeoPoint[]=[];
                for(let lon=-180;lon<=180;lon+=2)p.push({lat,lon});
                drawPath(p,"#b4d3df",lat===0?1.1:0.65,lat===0?0.5:0.27);
            }
            for(let lon=-180;lon<180;lon+=meridianStep){
                const p:GeoPoint[]=[];
                for(let lat=-85;lat<=85;lat+=2)p.push({lat,lon});
                drawPath(p,"#b4d3df",0.75,0.29);
            }
        }

        if(translucent&&pMap<0.97){
            const plane=greatCirclePlane(from,to);
            const ring:GeoPoint[]=[];
            for(let i=0;i<=180;i++){
                const theta=i/180*Math.PI*2;
                ring.push(fromVector(add(multiply(plane.va,Math.cos(theta)),
                    multiply(plane.tangent,Math.sin(theta)))));
            }
            ctx.beginPath();
            ring.forEach((geo,i)=>{
                const pos=project(geo);
                if(i===0)ctx.moveTo(pos.x,pos.y);else ctx.lineTo(pos.x,pos.y);
            });
            ctx.closePath();
            ctx.fillStyle="#ffbd64";ctx.globalAlpha=(1-pMap)*0.16;ctx.fill();
            ctx.strokeStyle="#ffc576";ctx.globalAlpha=(1-pMap)*0.58;ctx.lineWidth=1.6;ctx.stroke();
            ctx.globalAlpha=1;
            ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);
            ctx.fillStyle="#ffe1a7";ctx.fill();
        }

        const routePixels:{kind:RouteKind;points:RoutePixel[]}[]=[];
        for(const kind of ["greatCircle","rhumb"] as const){
            const coords:GeoPoint[]=[];
            for(let i=0;i<=traceSteps;i++)coords.push(pointOnRoute(kind,from,to,i/traceSteps));
            const pixels=coords.map((geo,i)=>{
                const p=project(geo);
                return {x:p.x,y:p.y,t:i/traceSteps,visible:p.visible,lon:p.lon};
            });
            routePixels.push({kind,points:pixels});
            ctx.beginPath();let started=false;
            for(let i=0;i<pixels.length;i++){
                const p=pixels[i],previous=pixels[i-1];
                if(!p.visible|| (previous&&inMap&&Math.abs(p.lon-previous.lon)>180))started=false;
                if(p.visible){
                    if(started)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);
                    started=true;
                }
            }
            ctx.globalAlpha=0.95;
            ctx.strokeStyle=kind==="rhumb"?ACCENT:SECONDARY;
            ctx.lineWidth=kind==="rhumb"?3.2:3.4;
            ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
            ctx.globalAlpha=1;
        }
        pixelsRef.current=routePixels;

        const bearing=routeBearing("rhumb",from,to,0);
        const crossings=rhumbMeridianCrossings(from,to,meridianStep);
        const markArc=(p:GeoPoint,heading:number,radiusArc:number,relativeToParallel=false)=>{
            const {east,north,up}=localFrame(p);
            const start=relativeToParallel?90:0;
            const delta=relativeToParallel?
                ((heading-90+540)%360)-180:((heading+540)%360)-180;
            const arc:GeoPoint[]=[];
            for(let j=0;j<=12;j++){
                const angle=(start+delta*j/12)*RAD;
                const v=add(multiply(up,Math.cos(radiusArc)),
                    multiply(add(multiply(north,Math.cos(angle)),multiply(east,Math.sin(angle))),Math.sin(radiusArc)));
                arc.push(fromVector(unit(v)));
            }
            drawPath(arc,relativeToParallel?"#fff2b3":"#ffd0a0",2,0.95);
        };
        for(let i=0;i<crossings.length;i++){
            const pos=project(crossings[i]);
            if(!pos.visible)continue;
            ctx.beginPath();ctx.arc(pos.x,pos.y,2.8,0,Math.PI*2);
            ctx.fillStyle=ACCENT;ctx.fill();
            if(meridianStep>=15)markArc(crossings[i],bearing,0.085);
            if(meridianStep>=30|| (meridianStep>=15&&i%2===0)){
                ctx.font="11px system-ui,sans-serif";
                ctx.textAlign="left";ctx.fillStyle="#ffe1b5";
                ctx.fillText(Math.round(bearing)+"°",pos.x+7,pos.y-8);
            }
        }

        for(const [i,p] of [from,to].entries()){
            const at=project(p);
            if(!at.visible)continue;
            ctx.beginPath();ctx.arc(at.x,at.y,6.2,0,Math.PI*2);
            ctx.fillStyle=i===0?"#74e5b5":"#ffd08d";ctx.fill();
            ctx.lineWidth=2;ctx.strokeStyle="#102031";ctx.stroke();
            ctx.font="bold 12px system-ui,sans-serif";ctx.textAlign="center";
            ctx.fillStyle="#ffffff";ctx.fillText(i===0?"A":"B",at.x,at.y-13);
        }

        if(hover){
            const point=pointOnRoute(hover.kind,from,to,hover.t);
            const heading=routeBearing(hover.kind,from,to,hover.t);
            const lat:GeoPoint[]=[];
            for(let lon=-180;lon<=180;lon+=1.5)lat.push({lat:point.lat,lon});
            drawPath(lat,"#6ce7b5",1.9,0.92);
            const frame=localFrame(point);
            const a=heading*RAD;
            const direction=add(multiply(frame.north,Math.cos(a)),multiply(frame.east,Math.sin(a)));
            const tangent:GeoPoint[]=[];
            const parallel:GeoPoint[]=[];
            for(let i=-8;i<=8;i++){
                const d=i*0.015;
                tangent.push(fromVector(unit(add(multiply(frame.up,Math.cos(d)),multiply(direction,Math.sin(d))))));
                parallel.push(fromVector(unit(add(multiply(frame.up,Math.cos(d)),multiply(frame.east,Math.sin(d))))));
            }
            drawPath(parallel,"#68e7b1",2.6,0.95);
            drawPath(tangent,"#ffe3a2",2.7,0.95);
            markArc(point,heading,0.13,true);
            const pt=project(point);
            ctx.beginPath();ctx.arc(pt.x,pt.y,4.2,0,Math.PI*2);
            ctx.fillStyle="#ffffff";ctx.fill();
        }
        ctx.restore();

        if(hover){
            const p=pointOnRoute(hover.kind,from,to,hover.t);
            const bearing=routeBearing(hover.kind,from,to,hover.t);
            const label=(hover.kind==="rhumb"?"Loxodrome":"Orthodrome")+
                "  "+formatAngle(bearing)+" T   ·   "+formatAngle(parallelAngle(bearing))+" to latitude";
            ctx.font="12px system-ui,sans-serif";ctx.textAlign="left";
            const width=Math.min(w-16,ctx.measureText(label).width+20);
            const x=clamp(hover.x-width/2,8,w-width-8);
            const y=clamp(hover.y-53,8,h-31);
            ctx.fillStyle="rgba(12,25,39,0.94)";
            ctx.beginPath();ctx.roundRect(x,y,width,30,7);ctx.fill();
            ctx.fillStyle="#ffffff";ctx.fillText(label,x+10,y+19,width-19);
            void p;
        }
    },[size,camera,project,layout,from,to,world,morph,projection,translucent,meridianStep,showGrid,hover,zoom]);

    const onPointerDown=(event:PointerEvent<HTMLCanvasElement>)=>{
        event.currentTarget.setPointerCapture(event.pointerId);
        const p=cssPoint(event,event.currentTarget);
        dragRef.current={id:event.pointerId,x:p.x,y:p.y,moved:false};
    };
    const onPointerMove=(event:PointerEvent<HTMLCanvasElement>)=>{
        const pos=cssPoint(event,event.currentTarget);
        const drag=dragRef.current;
        if(drag&&drag.id===event.pointerId){
            const dx=pos.x-drag.x,dy=pos.y-drag.y;
            if(Math.hypot(dx,dy)>2)drag.moved=true;
            if(drag.moved){
                const {radius,mapWidth}=layout();
                setCamera(c=>({
                    lat:projection==="globe"?clamp(c.lat+dy*90/radius,-83,83):c.lat,
                    lon:wrapLon(c.lon-dx*(projection==="globe"?105/radius:360/mapWidth)),
                }));
                drag.x=pos.x;drag.y=pos.y;
            }
            setHover(null);
            return;
        }
        let best:{kind:RouteKind;t:number;distance:number}|null=null;
        for(const route of pixelsRef.current){
            for(let i=1;i<route.points.length;i++){
                const a=route.points[i-1],b=route.points[i];
                if(!a.visible||!b.visible)continue;
                if(projection!=="globe"&&Math.abs(a.lon-b.lon)>180)continue;
                const vx=b.x-a.x,vy=b.y-a.y;
                const d=vx*vx+vy*vy;
                if(d<0.01)continue;
                const f=clamp(((pos.x-a.x)*vx+(pos.y-a.y)*vy)/d,0,1);
                const distance=Math.hypot(pos.x-a.x-vx*f,pos.y-a.y-vy*f);
                if(distance<12&&(!best||distance<best.distance))
                    best={kind:route.kind,t:a.t+(b.t-a.t)*f,distance};
            }
        }
        if(best){
            const {kind,t}=best;
            setHover({kind,t,x:pos.x,y:pos.y});
            onHover?.((kind==="rhumb"?"Loxodrome":"Orthodrome")+
                ": "+formatAngle(routeBearing(kind,from,to,t))+" true; "+
                formatAngle(parallelAngle(routeBearing(kind,from,to,t)))+" to latitude");
        }else{
            setHover(null);onHover?.("");
        }
    };
    const onPointerUp=(event:PointerEvent<HTMLCanvasElement>)=>{
        const drag=dragRef.current;
        if(drag&&drag.id===event.pointerId){
            const p=cssPoint(event,event.currentTarget);
            if(!drag.moved){
                const selected=unproject(p.x,p.y);
                if(selected)onPick(selected);
            }
            dragRef.current=null;
        }
    };
    return <canvas
        className="geographic-viewport" ref={canvasRef} role="img"
        aria-label="Interactive globe and map. Tap to set a location, drag to rotate or pan, and hover over a route to inspect its course."
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={()=>{dragRef.current=null;}}
        onPointerLeave={()=>{if(!dragRef.current){setHover(null);onHover?.("");}}}
    />;
}
