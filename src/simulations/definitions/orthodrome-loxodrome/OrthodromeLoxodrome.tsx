import {useMemo, useState} from "react";
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
        globe:"3D globe",mercator:"Mercator",lambert:"Lambert conformal conic",
        greatCircle:"Orthodrome · great circle",rhumb:"Loxodrome · rhumb line",
        from:"A · Start",to:"B · Destination",lat:"Latitude",lon:"Longitude",
        pickFrom:"Pick start",pickTo:"Pick destination",selected:"Selecting",
        instructions:"Drag to rotate or pan · Select A or B, then tap to place it · Hover over a route for its clockwise true track angle",
        distance:"Distance",saving:"Orthodrome saves",difference:"Difference",
        departure:"Initial true track",arrival:"Final true track",constant:"Constant true track",
        transparency:"Translucent Earth + great-circle plane",
        fullRoutes:"Show complete routes",
        continuation:"The great circle closes after 360°. The loxodrome is infinite; to keep the display legible, only up to one longitude revolution is shown in total, or less if the poles are reached first.",
        trueTrack:"true track",
        grid:"Latitude / longitude grid",step:"Meridians every",zoom:"Zoom",
        chooseRoute:"Example route",custom:"Custom",swap:"Swap A ↔ B",
        note:"Spherical Earth (mean radius 6,371.0088 km); distances are in NM and km. Tracks are measured clockwise from true north (0–360°). Mercator makes loxodromes straight; Lambert conformal conic makes great circles approximately straight in suitable regions, but not perfectly. The shortest great-circle arc is non-unique for antipodal points.",
        inspect:"Hover over a route to inspect its clockwise true track from north.",
        warning:"Endpoints are nearly identical or antipodal; the great-circle direction may be ambiguous.",
    },
    da:{
        title:"Ortodromer og loksodromer",
        subtitle:"Sammenlign den korteste vej på kuglen med en rute med konstant retvisende kurs.",
        globe:"3D-globus",mercator:"Mercator",lambert:"Lambert konform konisk",
        greatCircle:"Ortodrom · storcirkel",rhumb:"Loksodrom · kompaslinje",
        from:"A · Start",to:"B · Slutpunkt",lat:"Breddegrad",lon:"Længdegrad",
        pickFrom:"Vælg start",pickTo:"Vælg slutpunkt",selected:"Vælger",
        instructions:"Træk for at dreje eller flytte · Vælg A eller B, og tryk for at placere punktet · Hold musen over en rute for at se retvisende vinkel med uret fra nord",
        distance:"Distance",saving:"Ortodromen sparer",difference:"Forskel",
        departure:"Start-retvisende track",arrival:"Slut-retvisende track",constant:"Konstant retvisende track",
        transparency:"Gennemsigtig jord + storcirkelplan",
        fullRoutes:"Vis hele ruterne",
        continuation:"Storcirklen slutter sig efter 360°. Loksodromen er uendelig; for at undgå et virvar af linjer vises højst én samlet omdrejning i længdegrad, eller mindre, hvis polerne nås først.",
        trueTrack:"retvisende track",
        grid:"Bredde- og længdegrader",step:"Meridianer for hver",zoom:"Zoom",
        chooseRoute:"Eksempelrute",custom:"Egen rute",swap:"Byt A ↔ B",
        note:"Kugleformet jord (middelradius 6.371,0088 km); afstande er i NM og km. Trackvinkler måles med uret fra retvisende nord (0–360°). Mercator viser loksodromer som rette linjer, mens Lambert konform konisk viser storcirkler omtrent rette over passende områder – ikke helt præcist. Antipodale punkter har ingen entydig korteste storcirkel.",
        inspect:"Hold musen over en rute for at se retvisende trackvinkel fra nord med uret.",
        warning:"Punkterne er næsten ens eller antipodale; ortodromens retning kan være ubestemt.",
    },
} as const;
type Side="from"|"to";
export default function OrthodromeLoxodrome() {
    const {language}=useLanguage();
    const t=strings[language==="da"?"da":"en"];
    const hoverLabels=useMemo(()=>({
        orthodrome:language==="da"?"Ortodrom":"Orthodrome",
        loxodrome:language==="da"?"Loksodrom":"Loxodrome",
        trueTrack:t.trueTrack,
    }),[language,t]);
    const [from,setFrom]=useState<GeoPoint>(PRESETS[0].from);
    const [to,setTo]=useState<GeoPoint>(PRESETS[0].to);
    const [selected,setSelected]=useState<Side|null>(null);
    const [projection,setProjection]=useState<MapProjection>("globe");
    const [translucent,setTranslucent]=useState(false);
    const [showFullRoutes,setShowFullRoutes]=useState(false);
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
        if(selected===null)return;
        if(selected==="from")setFrom(p);
        else setTo(p);
        setSelected(null);
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
        setSelected(null);
    };
    const choosePreset=(value:string)=>{
        setPreset(value);
        const place=PRESETS[Number(value)];
        if(!place)return;
        setFrom(place.from);setTo(place.to);
        setSelected(null);
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
                ["globe",t.globe],["mercator",t.mercator],["lambert",t.lambert],
            ] as const).map(([id,label])=>
                <button type="button" key={id} className={projection===id?"is-active":""}
                    aria-pressed={projection===id} onClick={()=>setProjection(id)}>{label}</button>
            )}
        </div>
        <div className="orthodrome-lab__stage">
            <GeographicViewport from={from} to={to} projection={projection}
                translucent={translucent} showGrid={showGrid}
                showFullRoutes={showFullRoutes} picking={selected!==null}
                hoverLabels={hoverLabels}
                meridianStep={meridianStep} zoom={zoom} focus={focus}
                onPick={choosePoint} onHover={setHovered} />
            <div className="orthodrome-lab__stage-legend">
                <span>● A</span><span>● B</span>
                {selected!==null&&<span>{t.selected}: {selected==="from"?"A":"B"}</span>}
            </div>
        </div>
        <div className="orthodrome-lab__hint" role="status">
            {hovered||t.instructions}
        </div>
        <div className="orthodrome-lab__options">
            <label><input type="checkbox" checked={showFullRoutes} onChange={e=>setShowFullRoutes(e.currentTarget.checked)}/>{t.fullRoutes}</label>
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
                    onClick={()=>setSelected(current=>current==="from"?null:"from")}>{t.pickFrom}</button>
                <button type="button" aria-pressed={selected==="to"}
                    className={selected==="to"?"is-active":""}
                    onClick={()=>setSelected(current=>current==="to"?null:"to")}>{t.pickTo}</button>
            </div>
            <button type="button" onClick={()=>{
                setFrom(to);setTo(from);setPreset("custom");setSelected(null);
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
                <small>{nf(gc*1.852,1)} km</small>
                <small>{t.departure}: {heading(greatCircleBearing(from,to,0))}</small>
                <small>{t.arrival}: {heading(greatCircleBearing(from,to,1))}</small>
            </div>
            <div className="orthodrome-lab__metric">
                <span>{t.rhumb}</span>
                <strong>{nf(rhumb,1)} NM</strong>
                <small>{nf(rhumb*1.852,1)} km</small>
                <small>{t.constant}: {heading(initialRhumbBearing(from,to))}</small>
            </div>
            <div className="orthodrome-lab__metric orthodrome-lab__metric--saving">
                <span>{t.saving}</span>
                <strong>{nf(saved,1)} NM</strong>
                <small>{nf(saved*1.852,1)} km</small>
                <small>{nf(percentage,2)}% · {t.difference}</small>
            </div>
        </div>

        {showFullRoutes&&<p className="orthodrome-lab__footnote">{t.continuation}</p>}
        {ambiguous&&<p className="orthodrome-lab__warning">{t.warning}</p>}
        <p className="orthodrome-lab__footnote">{t.note}</p>
    </section>;
}
