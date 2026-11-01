import {useState} from "react";
import {useLanguage} from "../../../app/LanguageContext";
import GeographicViewport from "../../runtime/geography/GeographicViewport";
import type {MapProjection} from "../../runtime/geography/GeographicViewport";
import {
    clamp, greatCircleDistanceNm, greatCirclePoint, greatCircleBearing,
    initialRhumbBearing, rhumbDistanceNm, wrapLon,
} from "../../runtime/geography/sphericalNavigation";
import type {GeoPoint} from "../../runtime/geography/sphericalNavigation";
import "./orthodrome-loxodrome.css";

type Destination = {label:string;from:GeoPoint;to:GeoPoint};
const PRESETS:Destination[]=[
    {label:"Copenhagen → New York",from:{lat:55.676,lon:12.568},to:{lat:40.713,lon:-74.006}},
    {label:"Tokyo → Los Angeles",from:{lat:35.676,lon:139.65},to:{lat:34.052,lon:-118.244}},
    {label:"Cape Town → Sydney",from:{lat:-33.925,lon:18.424},to:{lat:-33.869,lon:151.209}},
];
const strings={
    en:{
        title:"Great circles & rhumb lines",
        subtitle:"Compare the shortest spherical route with a constant-bearing route.",
        globe:"3D globe",mercator:"Mercator",equirectangular:"Equirectangular",
        greatCircle:"Orthodrome · great circle",rhumb:"Loxodrome · rhumb line",
        from:"A · Start",to:"B · Destination",lat:"Latitude",lon:"Longitude",
        pickFrom:"Pick start",pickTo:"Pick destination",selected:"Selecting",
        instructions:"Drag to rotate or pan · Tap to set the selected point · Hover over a route to inspect its angle",
        distance:"Distance",saving:"Orthodrome saves",difference:"Difference",
        departure:"Initial true track",arrival:"Final true track",constant:"Constant true track",
        transparency:"Translucent Earth + great-circle plane",
        grid:"Latitude / longitude grid",step:"Meridians every",zoom:"Zoom",
        chooseRoute:"Example route",custom:"Custom",swap:"Swap A ↔ B",
        note:"Spherical Earth (mean radius 6,371.0088 km); distances are in nautical miles. Angles are measured on the sphere. Mercator preserves local angles and makes rhumb lines straight. The shortest great-circle arc is undefined uniquely for antipodal points.",
        inspect:"Hover or tap a track to inspect its bearing and its angle with a parallel.",
        warning:"Endpoints are nearly identical or antipodal; the great-circle direction may be ambiguous.",
    },
    da:{
        title:"Ortodromer og loksodromer",
        subtitle:"Sammenlign den korteste vej på kuglen med en rute med konstant retvisende kurs.",
        globe:"3D-globus",mercator:"Mercator",equirectangular:"Platte carrée",
        greatCircle:"Ortodrom · storcirkel",rhumb:"Loksodrom · kompaslinje",
        from:"A · Start",to:"B · Slutpunkt",lat:"Breddegrad",lon:"Længdegrad",
        pickFrom:"Vælg start",pickTo:"Vælg slutpunkt",selected:"Vælger",
        instructions:"Træk for at dreje eller flytte · Tryk for at placere et punkt · Hold musen over en rute for at se vinkler",
        distance:"Distance",saving:"Ortodromen sparer",difference:"Forskel",
        departure:"Start-retvisende track",arrival:"Slut-retvisende track",constant:"Konstant retvisende track",
        transparency:"Gennemsigtig jord + storcirkelplan",
        grid:"Bredde- og længdegrader",step:"Meridianer for hver",zoom:"Zoom",
        chooseRoute:"Eksempelrute",custom:"Egen rute",swap:"Byt A ↔ B",
        note:"Kugleformet jord (middelradius 6.371,0088 km); afstande er i sømil (NM). Vinklerne måles på kuglen. Mercator er vinkelbevarende og viser loksodromer som rette linjer. Mellem antipodale punkter findes ingen entydig korteste storcirkel.",
        inspect:"Hold musen over en rute for at se trackvinklen og vinklen med breddegraden.",
        warning:"Punkterne er næsten ens eller antipodale; ortodromens retning kan være ubestemt.",
    },
} as const;
type Side="from"|"to";
export default function OrthodromeLoxodrome() {
    const {language}=useLanguage();
    const t=strings[language==="da"?"da":"en"];
    const [from,setFrom]=useState<GeoPoint>(PRESETS[0].from);
    const [to,setTo]=useState<GeoPoint>(PRESETS[0].to);
    const [selected,setSelected]=useState<Side>("to");
    const [projection,setProjection]=useState<MapProjection>("globe");
    const [translucent,setTranslucent]=useState(false);
    const [showGrid,setShowGrid]=useState(true);
    const [meridianStep,setMeridianStep]=useState(30);
    const [zoom,setZoom]=useState(1);
    const [focus,setFocus]=useState<GeoPoint|null>(null);
    const [hovered,setHovered]=useState("");
    const [preset,setPreset]=useState("0");
    const nf=(n:number,decimals=0)=>n.toLocaleString(language==="da"?"da-DK":"en-US",{
        minimumFractionDigits:decimals,maximumFractionDigits:decimals,
    });
    const choosePoint=(p:GeoPoint)=>{
        if(selected==="from"){setFrom(p);setSelected("to");}
        else setTo(p);
        setPreset("custom");
    };
    const update=(which:Side,axis:keyof GeoPoint,value:string)=>{
        if(value.trim()==="")return;
        const raw=Number(value);
        if(!Number.isFinite(raw))return;
        const normalized=axis==="lat"?clamp(raw,-90,90):wrapLon(raw);
        const setter=which==="from"?setFrom:setTo;
        setter(current=>({...current,[axis]:normalized}));
        setPreset("custom");
    };
    const choosePreset=(value:string)=>{
        setPreset(value);
        const place=PRESETS[Number(value)];
        if(!place)return;
        setFrom(place.from);setTo(place.to);
        setFocus(greatCirclePoint(place.from,place.to,0.5));
    };
    const gc=greatCircleDistanceNm(from,to);
    const rhumb=rhumbDistanceNm(from,to);
    const saved=Math.max(0,rhumb-gc);
    const percentage=rhumb>1e-8?100*saved/rhumb:0;
    const ambiguous=gc<0.01||Math.abs(gc-Math.PI*6371.0088/1.852)<0.01;
    const heading=(n:number)=>ambiguous?"—":nf(n,1)+"°";
    const pointEditor=(which:Side,p:GeoPoint)=>(
        <fieldset className="orthodrome-points__field" key={which}>
            <legend>{which==="from"?t.from:t.to}</legend>
            <div className="orthodrome-points__coords">
                <label>{t.lat}
                    <input type="number" min="-90" max="90" step="0.1"
                        value={Number(p.lat.toFixed(4))}
                        onChange={e=>update(which,"lat",e.currentTarget.value)} />
                </label>
                <label>{t.lon}
                    <input type="number" min="-180" max="180" step="0.1"
                        value={Number(p.lon.toFixed(4))}
                        onChange={e=>update(which,"lon",e.currentTarget.value)} />
                </label>
            </div>
        </fieldset>
    );
    return <section className="orthodrome-lab simulation-player" aria-label={t.title}>
        <div className="orthodrome-lab__intro">
            <div><h2>{t.title}</h2><p>{t.subtitle}</p></div>
            <div className="orthodrome-lab__legend">
                <span><i className="orthodrome-lab__swatch orthodrome-lab__swatch--gc"/>{t.greatCircle}</span>
                <span><i className="orthodrome-lab__swatch orthodrome-lab__swatch--rhumb"/>{t.rhumb}</span>
            </div>
        </div>
        <div className="orthodrome-lab__tabs" role="group" aria-label="Projection">
            {([
                ["globe",t.globe],["mercator",t.mercator],["equirectangular",t.equirectangular],
            ] as const).map(([id,label])=>
                <button type="button" key={id} className={projection===id?"is-active":""}
                    aria-pressed={projection===id} onClick={()=>setProjection(id)}>{label}</button>
            )}
        </div>
        <div className="orthodrome-lab__stage">
            <GeographicViewport from={from} to={to} projection={projection}
                translucent={translucent} showGrid={showGrid}
                meridianStep={meridianStep} zoom={zoom} focus={focus}
                onPick={choosePoint} onHover={setHovered} />
            <div className="orthodrome-lab__stage-legend">
                <span>● A</span><span>● B</span>
                <span>{t.selected}: {selected==="from"?"A":"B"}</span>
            </div>
        </div>
        <div className="orthodrome-lab__hint" role="status">
            {hovered||t.instructions}
        </div>
        <div className="orthodrome-lab__select">
            <label>{t.chooseRoute}
                <select value={preset} onChange={e=>choosePreset(e.currentTarget.value)}>
                    {PRESETS.map((item,i)=><option key={i} value={i}>{item.label}</option>)}
                    {preset==="custom"&&<option value="custom">{t.custom}</option>}
                </select>
            </label>
            <div className="orthodrome-lab__pick" role="group" aria-label="Choose point to place">
                <button type="button" aria-pressed={selected==="from"}
                    className={selected==="from"?"is-active":""}
                    onClick={()=>setSelected("from")}>{t.pickFrom}</button>
                <button type="button" aria-pressed={selected==="to"}
                    className={selected==="to"?"is-active":""}
                    onClick={()=>setSelected("to")}>{t.pickTo}</button>
            </div>
            <button type="button" onClick={()=>{
                setFrom(to);setTo(from);setPreset("custom");
            }}>{t.swap}</button>
        </div>
        <div className="orthodrome-points">
            {pointEditor("from",from)}
            {pointEditor("to",to)}
        </div>
        <div className="orthodrome-lab__statistics">
            <div className="orthodrome-lab__metric">
                <span>{t.greatCircle}</span>
                <strong>{nf(gc,1)} NM</strong>
                <small>{t.departure}: {heading(greatCircleBearing(from,to,0))}</small>
                <small>{t.arrival}: {heading(greatCircleBearing(from,to,1))}</small>
            </div>
            <div className="orthodrome-lab__metric">
                <span>{t.rhumb}</span>
                <strong>{nf(rhumb,1)} NM</strong>
                <small>{t.constant}: {heading(initialRhumbBearing(from,to))}</small>
            </div>
            <div className="orthodrome-lab__metric orthodrome-lab__metric--saving">
                <span>{t.saving}</span>
                <strong>{nf(saved,1)} NM</strong>
                <small>{nf(percentage,2)}% · {t.difference}</small>
            </div>
        </div>
        <div className="orthodrome-lab__options">
            <label><input type="checkbox" checked={translucent} onChange={e=>setTranslucent(e.currentTarget.checked)}/>{t.transparency}</label>
            <label><input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.currentTarget.checked)}/>{t.grid}</label>
            <label>{t.step}
                <select value={meridianStep} onChange={e=>setMeridianStep(Number(e.currentTarget.value))}>
                    <option value={15}>15°</option><option value={30}>30°</option>
                    <option value={45}>45°</option><option value={90}>90°</option>
                </select>
            </label>
            <label>{t.zoom}
                <input type="range" min="0.75" max="1.5" step="0.05"
                    value={zoom} onChange={e=>setZoom(Number(e.currentTarget.value))}/>
            </label>
        </div>
        {ambiguous&&<p className="orthodrome-lab__warning">{t.warning}</p>}
        <p className="orthodrome-lab__footnote">{t.note}</p>
    </section>;
}
