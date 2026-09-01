import { useState, useEffect } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://wgyxwbrjrkyudkdyrqpj.supabase.co";
const SUPABASE_KEY = "sb_publishable_iiy75P-b6qe_2KLEN_M0Kg_CgdZkkkH";

async function db(method, table, data = null, filter = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "return=representation" : "return=representation",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) { console.error("DB error:", res.status, await res.text()); return null; }
  try { return await res.json(); } catch { return null; }
}

// ─── EMAILJS ──────────────────────────────────────────────────────────────────
async function sendEmail(vonName, vonRolle, meldungArt, anName, nachricht, betreff, toEmail="", genehmigungLink="") {
  const genehmigungDisplay = genehmigungLink ? "block" : "none";
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_gxg015l",
        template_id: "template_av4scen",
        user_id: "LNWETx8iRbXRi2zvl",
        template_params: { betreff, von_name: vonName, von_rolle: vonRolle, meldung_art: meldungArt, an_name: anName, nachricht, to_email: toEmail, genehmigung_link: genehmigungLink, genehmigung_display: genehmigungDisplay }
      })
    });
    console.log("Email status:", response.status);
  } catch(e) { console.error("Email error:", e); }
}
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function roleColor(role) {
  return { GF:"#dc2626", Bauleiter:"#d97706", Büro:"#ec4899", Lagerist:"#7c3aed", Vorarbeiter:"#059669", Monteur:"#3b82f6", Azubi:"#6b7280" }[role] || "#6b7280";
}
function getInitials(name) {
  const p = name.split(", ");
  return ((p[1]?.[0]||"")+(p[0]?.[0]||"")).toUpperCase();
}
function dateInRange(ds,from,to){return ds>=from&&ds<=to;}
function countWorkdays(from, to) {
  let count = 0; let d = new Date(from); const end = new Date(to);
  while(d<=end){const day=d.getDay();if(day!==0&&day!==6)count++;d.setDate(d.getDate()+1);}
  return count;
}
function formatDate(ds) {
  if(!ds) return "";
  const [y,m,d] = ds.split("-");
  return `${d}.${m}.${y}`;
}

const APPROVAL_ROLES_TORSTEN = ["Monteur","Vorarbeiter","Lagerist","Azubi"];
const APPROVAL_ROLES_RALF = ["GF","Büro","Bauleiter"];
const ROLES = ["GF","Bauleiter","Büro","Lagerist","Vorarbeiter","Monteur","Azubi"];

const DEFAULT_RULES = {
  maxLkwGross:3, maxLkwKlein:1, maxVorarbeiter:2,
  blockedMonths:[11], blockedRoles:["Monteur","Lagerist","Azubi"]
};

const DEFAULT_MELDUNGEN = [
  {key:"arbeitsmittel",icon:"🔧",label:"Arbeitsmittel",desc:"Fehlendes / defektes Material",recipientIds:[7],multiSelect:false},
  {key:"gespraech",icon:"💬",label:"Gespräch",desc:"Gesprächswunsch",recipientIds:[1,2,3,4,5],multiSelect:true,coordinatorId:8},
  {key:"krank",icon:"🤒",label:"Krankmeldung",desc:"Krankheit melden",recipientIds:[4,3,6],multiSelect:false},
];

async function loadRulesFromDb(){
  const rows=await db("GET","urlaubsregeln",null,"?id=eq.1&select=*");
  if(rows&&rows[0]){
    const r=rows[0];
    return {maxLkwGross:r.max_lkw_gross,maxLkwKlein:r.max_lkw_klein,maxVorarbeiter:r.max_vorarbeiter,blockedMonths:r.blocked_months||[],blockedRoles:r.blocked_roles||[]};
  }
  return DEFAULT_RULES;
}
async function saveRulesToDb(r){
  await db("PATCH","urlaubsregeln",{max_lkw_gross:r.maxLkwGross,max_lkw_klein:r.maxLkwKlein,max_vorarbeiter:r.maxVorarbeiter,blocked_months:r.blockedMonths,blocked_roles:r.blockedRoles},"?id=eq.1");
}
// ─── CONFLICT CHECK ───────────────────────────────────────────────────────────
function checkConflict(from,to,emp,bookedVacations,rules){
  if(!from||!to||from>to) return null;
  const maxDate=`${new Date().getFullYear()+1}-12-31`;
  if(to>maxDate) return {msg:`Urlaub kann nur bis zum 31.12.${new Date().getFullYear()+1} beantragt werden.`};
  let d=new Date(from); const end=new Date(to);
  while(d<=end){
    if((rules.blockedMonths||[]).includes(d.getMonth())){
      const br=rules.blockedRoles||[];
      if(br.length===0||br.includes(emp.role)) return {msg:`Im ${d.toLocaleDateString("de-DE",{month:"long"})} ist für deine Gruppe kein Urlaub möglich.`};
    }
    d.setDate(d.getDate()+1);
  }
  const requestedDays=countWorkdays(from,to);
  function maxOv(fn){let m=0;let dd=new Date(from);while(dd<=new Date(to)){const ds=dd.toISOString().split("T")[0];const c=bookedVacations.filter(v=>v.mitarbeiter_id!==emp.id&&fn(v)&&dateInRange(ds,v.von,v.bis)).length;if(c>m)m=c;dd.setDate(dd.getDate()+1);}return m;}
  if(emp.lkw_gross&&maxOv(v=>v.lkw_gross)>=rules.maxLkwGross) return {msg:`Bereits ${rules.maxLkwGross} LKW-Groß-Fahrer im Urlaub – du wärst der ${rules.maxLkwGross+1}. Bitte wähle einen anderen Zeitraum.`};
  if(emp.lkw_klein&&!emp.lkw_gross&&maxOv(v=>v.lkw_klein&&!v.lkw_gross)>=rules.maxLkwKlein) return {msg:`Bereits ${rules.maxLkwKlein} LKW-Klein-Fahrer im Urlaub.`};
  if(emp.role==="Vorarbeiter"&&maxOv(v=>v.role==="Vorarbeiter")>=rules.maxVorarbeiter) return {msg:`Bereits ${rules.maxVorarbeiter} Vorarbeiter im Urlaub.`};
  return null;
}

// ─── FARBEN & STYLES ──────────────────────────────────────────────────────────
const C = {
  bg:"#f3f4f6", white:"#ffffff", border:"#e5e7eb", borderDark:"#d1d5db",
  text:"#111827", textMid:"#374151", textLight:"#6b7280",
  red:"#dc2626", redLight:"#fef2f2", redBorder:"#fca5a5",
  green:"#16a34a", greenLight:"#f0fdf4", greenBorder:"#86efac",
  amber:"#d97706", amberLight:"#fffbeb",
};
const S = {
  page:{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:C.text,display:"flex",flexDirection:"column"},
  card:{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"},
  input:{width:"100%",background:C.white,border:`1px solid ${C.borderDark}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
  btn:{background:`linear-gradient(135deg,${C.red},#b91c1c)`,border:"none",borderRadius:10,padding:"13px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%",transition:"all 0.15s"},
  btnGhost:{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",color:C.textLight,fontSize:12,cursor:"pointer"},
  back:{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13,padding:"0 0 14px 0",display:"flex",alignItems:"center",gap:4},
  label:{fontSize:10,color:C.textLight,marginBottom:5,fontWeight:700,letterSpacing:"0.5px",display:"block",textTransform:"uppercase"},
};

function Logo({size=1}){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2*size}}>
      <svg width={80*size} height={55*size} viewBox="0 0 100 68">
        <line x1="5" y1="30" x2="45" y2="10" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
        <line x1="45" y1="10" x2="95" y2="30" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
        <text x="52" y="62" textAnchor="middle" style={{fontSize:34,fontWeight:900,fill:"#dc2626",fontFamily:"Arial Black,sans-serif"}}>KG</text>
        <line x1="3" y1="66" x2="97" y2="66" stroke="#111" strokeWidth="4"/>
      </svg>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:13*size,fontWeight:900,color:C.red,letterSpacing:"-0.3px",lineHeight:1.2}}>KLUKAS-GERÜSTE</div>
        <div style={{fontSize:7*size,color:C.textLight,letterSpacing:"0.8px"}}>GmbH · MITARBEITERPORTAL</div>
      </div>
    </div>
  );
}

function Avatar({emp,size=36}){
  const c=roleColor(emp.role);
  const initials=((emp.first_name?.[0]||"")+(emp.name?.split(", ")[0]?.[0]||"")).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:c+"18",border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:700,color:c,flexShrink:0}}>{initials}</div>;
}

// ─── GENEHMIGUNG SEITE ────────────────────────────────────────────────────────
function ApprovalPage({antragId}){
  const [antrag,setAntrag]=useState(null);
  const [employees,setEmployees]=useState([]);
  const [loading,setLoading]=useState(true);
  const [done,setDone]=useState(null);
  const [processing,setProcessing]=useState(false);

  useEffect(()=>{
    async function load(){
      const [a,e]=await Promise.all([
        db("GET","urlaubsantraege",null,`?id=eq.${antragId}&select=*`),
        db("GET","mitarbeiter_public",null,"?select=*")
      ]);
      if(a&&a.length>0) setAntrag(a[0]);
      if(e) setEmployees(e);
      setLoading(false);
    }
    load();
  },[antragId]);

async function decide(approved){
    if(processing) return;
    setProcessing(true);
    const status=approved?"genehmigt":"abgelehnt";
    await db("PATCH","urlaubsantraege",{status,entschieden_am:new Date().toISOString()},`?id=eq.${antragId}`);
    const emp=employees.find(e=>e.id===antrag.mitarbeiter_id);
    const empEmail=emp?.email||"";

    if(approved){
      // Urlaub als gebucht speichern
      await db("POST","gebuchte_urlaube",{
        mitarbeiter_id:antrag.mitarbeiter_id, name:antrag.mitarbeiter_name,
        role:antrag.mitarbeiter_rolle, lkw_gross:emp?.lkw_gross||false,
        lkw_klein:emp?.lkw_klein||false, von:antrag.von, bis:antrag.bis
      });
      // Info an Mitarbeiter
      await sendEmail("Klukas-Gerüste","","Urlaubsgenehmigung",antrag.mitarbeiter_name,
        `Dein Urlaubsantrag vom ${formatDate(antrag.von)} bis ${formatDate(antrag.bis)} (${antrag.arbeitstage} Arbeitstage) wurde GENEHMIGT.`,
        `✅ Urlaub genehmigt: ${antrag.mitarbeiter_name}`,empEmail,"");
      // Info an Elke (ohne Button)
      await sendEmail("Klukas-Gerüste","","Urlaubsinfo","Elke Anders",
        `Zur Info: ${antrag.mitarbeiter_name} (${antrag.mitarbeiter_rolle}) hat Urlaub vom ${formatDate(antrag.von)} bis ${formatDate(antrag.bis)} – genehmigt.`,
        `ℹ️ Urlaub genehmigt: ${antrag.mitarbeiter_name}`,"elke.anders@klukas-gerueste.de","");
    } else {
      await sendEmail("Klukas-Gerüste","","Urlaubsablehnung",antrag.mitarbeiter_name,
        `Dein Urlaubsantrag vom ${formatDate(antrag.von)} bis ${formatDate(antrag.bis)} wurde ABGELEHNT. Bitte wende dich an deinen Vorgesetzten.`,
        `❌ Urlaub abgelehnt: ${antrag.mitarbeiter_name}`,empEmail,"");
    }
    setDone(approved);
    setProcessing(false);
  }

  if(loading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}><div style={{fontSize:14,color:C.textLight}}>Lädt...</div></div>;
  if(!antrag) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}><Logo size={1.2}/><div style={{marginTop:32,fontSize:16,color:C.red,fontWeight:700}}>Antrag nicht gefunden</div></div>;
  if(antrag.status==="genehmigt"||antrag.status==="abgelehnt") return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}><Logo size={1.2}/><div style={{marginTop:32,textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>{antrag.status==="genehmigt"?"✅":"❌"}</div><div style={{fontSize:16,fontWeight:700,color:C.text}}>Dieser Antrag wurde bereits {antrag.status}.</div></div></div>;
  if(done!==null) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}><Logo size={1.2}/><div style={{marginTop:32,textAlign:"center"}}><div style={{fontSize:50,marginBottom:12}}>{done?"✅":"❌"}</div><div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>{done?"Urlaub genehmigt!":"Urlaub abgelehnt"}</div><div style={{fontSize:13,color:C.textMid}}>{antrag.mitarbeiter_name} wurde informiert.{done&&" Elke Anders wurde ebenfalls informiert."}</div></div></div>;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",padding:24,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{marginBottom:28}}><Logo size={1.2}/></div>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Urlaubsantrag</div>
        <div style={{fontSize:12,color:C.textLight,marginBottom:20}}>Bitte genehmige oder lehne den Antrag ab</div>
        <div style={{...S.card,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:C.red+"18",border:`2px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C.red,flexShrink:0}}>
              {antrag.mitarbeiter_name.split(", ").map(p=>p[0]).join("")}
            </div>
            <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{antrag.mitarbeiter_name}</div><div style={{fontSize:11,color:roleColor(antrag.mitarbeiter_rolle)}}>{antrag.mitarbeiter_rolle}</div></div>
          </div>
          {[["📅 Zeitraum",`${formatDate(antrag.von)} – ${formatDate(antrag.bis)}`],["⏱ Arbeitstage",`${antrag.arbeitstage} Tage`],["📝 Status","Ausstehend"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:12,color:C.textLight}}>{l}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={()=>decide(false)} disabled={processing} style={{background:processing?"#e5e7eb":C.white,border:`2px solid ${C.red}`,borderRadius:10,padding:"14px",color:C.red,fontWeight:700,fontSize:14,cursor:processing?"not-allowed":"pointer"}}>❌ Ablehnen</button>
          <button onClick={()=>decide(true)} disabled={processing} style={{background:processing?"#e5e7eb":`linear-gradient(135deg,${C.green},#15803d)`,border:"none",borderRadius:10,padding:"14px",color:"#fff",fontWeight:700,fontSize:14,cursor:processing?"not-allowed":"pointer"}}>✅ Genehmigen</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({employees,onLogin}){
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const filtered=employees.filter(e=>search.length>1&&e.name.toLowerCase().includes(search.toLowerCase()));
  async function doLogin(){
    setErr("");
    try{
      const res=await fetch(`${SUPABASE_URL}/functions/v1/login`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
        body:JSON.stringify({id:sel.id,password:pw})
      });
      if(!res.ok){setErr("Falsches Passwort. Bitte erneut versuchen.");return;}
      const data=await res.json();
      onLogin(data);
    }catch(e){setErr("Verbindungsfehler. Bitte erneut versuchen.");}
  }
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{marginBottom:32}}><Logo size={1.3}/></div>
      <div style={{width:"100%",maxWidth:380,...S.card,padding:28}}>
        {!sel?(
          <>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4,color:C.text}}>Anmelden</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Namen eingeben zum Suchen</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="z.B. Müller..." autoFocus style={S.input}/>
            {filtered.length>0&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
              {filtered.map(emp=>(
                <button key={emp.id} onClick={()=>{setSel(emp);setPw("");setErr("");}}
                  style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor=C.red} onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
                  <Avatar emp={emp} size={34}/>
                  <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{emp.name}</div><div style={{fontSize:11,color:roleColor(emp.role)}}>{emp.role}</div></div>
                </button>
              ))}
            </div>}
            {search.length>1&&filtered.length===0&&<div style={{marginTop:8,fontSize:12,color:C.textLight,textAlign:"center"}}>Kein Mitarbeiter gefunden</div>}
          </>
        ):(
          <>
            <button onClick={()=>setSel(null)} style={S.back}>‹ Zurück</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,background:C.bg,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <Avatar emp={sel} size={38}/>
              <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{sel.name}</div><div style={{fontSize:11,color:roleColor(sel.role)}}>{sel.role}</div></div>
            </div>
            <label style={S.label}>Passwort</label>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus
              style={{...S.input,border:`1px solid ${err?C.red:C.borderDark}`,letterSpacing:"2px"}}/>
            {err&&<div style={{fontSize:11,color:C.red,marginTop:6}}>{err}</div>}
            <button onClick={doLogin} style={{...S.btn,marginTop:12,background:pw?`linear-gradient(135deg,${C.red},#b91c1c)`:"#e5e7eb",color:pw?"#fff":C.textLight,cursor:pw?"pointer":"not-allowed"}}>Anmelden ›</button>
          </>
        )}
      </div>
      <div style={{marginTop:16,fontSize:10,color:C.textLight}}>Wir helfen aufzubauen!</div>
    </div>
  );
}

// ─── KALENDER ─────────────────────────────────────────────────────────────────
function Calendar({year,month,onChangeMonth,vacFrom,vacTo,conflict,user,bookedVacations,rules,onDayClick}){
  const days=new Date(year,month+1,0).getDate();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const monthName=new Date(year,month).toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  function cell(n){
    const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
    const sel=vacFrom&&vacTo&&vacFrom<=ds&&ds<=vacTo;
    const isFrom=vacFrom===ds; const isTo=vacTo===ds;
    const busy=bookedVacations.some(v=>v.mitarbeiter_id!==user.id&&dateInRange(ds,v.von,v.bis));
    const blk=(rules.blockedMonths||[]).includes(new Date(ds).getMonth())&&(rules.blockedRoles||[]).includes(user.role);
    const sb=rules.summerBlock; const sum=sb&&ds>=sb.start&&ds<=sb.end;
    const isWeekend=new Date(ds).getDay()===0||new Date(ds).getDay()===6;
    if(sel&&conflict) return {bg:C.redLight,bd:`1.5px solid ${C.red}`,c:C.red,cursor:"pointer"};
    if(isFrom||isTo) return {bg:"#16a34a",bd:"1.5px solid #16a34a",c:"#fff",cursor:"pointer"};
    if(sel) return {bg:C.greenLight,bd:"1px solid #86efac",c:"#16a34a",cursor:"pointer"};
    if(blk) return {bg:C.redLight,bd:`1px solid ${C.border}`,c:"#fca5a5",cursor:"not-allowed"};
    if(sum) return {bg:"#fefce8",bd:`1px solid ${C.border}`,c:"#a16207",cursor:"pointer"};
    if(busy) return {bg:"#fffbeb",bd:"1px solid #fcd34d",c:C.textLight,cursor:"pointer"};
    if(isWeekend) return {bg:"#f9fafb",bd:`1px solid ${C.border}`,c:"#d1d5db",cursor:"default"};
    return {bg:"transparent",bd:`1px solid ${C.border}`,c:C.textLight,cursor:"pointer"};
  }
  return (
    <div style={{...S.card,padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <button onClick={()=>onChangeMonth(-1)} style={{background:"none",border:"none",color:C.red,fontSize:20,cursor:"pointer"}}>‹</button>
        <div style={{fontWeight:700,fontSize:13,color:C.text}}>{monthName}</div>
        <button onClick={()=>onChangeMonth(1)} style={{background:"none",border:"none",color:C.red,fontSize:20,cursor:"pointer"}}>›</button>
      </div>
      {vacFrom&&!vacTo&&(
        <div style={{fontSize:10,color:C.amber,textAlign:"center",marginBottom:6,fontWeight:600,background:C.amberLight,borderRadius:6,padding:"4px 8px"}}>
          ✓ Start: {formatDate(vacFrom)} – tippe jetzt den Endtag an
        </div>
      )}
      {vacFrom&&vacTo&&(
        <div style={{fontSize:10,color:C.green,textAlign:"center",marginBottom:6,fontWeight:600,background:C.greenLight,borderRadius:6,padding:"4px 8px"}}>
          ✓ {formatDate(vacFrom)} – {formatDate(vacTo)} ausgewählt
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=><div key={d} style={{fontSize:9,color:C.textLight,textAlign:"center",fontWeight:700}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i)=>{
          const n=i+1;
          const s=cell(n);
          const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
          const isWeekend=new Date(ds).getDay()===0||new Date(ds).getDay()===6;
          return (
            <div key={n}
              onClick={()=>!isWeekend&&onDayClick&&onDayClick(ds)}
              style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,fontSize:10,fontWeight:600,background:s.bg,border:s.bd,color:s.c,cursor:s.cursor,transition:"all 0.1s",userSelect:"none"}}>
              {n}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
        {[["#16a34a","Dein Antrag"],["#d97706","Belegt"],["#dc2626","Nicht möglich"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:C.textLight}}>
            <div style={{width:8,height:8,borderRadius:2,background:c+"22",border:`1px solid ${c}`}}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function EmpForm({emp:init,onSave,onCancel}){
  const [emp,setEmp]=useState({...init});
  const set=(k,v)=>setEmp(p=>({...p,[k]:v}));
  return (
    <div style={{background:C.bg,border:`1.5px solid ${C.redBorder}`,borderRadius:12,padding:14,marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:12}}>{emp.id?"Bearbeiten":"Neuer Mitarbeiter"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        {[["Name (Nachname, Vorname)","name"],["Rufname","first_name"],["E-Mail","email"],["Passwort","password"]].map(([l,k])=>(
          <div key={k}><label style={S.label}>{l}</label><input value={emp[k]||""} onChange={e=>set(k,e.target.value)} placeholder={k==="password"&&emp.id?"Leer lassen = unverändert":""} style={{...S.input,fontSize:11,padding:"7px 8px"}}/></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={S.label}>Rolle</label>
          <select value={emp.role||"Monteur"} onChange={e=>set("role",e.target.value)} style={{...S.input,fontSize:11,padding:"7px 8px"}}>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label style={S.label}>Urlaubstage</label>
          <input type="number" value={emp.urlaubstage||30} onChange={e=>set("urlaubstage",parseInt(e.target.value))} style={{...S.input,fontSize:11,padding:"7px 8px"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        {[["LKW Groß","lkw_gross"],["LKW Klein","lkw_klein"],["PKW","pkw"],["Admin","is_admin"]].map(([l,k])=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.textMid,cursor:"pointer"}}>
            <input type="checkbox" checked={!!emp[k]} onChange={e=>set(k,e.target.checked)} style={{accentColor:C.red}}/>{l}
          </label>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onSave(emp)} style={{...S.btn,flex:1,padding:"9px",fontSize:12}}>Speichern</button>
        <button onClick={onCancel} style={{...S.btnGhost,fontSize:12,padding:"9px 14px"}}>Abbrechen</button>
      </div>
    </div>
  );
}

function Admin({employees,setEmployees,rules,setRules,setView,meldungen,user}){
  const [tab,setTab]=useState("employees");
  const [editEmp,setEditEmp]=useState(null);
  const [newEmp,setNewEmp]=useState(null);
  const [localRules,setLocalRules]=useState({...rules});
  const [saved,setSaved]=useState(false);
  const [antraege,setAntraege]=useState([]);
  const [loading,setLoading]=useState(false);
  const [adminPw,setAdminPw]=useState("");
  const [unlocked,setUnlocked]=useState(false);
const [pwErr,setPwErr]=useState("");

  async function checkAdminPw(){
    const res=await fetch(`${SUPABASE_URL}/functions/v1/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
      body:JSON.stringify({id:user.id,password:adminPw})
    });
    if(!res.ok){ setPwErr("Falsches Passwort."); return; }
    const data=await res.json();
    if(!data.is_admin){ setPwErr("Kein Admin-Zugang."); return; }
    setUnlocked(true);
  }

  useEffect(()=>{
    if(tab==="antraege"){
      setLoading(true);
      db("GET","urlaubsantraege",null,"?order=erstellt_am.desc&select=*").then(r=>{setAntraege(r||[]);setLoading(false);});
    }
  },[tab]);

  if(!unlocked){
    return (
      <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:320,...S.card,padding:24}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:C.text}}>Admin-Bereich</div>
          <label style={S.label}>Dein Passwort zur Bestätigung</label>
        <input type="password" value={adminPw} onChange={e=>{setAdminPw(e.target.value);setPwErr("");}} onKeyDown={e=>e.key==="Enter"&&checkAdminPw()} style={S.input} autoFocus/>
          {pwErr&&<div style={{fontSize:11,color:C.red,marginTop:6}}>{pwErr}</div>}
          <button onClick={checkAdminPw} style={{...S.btn,marginTop:12}}>Bestätigen</button>
        </div>
      </div>
    );
  }

  async function saveEmp(emp){
    const isNew=!emp.id;
    const payload=isNew?{...emp,id:Math.max(...employees.map(e=>e.id))+1}:emp;
    const res=await fetch(`${SUPABASE_URL}/functions/v1/admin-write`,{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
      body:JSON.stringify({adminId:user.id,adminPassword:adminPw,action:"save",emp:payload,isNew})
    });
    if(!res.ok){ setUnlocked(false); setAdminPw(""); setPwErr("Passwort falsch oder keine Berechtigung – bitte erneut eingeben."); return; }
    const data=await res.json();
    const savedRow=Array.isArray(data)?data[0]:data;
    if(!savedRow){ setPwErr("Speichern fehlgeschlagen."); return; }
    if(isNew) setEmployees(prev=>[...prev,savedRow]);
    else setEmployees(prev=>prev.map(e=>e.id===emp.id?{...e,...savedRow}:e));
    setEditEmp(null);setNewEmp(null);
  }

  async function delEmp(id){
    if(!confirm("Mitarbeiter wirklich löschen?")) return;
    const res=await fetch(`${SUPABASE_URL}/functions/v1/admin-write`,{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
      body:JSON.stringify({adminId:user.id,adminPassword:adminPw,action:"delete",id})
    });
    if(!res.ok){ setUnlocked(false); setAdminPw(""); setPwErr("Passwort falsch oder keine Berechtigung – bitte erneut eingeben."); return; }
    setEmployees(prev=>prev.filter(e=>e.id!==id));
  }
  async function saveRulesLocal(){
    await saveRulesToDb(localRules);
    setRules(localRules);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div>
      <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
      <div style={{fontSize:18,fontWeight:800,marginBottom:2,color:C.text}}>⚙ Admin-Bereich</div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Änderungen gelten sofort auf allen Geräten</div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["employees","Mitarbeiter"],["rules","Regeln"],["antraege","Urlaubsanträge"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?C.redLight:C.white,border:tab===k?`1.5px solid ${C.red}`:`1px solid ${C.border}`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.red:C.textLight}}>{l}</button>
        ))}
      </div>

      {tab==="employees"&&(
        <div>
          <button onClick={()=>setNewEmp({name:"",first_name:"",role:"Monteur",email:"",lkw_gross:false,lkw_klein:false,pkw:false,password:"",is_admin:false,urlaubstage:30})}
            style={{width:"100%",...S.card,border:`1px dashed ${C.redBorder}`,padding:"10px",cursor:"pointer",color:C.red,fontWeight:600,fontSize:13,marginBottom:12,textAlign:"center",boxShadow:"none"}}>
            + Neuen Mitarbeiter hinzufügen
          </button>
          {newEmp&&<EmpForm emp={newEmp} onSave={saveEmp} onCancel={()=>setNewEmp(null)}/>}
          {employees.map(emp=>(
            <div key={emp.id}>
              {editEmp?.id===emp.id?<EmpForm emp={editEmp} onSave={saveEmp} onCancel={()=>setEditEmp(null)}/>:(
                <div style={{...S.card,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                  <Avatar emp={emp} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,display:"flex",alignItems:"center",gap:6}}>
                      {emp.name}{emp.is_admin&&<span style={{fontSize:9,background:C.redLight,color:C.red,padding:"1px 5px",borderRadius:10,border:`1px solid ${C.redBorder}`}}>Admin</span>}
                    </div>
                    <div style={{fontSize:10,color:C.textLight}}>{emp.role} · {emp.urlaubstage||30} Urlaubstage</div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setEditEmp({...emp})} style={{...S.btnGhost,padding:"4px 8px",fontSize:11}}>✏</button>
                    <button onClick={()=>delEmp(emp.id)} style={{...S.btnGhost,padding:"4px 8px",fontSize:11,color:C.red}}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="rules"&&(
        <div>
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:C.text}}>Urlaubsregeln</div>
            {[["maxLkwGross","Max. LKW-Groß gleichzeitig"],["maxLkwKlein","Max. LKW-Klein gleichzeitig"],["maxVorarbeiter","Max. Vorarbeiter gleichzeitig"]].map(([k,l])=>(
              <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:12,color:C.textMid}}>{l}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>setLocalRules(p=>({...p,[k]:Math.max(1,(p[k]||1)-1)}))} style={{width:30,height:30,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.red,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:"center",color:C.text}}>{localRules[k]}</span>
                  <button onClick={()=>setLocalRules(p=>({...p,[k]:(p[k]||1)+1}))} style={{width:30,height:30,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.red,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:C.text}}>Dezember-Sperre (für welche Rollen?)</div>
            {ROLES.map(role=>(
              <label key={role} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"}}>
                <input type="checkbox" checked={(localRules.blockedRoles||[]).includes(role)}
                  onChange={e=>{const br=localRules.blockedRoles||[];setLocalRules(p=>({...p,blockedRoles:e.target.checked?[...br,role]:br.filter(r=>r!==role)}));}}
                  style={{accentColor:C.red}}/>
                <span style={{fontSize:12,color:C.textMid}}>{role}</span>
              </label>
            ))}
          </div>
         <button onClick={saveRulesLocal} style={{...S.btn,background:saved?"linear-gradient(135deg,#16a34a,#15803d)":`linear-gradient(135deg,${C.red},#b91c1c)`}}>
            {saved?"✓ Gespeichert!":"Regeln speichern"}
          </button>
        </div>
      )}

      {tab==="antraege"&&(
        <div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:12}}>Alle Urlaubsanträge</div>
          {loading&&<div style={{textAlign:"center",color:C.textLight,padding:24}}>Lädt...</div>}
          {!loading&&antraege.length===0&&<div style={{textAlign:"center",color:C.textLight,fontSize:13,padding:24}}>Noch keine Anträge</div>}
          {antraege.map((a,i)=>{
            const statusColor=a.status==="genehmigt"?C.green:a.status==="abgelehnt"?C.red:C.amber;
            const statusBg=a.status==="genehmigt"?C.greenLight:a.status==="abgelehnt"?C.redLight:C.amberLight;
            return (
              <div key={i} style={{...S.card,borderRadius:10,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text}}>{a.mitarbeiter_name}</div>
                  <span style={{fontSize:10,background:statusBg,color:statusColor,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{a.status}</span>
                </div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:2}}>{a.mitarbeiter_rolle}</div>
                <div style={{fontSize:11,color:C.textMid}}>{formatDate(a.von)} – {formatDate(a.bis)} · {a.arbeitstage} Arbeitstage</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── HAUPT-APP ────────────────────────────────────────────────────────────────
export default function App(){
  const [employees,setEmployees]=useState([]);
  const [bookedVacations,setBookedVacations]=useState([]);
  const [rules,setRules]=useState(DEFAULT_RULES);
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [successMsg,setSuccessMsg]=useState("");
  useEffect(()=>{ loadRulesFromDb().then(setRules); },[]);

  // Meldung state
  const [mKey,setMKey]=useState(null);
  const [mText,setMText]=useState("");
  const [mRecip,setMRecip]=useState(null);
  const [krankVon,setKrankVon]=useState("");
  const [krankBis,setKrankBis]=useState("");

  // Urlaub state
  const [vFrom,setVFrom]=useState("");
  const [vTo,setVTo]=useState("");
  const [conflict,setConflict]=useState(null);
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calMonth,setCalMonth]=useState(new Date().getMonth());
  const [kalYear2,setKalYear2]=useState(new Date().getFullYear());
  const [kalMonth2,setKalMonth2]=useState(new Date().getMonth());
  const [kalFilterRole,setKalFilterRole]=useState("alle");
  const [kalSelectedDay,setKalSelectedDay]=useState(null);

  // Genehmigungsseite
  const urlParams=new URLSearchParams(window.location.search);
  const antragId=urlParams.get("antrag");

  // Daten laden
  useEffect(()=>{
    async function loadAll(){
      const [emps,vacs,antraege]=await Promise.all([
        db("GET","mitarbeiter_public",null,"?order=id&select=*"),
        db("GET","gebuchte_urlaube",null,"?select=*"),
        db("GET","urlaubsantraege",null,"?status=eq.genehmigt&select=*"),
      ]);
      if(emps) setEmployees(emps);
      // Merge gebuchte_urlaube + genehmigte urlaubsantraege
      const booked = vacs||[];
      const fromAntraege = (antraege||[]).map(a=>({
        id: a.id,
        mitarbeiter_id: a.mitarbeiter_id,
        name: a.mitarbeiter_name,
        role: a.mitarbeiter_rolle,
        lkw_gross: emps?.find(e=>e.id===a.mitarbeiter_id)?.lkw_gross||false,
        lkw_klein: emps?.find(e=>e.id===a.mitarbeiter_id)?.lkw_klein||false,
        von: a.von,
        bis: a.bis,
      }));
      // Combine and deduplicate by mitarbeiter_id + von + bis
      const combined = [...booked];
      for(const a of fromAntraege){
        const exists = combined.some(b=>b.mitarbeiter_id===a.mitarbeiter_id&&b.von===a.von&&b.bis===a.bis);
        if(!exists) combined.push(a);
      }
      setBookedVacations(combined);
      setLoading(false);
    }
    loadAll();
  },[]);

  useEffect(()=>{
    if(vFrom&&vTo&&user) setConflict(checkConflict(vFrom,vTo,user,bookedVacations,rules));
    else setConflict(null);
  },[vFrom,vTo,user,bookedVacations,rules]);

  if(antragId) return <ApprovalPage antragId={antragId}/>;

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <Logo size={1.3}/>
      <div style={{marginTop:24,fontSize:14,color:C.textLight}}>Lädt...</div>
    </div>
  );

  if(!user) return <Login employees={employees} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  const meldungTypes=DEFAULT_MELDUNGEN;
  const mt=meldungTypes.find(m=>m.key===mKey);
  function getRecips(m){return (m?.recipientIds||[]).map(id=>employees.find(e=>e.id===id)).filter(Boolean);}

  function canSend(){
    if(!mt) return false;
    if(mt.key==="krank") return !!(krankVon&&krankBis&&krankVon<=krankBis);
    if(!mText.trim()) return false;
    if(mt.multiSelect&&!mRecip) return false;
    return true;
  }

  async function submitMeldung(){
    if(!canSend()) return;
        const recipEmps=mt.multiSelect?[employees.find(e=>e.id===mRecip)].filter(Boolean)
      :(mt.key==="krank"&&APPROVAL_ROLES_RALF.includes(user.role))?getRecips({recipientIds:[6]})
      :getRecips(mt);
    const toStr=recipEmps.map(r=>r.name).join(", ");
    const toEmail=recipEmps.map(r=>r.email).join(", ");
    let nachricht=mText;
    let label=mt.label;
    if(mt.key==="krank"){
      nachricht=`Krankheitszeitraum: ${formatDate(krankVon)} – ${formatDate(krankBis)}${mText?"\n\nHinweis: "+mText:""}`;
      label=`Krankmeldung (${formatDate(krankVon)} – ${formatDate(krankBis)})`;
    }
    await sendEmail(user.name,user.role,mt.label,toStr,nachricht,`${label} von ${user.name}`,toEmail,"");
    // In Supabase speichern
    await db("POST","meldungen",{mitarbeiter_id:user.id,mitarbeiter_name:user.name,typ:label,nachricht,empfaenger:toStr});
    setSuccessMsg(`Deine Meldung wurde weitergeleitet an: ${toStr}.`);
    setView("success");
    setMKey(null);setMText("");setMRecip(null);setKrankVon("");setKrankBis("");
  }

  async function submitUrlaub(){
    if(!vFrom||!vTo||conflict) return;
    const requestedDays=countWorkdays(vFrom,vTo);
    const needsApprovalTorsten=APPROVAL_ROLES_TORSTEN.includes(user.role);
    const needsApprovalRalf=APPROVAL_ROLES_RALF.includes(user.role);

    if(needsApprovalTorsten||needsApprovalRalf){
      const approverName=needsApprovalTorsten?"Torsten May":"Ralf Klukas";
      const approverEmail=needsApprovalTorsten?"torsten.may@klukas-gerueste.de":"ralf.klukas@klukas-gerueste.de";
      const result=await db("POST","urlaubsantraege",{
        mitarbeiter_id:user.id, mitarbeiter_name:user.name,
        mitarbeiter_rolle:user.role, von:vFrom, bis:vTo,
        arbeitstage:requestedDays, status:"ausstehend"
      });
      if(result&&result.length>0){
        const aid=result[0].id;
        const approvalLink=`https://klukas-portal.vercel.app/?antrag=${aid}`;
        await sendEmail(user.name,user.role,"Urlaubsantrag",approverName,
          `${user.name} (${user.role}) beantragt Urlaub vom ${formatDate(vFrom)} bis ${formatDate(vTo)} (${requestedDays} Arbeitstage).`,
          `Urlaubsantrag von ${user.name} – Genehmigung erforderlich`,approverEmail,approvalLink);
        setSuccessMsg(`Dein Urlaubsantrag (${formatDate(vFrom)} – ${formatDate(vTo)}, ${requestedDays} Arbeitstage) wurde zur Genehmigung an ${approverName} weitergeleitet. Du erhältst eine Benachrichtigung sobald er entschieden hat.`);
        setView("success");
      }
    }
    setVFrom("");setVTo("");
  }

  const today=new Date().toISOString().split("T")[0];
  const upcoming=bookedVacations.filter(v=>v.bis>=today).slice(0,5);
  const usedDays=bookedVacations.filter(v=>v.mitarbeiter_id===user.id&&v.von&&v.von.slice(0,4)===String(new Date().getFullYear())).reduce((sum,v)=>sum+countWorkdays(v.von,v.bis),0);
  const requestedDays=vFrom&&vTo&&vFrom<=vTo?countWorkdays(vFrom,vTo):0;
  const needsApproval=APPROVAL_ROLES_TORSTEN.includes(user.role)||APPROVAL_ROLES_RALF.includes(user.role);
  const approverName=APPROVAL_ROLES_TORSTEN.includes(user.role)?"Torsten May":"Ralf Klukas";

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Logo size={0.7}/>
          <div style={{display:"flex",gap:6}}>
            {user.is_admin&&<button onClick={()=>setView("admin")} style={{background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:6,padding:"5px 10px",color:C.red,fontSize:11,cursor:"pointer",fontWeight:600}}>⚙ Admin</button>}
            <button onClick={()=>{setUser(null);setView("dashboard");}} style={S.btnGhost}>Abmelden</button>
          </div>
        </div>
        <div style={{padding:"8px 16px 12px",display:"flex",alignItems:"center",gap:10,borderTop:`1px solid ${C.border}`}}>
          <Avatar emp={user} size={34}/>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:C.text}}>Hallo, {user.first_name}!</div>
            <div style={{fontSize:10,color:roleColor(user.role)}}>{user.role}</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,padding:16,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Was möchtest du melden?</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:20}}>Wähle eine Kategorie</div>
            {[
              {icon:"📋",title:"Meldung senden",desc:"Arbeitsmittel · Gespräch · Krankheit",to:"meldung"},
              {icon:"🏖️",title:"Urlaub beantragen",desc:"Kalender & Verfügbarkeit prüfen",to:"urlaub"},
              {icon:"📅",title:"Urlaubskalender",desc:"Wer hat wann Urlaub – Übersicht für alle",to:"kalenderuebersicht"},
            ].map((item,i)=>(
              <button key={i} onClick={()=>setView(item.to)}
                style={{width:"100%",...S.card,padding:"18px 20px",marginBottom:12,display:"flex",alignItems:"center",gap:16,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.background="#fff8f8";}}
                onMouseOut={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.white;}}>
                <div style={{fontSize:28}}>{item.icon}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:C.text}}>{item.title}</div>
                  <div style={{fontSize:12,color:C.textLight,marginTop:2}}>{item.desc}</div>
                </div>
                <div style={{marginLeft:"auto",color:C.red,fontSize:22}}>›</div>
              </button>
            ))}
          </div>
        )}

        {/* MELDUNG */}
        {view==="meldung"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Meldung senden</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:18}}>Was möchtest du melden?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
              {meldungTypes.map(t=>(
                <button key={t.key} onClick={()=>{setMKey(t.key);setMRecip(null);setMText("");setKrankVon("");setKrankBis("");}}
                  style={{background:mKey===t.key?C.redLight:C.white,border:mKey===t.key?`1.5px solid ${C.red}`:`1px solid ${C.border}`,borderRadius:12,padding:"16px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:C.text}}>{t.label}</div>
                  <div style={{fontSize:10,color:C.textLight,marginTop:2}}>{t.desc}</div>
                </button>
              ))}
            </div>

            {mt&&(
              <div style={{...S.card,border:`1px solid ${C.redBorder}`,background:"#fff8f8",marginBottom:14,fontSize:11}}>
                {mt.multiSelect?(
                  <div>
                    <div style={{color:C.textMid,marginBottom:8,fontWeight:600}}>Gesprächspartner wählen:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {getRecips(mt).map(r=>(
                        <button key={r.id} onClick={()=>setMRecip(r.id)}
                          style={{background:mRecip===r.id?C.redLight:C.white,border:mRecip===r.id?`1.5px solid ${C.red}`:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:11,color:mRecip===r.id?C.red:C.textMid,fontWeight:mRecip===r.id?600:400}}>
                          {r.first_name} {r.name.split(", ")[0]}
                        </button>
                      ))}
                    </div>
                    {mt.coordinatorId&&(()=>{const c=employees.find(e=>e.id===mt.coordinatorId);return c?<div style={{marginTop:8,color:C.textLight,fontSize:10}}>Koordiniert über: <span style={{color:C.red,fontWeight:600}}>{c.name}</span></div>:null;})()}
                  </div>
                ):(
                  <div style={{color:C.textMid}}>📨 Wird gesendet an: <span style={{color:C.red,fontWeight:600}}>{getRecips(mt).map(r=>r.name).join(", ")}</span></div>
                )}
              </div>
            )}

            {mt?.key==="krank"&&(
              <div style={{marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  {[["KRANK AB",krankVon,setKrankVon],["KRANK BIS",krankBis,setKrankBis]].map(([l,val,setter])=>(
                    <div key={l}><label style={S.label}>{l}</label>
                      <input type="date" value={val} onChange={e=>setter(e.target.value)} style={{...S.input,fontSize:12,padding:"9px 10px"}}/>
                    </div>
                  ))}
                </div>
                {krankVon&&krankBis&&krankVon<=krankBis&&(
                  <div style={{...S.card,background:"#fff8f8",border:`1px solid ${C.redBorder}`,padding:"10px 14px",fontSize:12,color:C.textMid,marginBottom:10}}>
                    🤒 Krankmeldung: <strong>{formatDate(krankVon)} – {formatDate(krankBis)}</strong>
                  </div>
                )}
                <label style={S.label}>Optionaler Hinweis</label>
              </div>
            )}

            <textarea value={mText} onChange={e=>setMText(e.target.value)}
              placeholder={mt?.key==="krank"?"Optionaler Hinweis (z.B. Arztbesuch geplant)...":"Beschreibe dein Anliegen..."} rows={mt?.key==="krank"?2:4}
              style={{...S.input,resize:"none",fontSize:13,padding:"10px 12px"}}/>
            <button onClick={submitMeldung} disabled={!canSend()}
              style={{...S.btn,marginTop:10,background:canSend()?`linear-gradient(135deg,${C.red},#b91c1c)`:"#e5e7eb",color:canSend()?"#fff":C.textLight,cursor:canSend()?"pointer":"not-allowed"}}>
              Meldung absenden ›
            </button>
          </div>
        )}

        {/* URLAUB */}
        {view==="urlaub"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Urlaub beantragen</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Zeitraum wählen & Verfügbarkeit prüfen</div>

            {needsApproval&&(
              <div style={{...S.card,background:C.amberLight,border:"1px solid #fcd34d",marginBottom:14,padding:"10px 14px",fontSize:12,color:"#92400e"}}>
                ⏳ Dein Antrag wird zuerst von <strong>{approverName}</strong> geprüft.
              </div>
            )}

            {/* Urlaubstage Balken */}
            <div style={{...S.card,marginBottom:14,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>Urlaub {new Date().getFullYear()}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.amber}}>Bereits beantragt: {usedDays} Tage</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["VON",vFrom,setVFrom],["BIS",vTo,setVTo]].map(([l,val,setter])=>(
                <div key={l}><label style={S.label}>{l}</label>
                  <input type="date" value={val} onChange={e=>setter(e.target.value)} style={{...S.input,fontSize:12,padding:"9px 10px"}}/>
                </div>
              ))}
            </div>

            {requestedDays>0&&(
              <div style={{...S.card,marginBottom:14,padding:"10px 14px",background:"#f8faff",border:"1px solid #dbeafe"}}>
                <div style={{fontSize:12,color:"#1d4ed8",fontWeight:600}}>📅 {requestedDays} Arbeitstage beantragt</div>
              </div>
            )}

            {vFrom&&vTo&&vFrom<=vTo&&(
              <div style={{background:conflict?C.redLight:C.greenLight,border:`1px solid ${conflict?C.redBorder:C.greenBorder}`,borderRadius:10,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{fontSize:20,flexShrink:0}}>{conflict?"🚫":"✅"}</span>
                <div>
                  <div style={{fontWeight:700,color:conflict?C.red:C.green,fontSize:13,marginBottom:2}}>{conflict?"Buchung nicht möglich":"Zeitraum verfügbar"}</div>
                  <div style={{fontSize:11,color:C.textMid}}>{conflict?conflict.msg:"Du kannst diesen Zeitraum beantragen."}</div>
                </div>
              </div>
            )}

            <Calendar year={calYear} month={calMonth}
              onChangeMonth={delta=>{let m=calMonth+delta,y=calYear;if(m<0){m=11;y--;}if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);}}
              vacFrom={vFrom} vacTo={vTo} conflict={!!conflict} user={user} bookedVacations={bookedVacations} rules={rules}
              onDayClick={(ds)=>{
                if(!vFrom||(vFrom&&vTo)){
                  setVFrom(ds);
                  setVTo("");
                } else {
                  if(ds<vFrom){
                    setVTo(vFrom);
                    setVFrom(ds);
                  } else {
                    setVTo(ds);
                  }
                }
              }}/>

            {(()=>{
              const mStart=`${calYear}-${String(calMonth+1).padStart(2,"0")}-01`;
              const mEnd=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(new Date(calYear,calMonth+1,0).getDate()).padStart(2,"0")}`;
              const thisMonth=bookedVacations.filter(v=>v.von<=mEnd&&v.bis>=mStart);
              if(thisMonth.length===0) return null;
              return (
                <div style={{marginTop:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.textLight,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                    Urlaube im {new Date(calYear,calMonth).toLocaleDateString("de-DE",{month:"long",year:"numeric"})}
                  </div>
                  {thisMonth.sort((a,b)=>a.von.localeCompare(b.von)).map((v,i)=>{
                    const isMe=v.mitarbeiter_id===user.id;
                    const c=roleColor(v.role||"Monteur");
                    return (
                      <div key={i} style={{...S.card,borderRadius:8,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`3px solid ${isMe?C.red:c}`,background:isMe?C.redLight:C.white}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:600,color:C.text}}>
                            {v.name}{isMe&&<span style={{fontSize:9,color:C.red,marginLeft:6,fontWeight:700}}>● Du</span>}
                          </div>
                          <div style={{fontSize:10,color:c,fontWeight:600}}>{v.role}</div>
                        </div>
                        <div style={{fontSize:10,color:C.amber,fontWeight:600}}>{formatDate(v.von)} – {formatDate(v.bis)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <button onClick={submitUrlaub} disabled={!vFrom||!vTo||vFrom>vTo||!!conflict}
              style={{...S.btn,background:(!vFrom||!vTo||vFrom>vTo||!!conflict)?"#e5e7eb":`linear-gradient(135deg,${C.red},#b91c1c)`,color:(!vFrom||!vTo||vFrom>vTo||!!conflict)?C.textLight:"#fff"}}>
              {needsApproval?"Urlaubsantrag einreichen ›":"Urlaubsantrag senden ›"}
            </button>
          </div>
        )}

        {/* ADMIN */}
        {view==="admin"&&user.is_admin&&(
          <Admin employees={employees} setEmployees={setEmployees} rules={rules} setRules={setRules} setView={setView} meldungen={DEFAULT_MELDUNGEN} user={user}/>
        )}

        {/* URLAUBSKALENDER */}
        {view==="kalenderuebersicht"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>📅 Urlaubskalender</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Wer hat wann Urlaub – nur zur Ansicht</div>

            {(()=>{
              const [filterRole, setFilterRole] = [kalFilterRole, setKalFilterRole];
              const today = new Date();
              const year = kalYear2;
              const month = kalMonth2;
              const monthName = new Date(year, month).toLocaleDateString("de-DE", {month:"long", year:"numeric"});
              const daysInMonth = new Date(year, month+1, 0).getDate();
              const firstDay = (new Date(year, month, 1).getDay()+6)%7;

              const filtered = filterRole === "alle"
                ? bookedVacations
                : bookedVacations.filter(v => {
                    const emp = employees.find(e => e.id === v.mitarbeiter_id);
                    return emp?.role === filterRole;
                  });

              const activeThisMonth = filtered.filter(v => {
                const from = v.von; const to = v.bis;
                const mStart = `${year}-${String(month+1).padStart(2,"0")}-01`;
                const mEnd = `${year}-${String(month+1).padStart(2,"0")}-${String(daysInMonth).padStart(2,"0")}`;
                return from <= mEnd && to >= mStart;
              });

              return (
                <div>
                  {/* Monatsnavigation */}
                  <div style={{...S.card, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                    <button onClick={()=>{let m=kalMonth2-1,y=kalYear2;if(m<0){m=11;y--;}setKalMonth2(m);setKalYear2(y);}} style={{background:"none",border:"none",color:C.red,fontSize:22,cursor:"pointer"}}>‹</button>
                    <div style={{fontWeight:700,fontSize:14,color:C.text}}>{monthName}</div>
                    <button onClick={()=>{let m=kalMonth2+1,y=kalYear2;if(m>11){m=0;y++;}setKalMonth2(m);setKalYear2(y);}} style={{background:"none",border:"none",color:C.red,fontSize:22,cursor:"pointer"}}>›</button>
                  </div>

                  {/* Rollenfilter */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                    {["alle",...ROLES].map(r=>(
                      <button key={r} onClick={()=>setKalFilterRole(r)}
                        style={{background:filterRole===r?C.redLight:C.white,border:filterRole===r?`1.5px solid ${C.red}`:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:11,fontWeight:filterRole===r?700:400,color:filterRole===r?C.red:C.textLight}}>
                        {r==="alle"?"Alle":r}
                      </button>
                    ))}
                  </div>

                  {/* Kalender */}
                  <div style={{...S.card, padding:14, marginBottom:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
                      {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=><div key={d} style={{fontSize:9,color:C.textLight,textAlign:"center",fontWeight:700}}>{d}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                      {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i}/>)}
                      {Array.from({length:daysInMonth}).map((_,i)=>{
                        const n = i+1;
                        const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
                        const dayVacs = activeThisMonth.filter(v=>v.von<=ds&&v.bis>=ds);
                        const isToday = ds===new Date().toISOString().split("T")[0];
                        const isSelected = kalSelectedDay === ds;
                        return (
                          <div key={n} onClick={()=>setKalSelectedDay(isSelected?null:ds)}
                            style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:4,fontSize:10,fontWeight:600,background:isSelected?C.redLight:dayVacs.length>0?"#f8f9ff":isToday?"#fff8f8":"transparent",border:`1px solid ${isSelected?C.red:dayVacs.length>0?"#e0e4ff":isToday?C.red:C.border}`,color:isSelected?C.red:isToday?C.red:C.textLight,position:"relative",padding:"2px 1px",cursor:dayVacs.length>0?"pointer":"default",transition:"all 0.1s"}}>
                            <span style={{fontSize:10,fontWeight:600,lineHeight:1}}>{n}</span>
                            {dayVacs.length>0&&(
                              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:2,marginTop:2,maxWidth:"90%"}}>
                                {dayVacs.slice(0,6).map((v,vi)=>{
                                  const emp=employees.find(e=>e.id===v.mitarbeiter_id);
                                  return <div key={vi} style={{width:7,height:7,borderRadius:"50%",background:roleColor(emp?.role||"Monteur"),flexShrink:0}}/>;
                                })}
                                {dayVacs.length>6&&<div style={{width:7,height:7,borderRadius:"50%",background:"#aaa",flexShrink:0}}/>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Liste */}
                  {/* Selected day detail */}
                  {kalSelectedDay&&(()=>{
                    const dayVacsSelected = filtered.filter(v=>v.von<=kalSelectedDay&&v.bis>=kalSelectedDay);
                    const roleOrder=["GF","Bauleiter","Büro","Lagerist","Vorarbeiter","Monteur","Azubi"];
                    const sorted = [...dayVacsSelected].sort((a,b)=>{
                      const empA=employees.find(e=>e.id===a.mitarbeiter_id);
                      const empB=employees.find(e=>e.id===b.mitarbeiter_id);
                      return roleOrder.indexOf(empA?.role||"")-roleOrder.indexOf(empB?.role||"");
                    });
                    return (
                      <div style={{...S.card,marginBottom:14,border:`1.5px solid ${C.red}`,background:C.redLight}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{fontSize:13,fontWeight:700,color:C.red}}>📅 {formatDate(kalSelectedDay)}</div>
                          <div style={{fontSize:11,color:C.textLight}}>{sorted.length} Person{sorted.length!==1?"en":""} im Urlaub</div>
                        </div>
                        {sorted.length===0?(
                          <div style={{fontSize:12,color:C.textLight}}>Kein Urlaub an diesem Tag</div>
                        ):sorted.map((v,i)=>{
                          const emp=employees.find(e=>e.id===v.mitarbeiter_id);
                          const c=roleColor(emp?.role||"Monteur");
                          return (
                            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderTop:i>0?`1px solid ${C.border}`:"none"}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:c,flexShrink:0}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:12,fontWeight:700,color:C.text}}>{v.name}</span>
                                <span style={{fontSize:10,color:c,fontWeight:600,marginLeft:8}}>{emp?.role}</span>
                              </div>
                              <div style={{fontSize:10,color:C.textLight}}>{formatDate(v.von)} – {formatDate(v.bis)}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {activeThisMonth.length===0?(
                    <div style={{textAlign:"center",color:C.textLight,fontSize:13,padding:24}}>Kein Urlaub in diesem Monat</div>
                  ):(
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:C.textLight,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                        Alle Urlaube diesen Monat
                      </div>
                      {(()=>{
                        const roleOrder=["GF","Bauleiter","Büro","Lagerist","Vorarbeiter","Monteur","Azubi"];
                        return [...activeThisMonth].sort((a,b)=>{
                          const empA=employees.find(e=>e.id===a.mitarbeiter_id);
                          const empB=employees.find(e=>e.id===b.mitarbeiter_id);
                          const roleCompare=roleOrder.indexOf(empA?.role||"")-roleOrder.indexOf(empB?.role||"");
                          if(roleCompare!==0) return roleCompare;
                          return a.von.localeCompare(b.von);
                        }).map((v,i)=>{
                          const emp=employees.find(e=>e.id===v.mitarbeiter_id);
                          const c=roleColor(emp?.role||"Monteur");
                          return (
                            <div key={i} style={{...S.card,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,borderLeft:`3px solid ${c}`}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{v.name}</div>
                                <div style={{fontSize:10,color:c,fontWeight:600}}>{emp?.role}</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:11,fontWeight:600,color:C.amber}}>{formatDate(v.von)} – {formatDate(v.bis)}</div>
                                <div style={{fontSize:10,color:C.textLight}}>{countWorkdays(v.von,v.bis)} Arbeitstage</div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* SUCCESS */}
        {view==="success"&&(
          <div style={{textAlign:"center",paddingTop:50}}>
            <div style={{fontSize:60,marginBottom:16}}>✅</div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:10,color:C.text}}>Erfolgreich gesendet!</div>
            <div style={{fontSize:13,color:C.textMid,lineHeight:1.7,marginBottom:32,padding:"0 10px"}}>{successMsg}</div>
            <button onClick={()=>setView("dashboard")} style={{...S.btn,width:"auto",padding:"13px 32px"}}>Zurück zur Übersicht</button>
          </div>
        )}
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,padding:"8px 16px",textAlign:"center",background:C.white}}>
        <div style={{fontSize:9,color:C.textLight}}>KLUKAS-GERÜSTE GmbH · Wir helfen aufzubauen!</div>
      </div>
    </div>
  );
}
