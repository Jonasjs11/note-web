import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {PointerEvent} from "react";
import {
    add, clamp, completeGreatCircle, dot, extendedRhumbLine, fromVector, greatCirclePlane, localFrame,
    multiply, pointOnRoute, RAD, routeBearing, rhumbMeridianCrossings,
    toVector, unit, wrapLon,
} from "./sphericalNavigation";
import type {GeoPoint, RouteKind} from "./sphericalNavigation";
import {createLambertProjection} from "./lambertConformalConic";
import {fillFlatCountry,fillGlobeCountry} from "./countryFills";

export type MapProjection = "globe" | "mercator" | "lambert";
type ScreenPoint = {x:number;y:number;z:number;visible:boolean;lon:number};
type RoutePixel = {x:number;y:number;t:number;visible:boolean;lon:number};
type Hover = {kind:RouteKind;t:number;x:number;y:number};
type GlobeProps = {
    from:GeoPoint; to:GeoPoint; projection:MapProjection; translucent:boolean;
    meridianStep:number; showGrid:boolean; showFullRoutes:boolean;
    zoom:number; focus?:GeoPoint|null; picking:boolean;
    hoverLabels?:{orthodrome:string;loxodrome:string;trueTrack:string};
    onPick:(point:GeoPoint)=>void; onHover?:(value:string)=>void;
};
type Camera = {lat:number;lon:number};
// Darker endpoint-to-endpoint arcs on top of lighter complete routes.
const LOXODROME = "#df8740";
const ORTHODROME = "#3dbfd6";
const LOXODROME_EXTENSION = "#ffd3a3";
const ORTHODROME_EXTENSION = "#95e8f4";
const MAX_LAT = 85;
const traceSteps = 220;
const formatAngle = (number:number) => number.toFixed(1)+"°";
const cssPoint = (event:PointerEvent<HTMLCanvasElement>,canvas:HTMLCanvasElement) => {
    const bounds=canvas.getBoundingClientRect();
    return {x:event.clientX-bounds.left,y:event.clientY-bounds.top};
};

export default function GeographicViewport({
    from,to,projection,translucent,meridianStep,showGrid,showFullRoutes,
    zoom,focus,picking,hoverLabels,onPick,onHover,
}:GlobeProps) {
    const canvasRef=useRef<HTMLCanvasElement>(null);
    const [size,setSize]=useState({width:720,height:410});
    const [camera,setCamera]=useState<Camera>({lat:45,lon:-33});
    const [lambertPan,setLambertPan]=useState({x:0,y:0});
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
    useEffect(()=>{setLambertPan({x:0,y:0});},[from,to,projection]);
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

    // A real Lambert Conformal Conic (2SP) chart, recentered and fitted
    // from both A→B paths. Fit uses the selected paths, never the full
    // infinitely extended rhumb or all global country boundaries.
    const lambert=useMemo(()=>{
        const chart=createLambertProjection(from,to);
        const samples=[] as {x:number;y:number}[];
        for(const kind of ["greatCircle","rhumb"] as const)
            for(let i=0;i<=160;i++)samples.push(chart.project(pointOnRoute(kind,from,to,i/160)));
        let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
        for(const p of samples){
            if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
            minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
            minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
        }
        if(!Number.isFinite(minX)){minX=-0.5;maxX=0.5;minY=-0.5;maxY=0.5;}
        const spanX=Math.max(0.10,maxX-minX);
        const spanY=Math.max(0.10,maxY-minY);
        const scale=Math.min(size.width*0.82/spanX,size.height*0.79/spanY);
        return {chart,scale,centerX:(minX+maxX)/2,centerY:(minY+maxY)/2};
    },[from,to,size]);
    const flatPoint=useCallback((point:GeoPoint,unwrappedLon?:number)=>{
        const {cx,cy,mapWidth,mapHeight}=layout();
        if(projection==="lambert"){
            const p=lambert.chart.project(point,unwrappedLon);
            return {x:cx+(p.x-lambert.centerX)*lambert.scale*zoom+lambertPan.x,
                y:cy-(p.y-lambert.centerY)*lambert.scale*zoom+lambertPan.y};
        }
        const lon=(unwrappedLon===undefined?wrapLon(point.lon-camera.lon):unwrappedLon-camera.lon);
        const latitude=clamp(point.lat,-MAX_LAT,MAX_LAT)*RAD;
        return {x:cx+lon/360*mapWidth,
            y:cy-Math.log(Math.tan(Math.PI/4+latitude/2))/Math.PI*mapHeight/2};
    },[camera.lon,layout,projection,lambert,zoom,lambertPan]);
    const project=useCallback((p:GeoPoint):ScreenPoint=>{
        const {cx,cy,radius}=layout();
        const relative=wrapLon(p.lon-(projection==="lambert"?lambert.chart.lon0:camera.lon));
        const basis=localFrame(camera),v=toVector(p);
        const gx=cx+dot(v,basis.east)*radius;
        const gy=cy-dot(v,basis.north)*radius;
        const z=dot(v,basis.up);
        const flat=flatPoint(p);
        const visible=(z>=-0.002||translucent||morph>0.3)&&
            (morph<0.8||projection==="lambert"||Math.abs(p.lat)<=MAX_LAT+1e-6);
        return {x:gx*(1-morph)+flat.x*morph,y:gy*(1-morph)+flat.y*morph,
            z,visible,lon:relative};
    },[camera,layout,projection,morph,translucent,lambert,flatPoint]);

    const unproject=useCallback((x:number,y:number):GeoPoint|null=>{
        const {cx,cy,radius,mapWidth,mapHeight}=layout();
        if(projection!=="globe"){
            if(projection==="lambert"){
                const e=(x-cx-lambertPan.x)/(lambert.scale*zoom)+lambert.centerX;
                const n=-(y-cy-lambertPan.y)/(lambert.scale*zoom)+lambert.centerY;
                const geographic=lambert.chart.inverse(e,n);
                return Number.isFinite(geographic.lat)&&Number.isFinite(geographic.lon)?geographic:null;
            }
            const sx=(x-cx)/(mapWidth/2),sy=(cy-y)/(mapHeight/2);
            if(Math.abs(sx)>1||Math.abs(sy)>1)return null;
            const lat=(2*Math.atan(Math.exp(sy*Math.PI))-Math.PI/2)/RAD;
            return {lat:clamp(lat,-90,90),lon:wrapLon(camera.lon+sx*180)};
        }
        const nx=(x-cx)/radius,ny=-(y-cy)/radius;
        const distance=nx*nx+ny*ny;
        if(distance>1)return null;
        const basis=localFrame(camera);
        const nz=Math.sqrt(Math.max(0,1-distance));
        const v=add(add(multiply(basis.east,nx),multiply(basis.north,ny)),multiply(basis.up,nz));
        return fromVector(unit(v));
    },[camera,layout,projection,lambert,lambertPan,zoom]);

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
        const mapLonBreak=(p:ScreenPoint,q:ScreenPoint)=>inMap&&projection==="mercator"&&Math.abs(p.lon-q.lon)>180;
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
            if(projection==="lambert")ctx.fillRect(0,0,w,h);
            else ctx.fillRect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);
            ctx.strokeStyle="#4b819d";ctx.lineWidth=1;
            if(projection!=="lambert")
                ctx.strokeRect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);
            ctx.globalAlpha=1;
        }
        // These clips are only needed in the settled views.
        ctx.save();
        if(inGlobe){
            ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
        }else if(inMap){
            ctx.beginPath();
            if(projection==="lambert")ctx.rect(0,0,w,h);
            else ctx.rect(cx-mapWidth/2,cy-mapHeight/2,mapWidth,mapHeight);
            ctx.clip();
        }

        // Country polygon fill (including polygons crossing the globe's limb
        // or the longitude seam) lives in its own clipping routines.
        for(const ring of world){
            if(inGlobe)fillGlobeCountry(ring,ctx,camera,cx,cy,radius,translucent);
            else if(inMap)fillFlatCountry(ring,ctx,projection==="lambert"?"lambert":"mercator",
                projection==="lambert"?lambert.chart.lon0:camera.lon,flatPoint,mapWidth);
            else drawPath(ring.map(([lon,lat])=>({lon,lat})),"#a3d9d2",0.7,0.74,"#3d806c");
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
            ctx.fillStyle=ORTHODROME;ctx.globalAlpha=(1-pMap)*0.16;ctx.fill();
            ctx.strokeStyle=ORTHODROME;ctx.globalAlpha=(1-pMap)*0.64;ctx.lineWidth=1.6;ctx.stroke();
            ctx.globalAlpha=1;
            ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);
            ctx.fillStyle=ORTHODROME;ctx.fill();
        }

        const routePixels:{kind:RouteKind;points:RoutePixel[]}[]=[];
        const traceRoute=(kind:RouteKind,samples:{point:GeoPoint;t:number}[],color:string,width:number,alpha:number)=>{
            const pixels=samples.map(({point,t})=>{
                const p=project(point);
                return {x:p.x,y:p.y,t,visible:p.visible,lon:p.lon};
            });
            routePixels.push({kind,points:pixels});
            ctx.beginPath();let started=false;
            for(let i=0;i<pixels.length;i++){
                const p=pixels[i],previous=pixels[i-1];
                if(!p.visible||(previous&&mapLonBreak(p,previous)))started=false;
                if(p.visible){
                    if(started)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);
                    started=true;
                }
            }
            ctx.globalAlpha=alpha;
            ctx.strokeStyle=color;ctx.lineWidth=width;
            ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
            ctx.globalAlpha=1;
        };
        // Full great circle is closed. The full rhumb has infinite length:
        // continue it to near-polar latitudes, avoiding the pole singularities.
        if(showFullRoutes){
            const psiLimit=projection==="globe"?6.3:
                Math.log(Math.tan(Math.PI/4+MAX_LAT*RAD/2));
            traceRoute("greatCircle",completeGreatCircle(from,to),
                ORTHODROME_EXTENSION,1.8,0.78);
            traceRoute("rhumb",extendedRhumbLine(from,to,psiLimit),
                LOXODROME_EXTENSION,1.8,0.78);
        }
        // Draw the selected shortest arcs last, in darker, thicker colors.
        for(const kind of ["greatCircle","rhumb"] as const){
            const samples=Array.from({length:traceSteps+1},(_,i)=>{
                const t=i/traceSteps;
                return {point:pointOnRoute(kind,from,to,t),t};
            });
            traceRoute(kind,samples,kind==="rhumb"?LOXODROME:ORTHODROME,3.5,1);
        }
        pixelsRef.current=routePixels;

        const bearing=routeBearing("rhumb",from,to,0);
        const crossings=rhumbMeridianCrossings(from,to,meridianStep);
        const labels:{x:number;y:number;text:string;color:string;priority:number}[]=[];
        const markArc=(p:GeoPoint,heading:number,radiusArc:number)=>{
            const {east,north,up}=localFrame(p);
            // True track is measured clockwise from north, 0–360°.
            // Do not shorten reflex angles to their acute/nearest-meridian arc.
            const arc:GeoPoint[]=[];
            const steps=Math.max(8,Math.ceil(heading/4));
            for(let j=0;j<=steps;j++){
                const angle=heading*j/steps*RAD;
                const tangent=add(multiply(north,Math.cos(angle)),multiply(east,Math.sin(angle)));
                arc.push(fromVector(unit(add(multiply(up,Math.cos(radiusArc)),
                    multiply(tangent,Math.sin(radiusArc))))));
            }
            drawPath(arc,"#fff2b3",2,0.95);
        };
        for(let i=0;i<crossings.length;i++){
            const pos=project(crossings[i]);
            if(!pos.visible)continue;
            ctx.beginPath();ctx.arc(pos.x,pos.y,2.8,0,Math.PI*2);
            ctx.fillStyle=LOXODROME;ctx.fill();
            if(meridianStep>=15)markArc(crossings[i],bearing,0.085);
            if(meridianStep>=30|| (meridianStep>=15&&i%2===0)){
                labels.push({x:pos.x,y:pos.y,text:Math.round(bearing)+"°",
                    color:"#ffe1b5",priority:1});
            }
        }

        for(const [i,p] of [from,to].entries()){
            const at=project(p);
            if(!at.visible)continue;
            ctx.beginPath();ctx.arc(at.x,at.y,6.2,0,Math.PI*2);
            ctx.fillStyle=i===0?"#74e5b5":"#ffd08d";ctx.fill();
            ctx.lineWidth=2;ctx.strokeStyle="#102031";ctx.stroke();
            labels.push({x:at.x,y:at.y,text:i===0?"A":"B",
                color:i===0?"#74e5b5":"#ffd08d",priority:0});
        }

        if(hover){
            const point=pointOnRoute(hover.kind,from,to,hover.t);
            const heading=routeBearing(hover.kind,from,to,hover.t);
            // A meridian (fixed longitude) replaces the old parallel guide.
            const meridian:GeoPoint[]=[];
            for(let latitude=-89;latitude<=89;latitude+=1)
                meridian.push({lat:latitude,lon:point.lon});
            drawPath(meridian,"#6ce7b5",1.9,0.92);
            const frame=localFrame(point);
            const a=heading*RAD;
            const direction=add(multiply(frame.north,Math.cos(a)),multiply(frame.east,Math.sin(a)));
            const tangent:GeoPoint[]=[];
            const northSouth:GeoPoint[]=[];
            for(let i=-8;i<=8;i++){
                const d=i*0.015;
                tangent.push(fromVector(unit(add(multiply(frame.up,Math.cos(d)),multiply(direction,Math.sin(d))))));
                northSouth.push(fromVector(unit(add(multiply(frame.up,Math.cos(d)),multiply(frame.north,Math.sin(d))))));
            }
            drawPath(northSouth,"#68e7b1",2.6,0.95);
            drawPath(tangent,"#ffe3a2",2.7,0.95);
            markArc(point,heading,0.13);
            const pt=project(point);
            ctx.beginPath();ctx.arc(pt.x,pt.y,4.2,0,Math.PI*2);
            ctx.fillStyle="#ffffff";ctx.fill();
        }
        ctx.restore();

        // Render text as foreground overlay AFTER all grid, tracks, guides,
        // and point markers. Placement tests both other labels and routes.
        // Opaque chips keep text legible even in crowded polar situations.
        type Rect={left:number;right:number;top:number;bottom:number};
        const occupied:Rect[]=[];
        const hoverHeading=hover?routeBearing(hover.kind,from,to,hover.t):0;
        const hoverTitle=hover
            ?(hover.kind==="rhumb"?(hoverLabels?.loxodrome??"Loxodrome"):
                (hoverLabels?.orthodrome??"Orthodrome"))+
                "  "+formatAngle(hoverHeading)+" "+(hoverLabels?.trueTrack??"true track")
            :"";
        ctx.font="12px system-ui,sans-serif";
        const hoverWidth=hover?Math.min(w-16,ctx.measureText(hoverTitle).width+22):0;
        const hoverBox:Rect={left:w-hoverWidth-9,right:w-9,top:9,bottom:42};
        if(hover)occupied.push(hoverBox);
        const markerCenters=[from,to].map(project).filter(p=>p.visible);
        const intersects=(a:Rect,b:Rect)=>
            Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
            Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
        const collidesWithLine=(rect:Rect)=>{
            let score=0;
            for(const route of routePixels){
                for(let i=0;i<route.points.length;i+=3){
                    const p=route.points[i];
                    if(p.visible&&p.x>=rect.left-2&&p.x<=rect.right+2&&
                       p.y>=rect.top-2&&p.y<=rect.bottom+2)score+=1;
                }
            }
            return score;
        };
        labels.sort((a,b)=>a.priority-b.priority);
        for(const label of labels){
            ctx.font=label.priority===0?"bold 12px system-ui,sans-serif":"bold 11px system-ui,sans-serif";
            const width=Math.ceil(ctx.measureText(label.text).width)+16;
            const height=22;
            const offsets=[
                [0,-27],[0,27],[width/2+19,0],[-width/2-19,0],
                [width/2+12,-26],[-width/2-12,-26],
                [width/2+12,26],[-width/2-12,26],
                [0,-47],[0,47],
            ];
            let selected:Rect|null=null,best=Infinity;
            for(const [dx,dy] of offsets){
                const left=label.x+dx-width/2,top=label.y+dy-height/2;
                const rect={left,right:left+width,top,bottom:top+height};
                const offscreen=Math.max(0,8-rect.left)+Math.max(0,rect.right-(w-8))+
                    Math.max(0,8-rect.top)+Math.max(0,rect.bottom-(h-8));
                let overlap=occupied.reduce((sum,box)=>sum+intersects(rect,box),0);
                for(const marker of markerCenters){
                    const markerBox={left:marker.x-8,right:marker.x+8,
                        top:marker.y-8,bottom:marker.y+8};
                    overlap+=intersects(rect,markerBox);
                }
                const score=offscreen*1000+overlap*14+
                    collidesWithLine(rect)*25+Math.hypot(dx,dy)*0.15;
                if(score<best){best=score;selected=rect;}
            }
            if(!selected)continue;
            occupied.push(selected);
            ctx.beginPath();
            ctx.roundRect(selected.left,selected.top,width,height,6);
            ctx.fillStyle="rgba(11,29,42,0.97)";
            ctx.fill();
            ctx.lineWidth=1;
            ctx.strokeStyle=label.priority===0?label.color:"rgba(255,255,255,0.25)";
            ctx.stroke();
            ctx.fillStyle=label.color;
            ctx.textBaseline="middle";
            ctx.textAlign="center";
            ctx.fillText(label.text,(selected.left+selected.right)/2,
                (selected.top+selected.bottom)/2);
        }
        ctx.textBaseline="alphabetic";
        if(hover){
            ctx.font="12px system-ui,sans-serif";
            ctx.textAlign="left";
            ctx.fillStyle="rgba(11,27,41,0.98)";
            ctx.beginPath();
            ctx.roundRect(hoverBox.left,hoverBox.top,hoverWidth,33,7);
            ctx.fill();
            ctx.strokeStyle="rgba(255,255,255,0.35)";
            ctx.stroke();
            ctx.fillStyle="#ffffff";
            ctx.fillText(hoverTitle,hoverBox.left+11,hoverBox.top+21,hoverWidth-20);
        }
    },[size,camera,project,layout,from,to,world,morph,projection,translucent,meridianStep,showGrid,showFullRoutes,hover,zoom,hoverLabels,lambert,flatPoint]);

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
                if(projection==="lambert")setLambertPan(p=>({x:p.x+dx,y:p.y+dy}));
                else setCamera(c=>({
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
                if(projection==="mercator"&&Math.abs(a.lon-b.lon)>180)continue;
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
            onHover?.((kind==="rhumb"?(hoverLabels?.loxodrome??"Loxodrome"):(hoverLabels?.orthodrome??"Orthodrome"))+
                ": "+formatAngle(routeBearing(kind,from,to,t))+" "+(hoverLabels?.trueTrack??"true track"));
        }else{
            setHover(null);onHover?.("");
        }
    };
    const onPointerUp=(event:PointerEvent<HTMLCanvasElement>)=>{
        const drag=dragRef.current;
        if(drag&&drag.id===event.pointerId){
            const p=cssPoint(event,event.currentTarget);
            if(!drag.moved&&picking){
                const selected=unproject(p.x,p.y);
                if(selected)onPick(selected);
            }
            dragRef.current=null;
        }
    };
    return <canvas
        className={"geographic-viewport"+(picking?" geographic-viewport--picking":"")} ref={canvasRef} role="img"
        aria-label={"Interactive globe and map. Drag to rotate or pan; hover over a route to inspect its course. "+(picking?"Tap to set the selected point.":"Select A or B before tapping to place a point.")}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={()=>{dragRef.current=null;}}
        onPointerLeave={()=>{if(!dragRef.current){setHover(null);onHover?.("");}}}
    />;
}
