import { useState, useEffect } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://wgyxwbrjrkyudkdyrqpj.supabase.co";
const SUPABASE_KEY = "sb_publishable_iiy75P-b6qe_2KLEN_M0Kg_CgdZkkkH";

async function supabase(method, table, data = null, filter = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "return=representation" : "",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

// ─── EMAILJS ──────────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC = "LNWETx8iRbXRi2zvl";
const EMAILJS_SERVICE = "service_gxg015l";
const EMAILJS_TEMPLATE = "template_av4scen";

async function sendEmail(vonName, vonRolle, meldungArt, anName, nachricht, betreff, toEmail="") {
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_TEMPLATE,
        user_id: EMAILJS_PUBLIC,
        template_params: {
  betreff,
  von_name: vonName,
  von_rolle: vonRolle,
  meldung_art: meldungArt,
  an_name: anName,
  nachricht,
  to_email: toEmail,
  genehmigung_link: toEmail === "torsten.may@klukas-gerueste.de" ? nachricht.split("Genehmigungslink:\n")[1] || "" : "",
}
      })
    });
  } catch(e) { console.error("Email error:", e); }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function roleColor(role) {
  return { GF:"#dc2626", Bauleiter:"#d97706", Büro:"#2563eb", Lagerist:"#7c3aed", Vorarbeiter:"#059669", Monteur:"#4f46e5", Azubi:"#6b7280" }[role] || "#6b7280";
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

// Rollen die Genehmigung brauchen
const APPROVAL_ROLES = ["Monteur","Vorarbeiter","Lagerist","Azubi"];

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DEFAULT_EMPLOYEES = [
  {id:1,  name:"Klukas, Ralf",       firstName:"Ralf",      role:"GF",          email:"ralf.klukas@klukas-gerueste.de",       lkwGross:true,  lkwKlein:false,pkw:true,  password:"ralf2024",      isAdmin:true,  urlaubstage:25},
  {id:2,  name:"Gulde, Thomas",       firstName:"Thomas",    role:"GF",          email:"thomas.gulde@klukas-gerueste.de",       lkwGross:false, lkwKlein:true, pkw:true,  password:"thomas2024",    isAdmin:true,  urlaubstage:25},
  {id:3,  name:"May, Torsten",        firstName:"Torsten",   role:"Bauleiter",   email:"torsten.may@klukas-gerueste.de",        lkwGross:true,  lkwKlein:false,pkw:false, password:"torsten2024",   isAdmin:false, urlaubstage:30},
  {id:4,  name:"Kademann, Falk",      firstName:"Falk",      role:"Bauleiter",   email:"falk.kademann@klukas-gerueste.de",      lkwGross:false, lkwKlein:true, pkw:true,  password:"falk2024",      isAdmin:false, urlaubstage:25},
  {id:5,  name:"Brausewetter, Maik",  firstName:"Maik",      role:"Bauleiter",   email:"maik.brausewetter@klukas-gerueste.de",  lkwGross:false, lkwKlein:false,pkw:true,  password:"maik2024",      isAdmin:false, urlaubstage:25},
  {id:6,  name:"Anders, Elke",        firstName:"Elke",      role:"Büro",        email:"elke.anders@klukas-gerueste.de",        lkwGross:false, lkwKlein:false,pkw:true,  password:"elke2024",      isAdmin:false, urlaubstage:30},
  {id:7,  name:"Dörschel, Angela",    firstName:"Angela",    role:"Büro",        email:"angela.doerschel@klukas-gerueste.de",   lkwGross:false, lkwKlein:false,pkw:true,  password:"angela2024",    isAdmin:false, urlaubstage:30},
  {id:8,  name:"Fuchs, Salome",       firstName:"Salome",    role:"Büro",        email:"salome.fuchs@klukas-gerueste.de",       lkwGross:false, lkwKlein:false,pkw:true,  password:"salome2024",    isAdmin:true,  urlaubstage:26},
  {id:9,  name:"Gillhoff, Oliver",    firstName:"Oliver",    role:"Lagerist",    email:"oliver.gillhoff@klukas-gerueste.de",    lkwGross:true,  lkwKlein:true, pkw:true,  password:"oliver2024",    isAdmin:false, urlaubstage:30},
  {id:10, name:"Dörschel, Tobias",    firstName:"Tobias",    role:"Lagerist",    email:"tobias.doerschel@klukas-gerueste.de",   lkwGross:false, lkwKlein:false,pkw:true,  password:"tobias2024",    isAdmin:false, urlaubstage:30},
  {id:11, name:"Hagedorn, Marko",     firstName:"Marko",     role:"Lagerist",    email:"marko.hagedorn@klukas-gerueste.de",     lkwGross:false, lkwKlein:false,pkw:true,  password:"marko2024",     isAdmin:false, urlaubstage:30},
  {id:12, name:"Schimank, Frank",     firstName:"Frank",     role:"Vorarbeiter", email:"frank.schimank@klukas-gerueste.de",     lkwGross:false, lkwKlein:true, pkw:true,  password:"frankS2024",    isAdmin:false, urlaubstage:30},
  {id:13, name:"Schmidt, Frank",      firstName:"Frank",     role:"Vorarbeiter", email:"frank.schmidt@klukas-gerueste.de",      lkwGross:false, lkwKlein:false,pkw:false, password:"frankSC2024",   isAdmin:false, urlaubstage:30},
  {id:14, name:"Lehmann, Jan",        firstName:"Jan",       role:"Monteur",     email:"jan.lehmann@klukas-gerueste.de",        lkwGross:false, lkwKlein:true, pkw:true,  password:"jan2024",       isAdmin:false, urlaubstage:30},
  {id:15, name:"Linke, Andreas",      firstName:"Andreas",   role:"Monteur",     email:"andreas.linke@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"andreas2024",   isAdmin:false, urlaubstage:30},
  {id:16, name:"Rasp, Oliver",        firstName:"Oliver",    role:"Monteur",     email:"oliver.rasp@klukas-gerueste.de",        lkwGross:true,  lkwKlein:true, pkw:true,  password:"oliverR2024",   isAdmin:false, urlaubstage:30},
  {id:17, name:"Geiger, Charly",      firstName:"Charly",    role:"Monteur",     email:"charly.geiger@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"charly2024",    isAdmin:false, urlaubstage:30},
  {id:18, name:"Böttcher, Harley",    firstName:"Harley",    role:"Monteur",     email:"harley.boettcher@klukas-gerueste.de",   lkwGross:true,  lkwKlein:true, pkw:true,  password:"harley2024",    isAdmin:false, urlaubstage:30},
  {id:19, name:"Ellmer, Holger",      firstName:"Holger",    role:"Vorarbeiter", email:"holger.ellmer@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"holger2024",    isAdmin:false, urlaubstage:30},
  {id:20, name:"Weiß, Alexandra",     firstName:"Alexandra", role:"Monteur",     email:"alexandra.weiss@klukas-gerueste.de",    lkwGross:false, lkwKlein:false,pkw:true,  password:"alexandra2024", isAdmin:false, urlaubstage:30},
  {id:21, name:"Eschmann, Anton",     firstName:"Anton",     role:"Vorarbeiter", email:"anton.eschmann@klukas-gerueste.de",     lkwGross:true,  lkwKlein:true, pkw:true,  password:"anton2024",     isAdmin:false, urlaubstage:30},
  {id:22, name:"Graf, René",          firstName:"René",      role:"Monteur",     email:"rene.graf@klukas-gerueste.de",          lkwGross:false, lkwKlein:false,pkw:true,  password:"rene2024",      isAdmin:false, urlaubstage:30},
  {id:23, name:"Geiger, Florian",     firstName:"Florian",   role:"Azubi",       email:"florian.geiger@klukas-gerueste.de",     lkwGross:false, lkwKlein:false,pkw:false, password:"florian2024",   isAdmin:false, urlaubstage:30},
  {id:24, name:"Ergin, Mehmet",       firstName:"Mehmet",    role:"Azubi",       email:"mehmet.ergin@klukas-gerueste.de",       lkwGross:false, lkwKlein:false,pkw:true,  password:"mehmet2024",    isAdmin:false, urlaubstage:30},
  {id:25, name:"Pietsch, Kay",        firstName:"Kay",       role:"Azubi",       email:"kay.pietsch@klukas-gerueste.de",        lkwGross:false, lkwKlein:false,pkw:false, password:"kay2024",       isAdmin:false, urlaubstage:30},
];

const DEFAULT_RULES = {
  maxLkwGross:3, maxLkwKlein:1, maxVorarbeiter:2,
  blockedMonths:[11],
  blockedRoles:["Monteur","Lagerist","Azubi"],
  summerBlock:{start:"2027-07-10",end:"2027-08-20"}
};

const DEFAULT_FIXED = [];
const DEFAULT_BOOKED = [];
const DEFAULT_MELDUNGEN = [
  {key:"arbeitsmittel",icon:"🔧",label:"Arbeitsmittel",desc:"Fehlendes / defektes Material",recipientIds:[7],multiSelect:false},
  {key:"gespraech",   icon:"💬",label:"Gespräch",      desc:"Gesprächswunsch",              recipientIds:[1,2,3,4,5],multiSelect:true,coordinatorId:8},
  {key:"krank",       icon:"🤒",label:"Krankmeldung",  desc:"Krankheit melden",             recipientIds:[4,3,6],multiSelect:false},
];
const DEFAULT_VAC_RECIPIENTS = [3,4,6];
const STORAGE_KEY = "klukas_v6";
const ROLES = ["GF","Bauleiter","Büro","Lagerist","Vorarbeiter","Monteur","Azubi"];

function loadData() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) {
      const p = JSON.parse(r);
      return {
        employees: p.employees||DEFAULT_EMPLOYEES,
        rules: p.rules||DEFAULT_RULES,
        fixedVacations: p.fixedVacations||DEFAULT_FIXED,
        bookedVacations: p.bookedVacations||DEFAULT_BOOKED,
        meldungTypes: p.meldungTypes||DEFAULT_MELDUNGEN,
        vacationRecipientIds: p.vacationRecipientIds||DEFAULT_VAC_RECIPIENTS,
        sentItems: p.sentItems||[]
      };
    }
  } catch(e){}
  return {employees:DEFAULT_EMPLOYEES,rules:DEFAULT_RULES,fixedVacations:DEFAULT_FIXED,bookedVacations:DEFAULT_BOOKED,meldungTypes:DEFAULT_MELDUNGEN,vacationRecipientIds:DEFAULT_VAC_RECIPIENTS,sentItems:[]};
}
function saveData(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch(e){}}

function getAllVacs(data){
  const all=[...(data.bookedVacations||[])];
  for(const fv of (data.fixedVacations||[])){
    for(const eid of fv.employeeIds){
      const e=data.employees.find(x=>x.id===eid);
      if(e) all.push({employeeId:eid,name:e.name,role:e.role,lkwGross:e.lkwGross,lkwKlein:e.lkwKlein,from:fv.from,to:fv.to,fixed:true,label:fv.label});
    }
  }
  return all;
}

function getUsedDays(employeeId, data) {
  return getAllVacs(data).filter(v=>v.employeeId===employeeId).reduce((sum,v)=>sum+countWorkdays(v.from,v.to),0);
}

function checkConflict(from,to,emp,data){
  if(!from||!to||from>to) return null;
  const rules=data.rules;
  let d=new Date(from); const end=new Date(to);
  while(d<=end){
    if((rules.blockedMonths||[]).includes(d.getMonth())){
      const br=rules.blockedRoles||[];
      if(br.length===0||br.includes(emp.role)) return {msg:`Im ${d.toLocaleDateString("de-DE",{month:"long"})} ist für deine Gruppe kein Urlaub möglich.`};
    }
    d.setDate(d.getDate()+1);
  }
  const sb=rules.summerBlock;
  if(sb&&from<=sb.end&&to>=sb.start){
    const inGroup=(data.fixedVacations||[]).some(fv=>fv.employeeIds.includes(emp.id)&&from>=fv.from&&to<=fv.to);
    if(!inGroup) return {msg:"Sommerblock: Urlaub nur für eingeplante Gruppen möglich."};
  }
  const requestedDays=countWorkdays(from,to);
  const usedDays=getUsedDays(emp.id,data);
  const remaining=(emp.urlaubstage||30)-usedDays;
  if(requestedDays>remaining) return {msg:`Nicht genug Urlaubstage. Du hast noch ${remaining} Tage übrig, beantragst aber ${requestedDays} Tage.`};
  const all=getAllVacs(data);
  function maxOv(fn){let m=0;let dd=new Date(from);while(dd<=new Date(to)){const ds=dd.toISOString().split("T")[0];const c=all.filter(v=>v.employeeId!==emp.id&&fn(v)&&dateInRange(ds,v.from,v.to)).length;if(c>m)m=c;dd.setDate(dd.getDate()+1);}return m;}
  if(emp.lkwGross&&maxOv(v=>v.lkwGross)>=rules.maxLkwGross) return {msg:`Bereits ${rules.maxLkwGross} LKW-Groß-Fahrer im Urlaub.`};
  if(emp.lkwKlein&&!emp.lkwGross&&maxOv(v=>v.lkwKlein&&!v.lkwGross)>=rules.maxLkwKlein) return {msg:`Bereits ${rules.maxLkwKlein} LKW-Klein-Fahrer im Urlaub.`};
  if(emp.role==="Vorarbeiter"&&maxOv(v=>v.role==="Vorarbeiter")>=rules.maxVorarbeiter) return {msg:`Bereits ${rules.maxVorarbeiter} Vorarbeiter im Urlaub.`};
  return null;
}

// ─── FARBEN ───────────────────────────────────────────────────────────────────
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
  return <div style={{width:size,height:size,borderRadius:"50%",background:c+"18",border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:700,color:c,flexShrink:0}}>{getInitials(emp.name)}</div>;
}

function VacationDaysBar({emp,data}){
  const total=emp.urlaubstage||30;
  const used=getUsedDays(emp.id,data);
  const remaining=total-used;
  const pct=Math.min(100,(used/total)*100);
  const color=remaining<=5?C.red:remaining<=10?C.amber:C.green;
  return (
    <div style={{...S.card,marginBottom:14,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:C.text}}>Urlaubstage {new Date().getFullYear()}</div>
        <div style={{fontSize:12,fontWeight:700,color}}>{remaining} von {total} Tagen übrig</div>
      </div>
      <div style={{background:C.bg,borderRadius:6,height:8,overflow:"hidden"}}>
        <div style={{background:color,height:"100%",width:`${pct}%`,borderRadius:6,transition:"width 0.3s"}}/>
      </div>
      {used>0&&<div style={{fontSize:10,color:C.textLight,marginTop:4}}>{used} Tage bereits gebucht</div>}
    </div>
  );
}

// ─── GENEHMIGUNG SEITE ────────────────────────────────────────────────────────
function ApprovalPage({antragId, employees}){
  const [antrag, setAntrag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(()=>{
    async function load(){
      const result = await supabase("GET", `urlaubsantraege?id=eq.${antragId}&select=*`);
      if(result&&result.length>0) setAntrag(result[0]);
      setLoading(false);
    }
    load();
  },[antragId]);

  async function decide(approved){
    setProcessing(true);
    const status = approved ? "genehmigt" : "abgelehnt";
    await supabase("PATCH", `urlaubsantraege?id=eq.${antragId}`, {
      status,
      entschieden_am: new Date().toISOString()
    });

    const emp = employees.find(e=>e.id===antrag.mitarbeiter_id);
    if(approved){
      // Info an Mitarbeiter
      const empEmail = employees.find(e=>e.id===antrag.mitarbeiter_id)?.email||"";
      await sendEmail("Torsten May","Bauleiter","Urlaubsgenehmigung",antrag.mitarbeiter_name,
        `Dein Urlaubsantrag vom ${antrag.von} bis ${antrag.bis} (${antrag.arbeitstage} Arbeitstage) wurde GENEHMIGT.`,
        `✅ Urlaub genehmigt: ${antrag.mitarbeiter_name}`, empEmail);
      // Info an Elke & Falk
      await sendEmail("Torsten May","Bauleiter","Urlaubsgenehmigung","Elke Anders, Falk Kademann",
        `Urlaubsantrag von ${antrag.mitarbeiter_name} (${antrag.mitarbeiter_rolle}) vom ${antrag.von} bis ${antrag.bis} wurde genehmigt.`,
        `Urlaub genehmigt: ${antrag.mitarbeiter_name}`, "elke.anders@klukas-gerueste.de,falk.kademann@klukas-gerueste.de");
    } else {
      // Info an Mitarbeiter
      const empEmailRej = employees.find(e=>e.id===antrag.mitarbeiter_id)?.email||"";
      await sendEmail("Torsten May","Bauleiter","Urlaubsablehnung",antrag.mitarbeiter_name,
        `Dein Urlaubsantrag vom ${antrag.von} bis ${antrag.bis} wurde ABGELEHNT. Bitte wende dich an deinen Bauleiter.`,
        `❌ Urlaub abgelehnt: ${antrag.mitarbeiter_name}`, empEmailRej);
    }
    setDone(approved);
    setProcessing(false);
  }

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:14,color:C.textLight}}>Lädt...</div>
    </div>
  );

  if(!antrag) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}>
      <Logo size={1.2}/>
      <div style={{marginTop:32,fontSize:16,color:C.red,fontWeight:700}}>Antrag nicht gefunden</div>
    </div>
  );

  if(antrag.status==="genehmigt"||antrag.status==="abgelehnt") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}>
      <Logo size={1.2}/>
      <div style={{marginTop:32,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>{antrag.status==="genehmigt"?"✅":"❌"}</div>
        <div style={{fontSize:16,fontWeight:700,color:C.text}}>Dieser Antrag wurde bereits {antrag.status}.</div>
      </div>
    </div>
  );

  if(done!==null) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}>
      <Logo size={1.2}/>
      <div style={{marginTop:32,textAlign:"center"}}>
        <div style={{fontSize:50,marginBottom:12}}>{done?"✅":"❌"}</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>
          {done?"Urlaub genehmigt!":"Urlaub abgelehnt"}
        </div>
        <div style={{fontSize:13,color:C.textMid}}>
          {antrag.mitarbeiter_name} wurde informiert.
          {done&&" Elke Anders & Falk Kademann wurden ebenfalls informiert."}
        </div>
      </div>
    </div>
  );

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
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{antrag.mitarbeiter_name}</div>
              <div style={{fontSize:11,color:roleColor(antrag.mitarbeiter_rolle)}}>{antrag.mitarbeiter_rolle}</div>
            </div>
          </div>
          {[
            ["📅 Zeitraum", `${antrag.von} – ${antrag.bis}`],
            ["⏱ Arbeitstage", `${antrag.arbeitstage} Tage`],
            ["📝 Status", "Ausstehend"],
          ].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:12,color:C.textLight}}>{l}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={()=>decide(false)} disabled={processing}
            style={{background:processing?"#e5e7eb":"#fff",border:`2px solid ${C.red}`,borderRadius:10,padding:"14px",color:C.red,fontWeight:700,fontSize:14,cursor:processing?"not-allowed":"pointer"}}>
            ❌ Ablehnen
          </button>
          <button onClick={()=>decide(true)} disabled={processing}
            style={{background:processing?"#e5e7eb":`linear-gradient(135deg,${C.green},#15803d)`,border:"none",borderRadius:10,padding:"14px",color:"#fff",fontWeight:700,fontSize:14,cursor:processing?"not-allowed":"pointer"}}>
            ✅ Genehmigen
          </button>
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
  function doLogin(){if(pw===sel.password){onLogin(sel);}else{setErr("Falsches Passwort. Bitte erneut versuchen.");}}
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
                  onMouseOver={e=>e.currentTarget.style.borderColor=C.red}
                  onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
                  <Avatar emp={emp} size={34}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{emp.name}</div>
                    <div style={{fontSize:11,color:roleColor(emp.role)}}>{emp.role}</div>
                  </div>
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
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{sel.name}</div>
                <div style={{fontSize:11,color:roleColor(sel.role)}}>{sel.role}</div>
              </div>
            </div>
            <label style={S.label}>Passwort</label>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus
              style={{...S.input,border:`1px solid ${err?C.red:C.borderDark}`,letterSpacing:"2px"}}/>
            {err&&<div style={{fontSize:11,color:C.red,marginTop:6}}>{err}</div>}
            <button onClick={doLogin} style={{...S.btn,marginTop:12,background:pw?`linear-gradient(135deg,${C.red},#b91c1c)`:"#e5e7eb",color:pw?"#fff":C.textLight,cursor:pw?"pointer":"not-allowed"}}>
              Anmelden ›
            </button>
          </>
        )}
      </div>
      <div style={{marginTop:16,fontSize:10,color:C.textLight}}>Wir helfen aufzubauen!</div>
    </div>
  );
}

// ─── KALENDER ─────────────────────────────────────────────────────────────────
function Calendar({year,month,onChangeMonth,vacFrom,vacTo,conflict,user,data}){
  const allVacs=getAllVacs(data);
  const days=new Date(year,month+1,0).getDate();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const monthName=new Date(year,month).toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  function cell(n){
    const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
    const sel=vacFrom&&vacTo&&vacFrom<=ds&&ds<=vacTo;
    const busy=allVacs.some(v=>v.employeeId!==user.id&&dateInRange(ds,v.from,v.to));
    const rules=data.rules;
    const d=new Date(ds);
    const blk=(rules.blockedMonths||[]).includes(d.getMonth())&&(rules.blockedRoles||[]).includes(user.role);
    const sb=rules.summerBlock; const sum=sb&&ds>=sb.start&&ds<=sb.end;
    if(sel&&conflict) return {bg:C.redLight,bd:`1.5px solid ${C.red}`,c:C.red};
    if(sel) return {bg:C.greenLight,bd:"1.5px solid #16a34a",c:"#16a34a"};
    if(blk) return {bg:C.redLight,bd:`1px solid ${C.border}`,c:"#fca5a5"};
    if(sum) return {bg:"#fefce8",bd:`1px solid ${C.border}`,c:"#a16207"};
    if(busy) return {bg:"#fffbeb",bd:"1px solid #fcd34d",c:C.textLight};
    return {bg:"transparent",bd:`1px solid ${C.border}`,c:C.textLight};
  }
  return (
    <div style={{...S.card,padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>onChangeMonth(-1)} style={{background:"none",border:"none",color:C.red,fontSize:20,cursor:"pointer"}}>‹</button>
        <div style={{fontWeight:700,fontSize:13,color:C.text}}>{monthName}</div>
        <button onClick={()=>onChangeMonth(1)} style={{background:"none",border:"none",color:C.red,fontSize:20,cursor:"pointer"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=><div key={d} style={{fontSize:9,color:C.textLight,textAlign:"center",fontWeight:700}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i)=>{const s=cell(i+1);return <div key={i+1} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,fontSize:10,fontWeight:600,background:s.bg,border:s.bd,color:s.c}}>{i+1}</div>;})}
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
        {[["Name","name"],["Rufname","firstName"],["E-Mail","email"],["Passwort","password"]].map(([l,k])=>(
          <div key={k}><label style={S.label}>{l}</label><input value={emp[k]||""} onChange={e=>set(k,e.target.value)} style={{...S.input,fontSize:11,padding:"7px 8px"}}/></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={S.label}>Rolle</label>
          <select value={emp.role} onChange={e=>set("role",e.target.value)} style={{...S.input,fontSize:11,padding:"7px 8px"}}>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label style={S.label}>Urlaubstage</label>
          <input type="number" value={emp.urlaubstage||30} onChange={e=>set("urlaubstage",parseInt(e.target.value))} style={{...S.input,fontSize:11,padding:"7px 8px"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        {[["LKW Groß","lkwGross"],["LKW Klein","lkwKlein"],["PKW","pkw"],["Admin","isAdmin"]].map(([l,k])=>(
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

function Admin({data,updateData,setView}){
  const [tab,setTab]=useState("employees");
  const [editEmp,setEditEmp]=useState(null);
  const [newEmp,setNewEmp]=useState(null);
  const [rules,setRules]=useState({...data.rules});
  const [saved,setSaved]=useState(false);
  const [antraege,setAntraege]=useState([]);

  useEffect(()=>{
    if(tab==="antraege"){
      supabase("GET","urlaubsantraege?order=erstellt_am.desc&select=*").then(r=>setAntraege(r||[]));
    }
  },[tab]);

  function saveEmp(emp){
    let emps;
    if(emp.id){emps=data.employees.map(e=>e.id===emp.id?emp:e);}
    else{const nid=Math.max(...data.employees.map(e=>e.id))+1;emps=[...data.employees,{...emp,id:nid}];}
    updateData({...data,employees:emps});setEditEmp(null);setNewEmp(null);
  }
  function delEmp(id){if(!confirm("Mitarbeiter wirklich löschen?")) return;updateData({...data,employees:data.employees.filter(e=>e.id!==id)});}
  function saveRules(){updateData({...data,rules});setSaved(true);setTimeout(()=>setSaved(false),2000);}

  return (
    <div>
      <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
      <div style={{fontSize:18,fontWeight:800,marginBottom:2,color:C.text}}>⚙ Admin-Bereich</div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Nur für Administratoren</div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["employees","Mitarbeiter"],["rules","Regeln"],["sent","Meldungen"],["antraege","Urlaubsanträge"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?C.redLight:C.white,border:tab===k?`1.5px solid ${C.red}`:`1px solid ${C.border}`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.red:C.textLight}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="employees"&&(
        <div>
          <button onClick={()=>setNewEmp({name:"",firstName:"",role:"Monteur",email:"",lkwGross:false,lkwKlein:false,pkw:false,password:"",isAdmin:false,urlaubstage:30})}
            style={{width:"100%",...S.card,border:`1px dashed ${C.redBorder}`,padding:"10px",cursor:"pointer",color:C.red,fontWeight:600,fontSize:13,marginBottom:12,textAlign:"center",boxShadow:"none"}}>
            + Neuen Mitarbeiter hinzufügen
          </button>
          {newEmp&&<EmpForm emp={newEmp} onSave={saveEmp} onCancel={()=>setNewEmp(null)}/>}
          {data.employees.map(emp=>(
            <div key={emp.id}>
              {editEmp?.id===emp.id?<EmpForm emp={editEmp} onSave={saveEmp} onCancel={()=>setEditEmp(null)}/>:(
                <div style={{...S.card,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                  <Avatar emp={emp} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,display:"flex",alignItems:"center",gap:6}}>
                      {emp.name}
                      {emp.isAdmin&&<span style={{fontSize:9,background:C.redLight,color:C.red,padding:"1px 5px",borderRadius:10,border:`1px solid ${C.redBorder}`}}>Admin</span>}
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
                  <button onClick={()=>setRules(p=>({...p,[k]:Math.max(1,(p[k]||1)-1)}))} style={{width:30,height:30,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.red,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:"center",color:C.text}}>{rules[k]}</span>
                  <button onClick={()=>setRules(p=>({...p,[k]:(p[k]||1)+1}))} style={{width:30,height:30,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.red,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:C.text}}>Dezember-Sperre (für welche Rollen?)</div>
            {ROLES.map(role=>(
              <label key={role} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"}}>
                <input type="checkbox" checked={(rules.blockedRoles||[]).includes(role)}
                  onChange={e=>{const br=rules.blockedRoles||[];setRules(p=>({...p,blockedRoles:e.target.checked?[...br,role]:br.filter(r=>r!==role)}));}}
                  style={{accentColor:C.red}}/>
                <span style={{fontSize:12,color:C.textMid}}>{role}</span>
              </label>
            ))}
          </div>
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:C.text}}>Sommerblock</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Von","start"],["Bis","end"]].map(([l,k])=>(
                <div key={k}><label style={S.label}>{l}</label>
                  <input type="date" value={rules.summerBlock?.[k]||""} onChange={e=>setRules(p=>({...p,summerBlock:{...p.summerBlock,[k]:e.target.value}}))} style={{...S.input,fontSize:11,padding:"7px 8px"}}/>
                </div>
              ))}
            </div>
          </div>
          <button onClick={saveRules} style={{...S.btn,background:saved?"linear-gradient(135deg,#16a34a,#15803d)":`linear-gradient(135deg,${C.red},#b91c1c)`}}>
            {saved?"✓ Gespeichert!":"Regeln speichern"}
          </button>
        </div>
      )}

      {tab==="sent"&&(
        <div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:12}}>Alle Meldungen & Anträge</div>
          {(data.sentItems||[]).length===0&&<div style={{textAlign:"center",color:C.textLight,fontSize:13,padding:24}}>Noch keine Meldungen</div>}
          {[...(data.sentItems||[])].reverse().map((item,i)=>{
            const emp=data.employees.find(e=>e.id===item.employeeId);
            return (
              <div key={i} style={{...S.card,borderRadius:10,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text}}>{item.label}</div>
                  <div style={{fontSize:10,color:C.textLight}}>{item.date}</div>
                </div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>Von: <span style={{color:C.text,fontWeight:600}}>{emp?.name||"?"}</span> ({emp?.role})</div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:item.text?6:0}}>An: <span style={{color:C.red,fontWeight:600}}>{item.to}</span></div>
                {item.text&&<div style={{fontSize:11,color:C.textMid,background:C.bg,borderRadius:6,padding:"6px 8px",border:`1px solid ${C.border}`}}>{item.text}</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab==="antraege"&&(
        <div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:12}}>Alle Urlaubsanträge aus Supabase</div>
          {antraege.length===0&&<div style={{textAlign:"center",color:C.textLight,fontSize:13,padding:24}}>Noch keine Anträge vorhanden</div>}
          {antraege.map((a,i)=>{
            const statusColor = a.status==="genehmigt"?C.green:a.status==="abgelehnt"?C.red:C.amber;
            const statusBg = a.status==="genehmigt"?C.greenLight:a.status==="abgelehnt"?C.redLight:C.amberLight;
            return (
              <div key={i} style={{...S.card,borderRadius:10,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text}}>{a.mitarbeiter_name}</div>
                  <span style={{fontSize:10,background:statusBg,color:statusColor,padding:"2px 8px",borderRadius:20,fontWeight:600,border:`1px solid ${statusColor}33`}}>{a.status}</span>
                </div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:2}}>{a.mitarbeiter_rolle}</div>
                <div style={{fontSize:11,color:C.textMid}}>{a.von} – {a.bis} · {a.arbeitstage} Arbeitstage</div>
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
  const [data,setData]=useState(loadData());
  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [successMsg,setSuccessMsg]=useState("");
  const [mKey,setMKey]=useState(null);
  const [mText,setMText]=useState("");
  const [mRecip,setMRecip]=useState(null);
  const [vFrom,setVFrom]=useState("");
  const [vTo,setVTo]=useState("");
  const [conflict,setConflict]=useState(null);
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calMonth,setCalMonth]=useState(new Date().getMonth());

  // Genehmigungsseite prüfen
  const urlParams = new URLSearchParams(window.location.search);
  const antragId = urlParams.get("antrag");
  if(antragId) return <ApprovalPage antragId={antragId} employees={data.employees}/>;

  useEffect(()=>{
    if(vFrom&&vTo&&user) setConflict(checkConflict(vFrom,vTo,user,data));
    else setConflict(null);
  },[vFrom,vTo,user]);

  function updateData(d){setData(d);saveData(d);}
  function addSent(item){const nd={...data,sentItems:[...(data.sentItems||[]),item]};updateData(nd);}
  function handleSuccess(msg,item){if(item)addSent(item);setSuccessMsg(msg);setView("success");}

  if(!user) return <Login employees={data.employees} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  const mt=data.meldungTypes?.find(m=>m.key===mKey);
  function getRecips(m){return (m?.recipientIds||[]).map(id=>data.employees.find(e=>e.id===id)).filter(Boolean);}
  function canSend(){if(!mt||!mText.trim()) return false;if(mt.multiSelect&&!mRecip) return false;return true;}

  function submitMeldung(){
    if(!canSend()) return;
    const recipEmps = mt.multiSelect ? [data.employees.find(e=>e.id===mRecip)].filter(Boolean) : getRecips(mt);
    const toStr = recipEmps.map(r=>r.name).join(", ");
    const toEmail = recipEmps.map(r=>r.email).join(", ");
    sendEmail(user.name, user.role, mt.label, toStr, mText, `${mt.label} von ${user.name}`, toEmail);
    handleSuccess(`Deine Meldung wurde weitergeleitet an: ${toStr}.`,{id:Date.now(),employeeId:user.id,type:"meldung",label:mt.label,text:mText,to:toStr,date:new Date().toLocaleDateString("de-DE")});
    setMKey(null);setMText("");setMRecip(null);
  }

  async function submitUrlaub(){
    if(!vFrom||!vTo||conflict) return;
    const requestedDays=countWorkdays(vFrom,vTo);
    const needsApproval=APPROVAL_ROLES.includes(user.role);

    if(needsApproval){
      // Antrag in Supabase speichern
      const result = await supabase("POST","urlaubsantraege",{
        mitarbeiter_id: user.id,
        mitarbeiter_name: user.name,
        mitarbeiter_rolle: user.role,
        von: vFrom,
        bis: vTo,
        arbeitstage: requestedDays,
        status: "ausstehend"
      });

      if(result&&result.length>0){
        const antragId = result[0].id;
        const approvalLink = `https://klukas-portal.vercel.app/?antrag=${antragId}`;

        // E-Mail an Torsten May mit Genehmigungslink
        await sendEmail(
          user.name, user.role, "Urlaubsantrag", "Torsten May",
          `${user.name} (${user.role}) beantragt Urlaub vom ${vFrom} bis ${vTo} (${requestedDays} Arbeitstage).\n\nGenehmigungslink:\n${approvalLink}`,
          `Urlaubsantrag von ${user.name} – Genehmigung erforderlich`,
          "torsten.may@klukas-gerueste.de"
        );

        handleSuccess(
          `Dein Urlaubsantrag (${vFrom} – ${vTo}, ${requestedDays} Arbeitstage) wurde zur Genehmigung an Torsten May weitergeleitet. Du erhältst eine Benachrichtigung sobald er entschieden hat.`,
          {id:Date.now(),employeeId:user.id,type:"urlaub",label:"Urlaubsantrag (ausstehend)",text:`${vFrom} – ${vTo}`,to:"Torsten May",date:new Date().toLocaleDateString("de-DE")}
        );
      }
    } else {
      // Direkte Buchung ohne Genehmigung – nur an Elke Anders
      const elke = data.employees.find(e=>e.id===6);
      const recNames = elke ? elke.name : "Elke Anders";
      sendEmail(user.name,user.role,"Urlaubsantrag",recNames,`Zeitraum: ${vFrom} – ${vTo} (${requestedDays} Arbeitstage)`,`Urlaubsantrag von ${user.name}`,"elke.anders@klukas-gerueste.de");
      const newVac={id:`v${Date.now()}`,employeeId:user.id,name:user.name,role:user.role,lkwGross:user.lkwGross,lkwKlein:user.lkwKlein,from:vFrom,to:vTo};
      updateData({...data,bookedVacations:[...(data.bookedVacations||[]),newVac]});
      handleSuccess(
        `Dein Urlaubsantrag (${vFrom} – ${vTo}, ${requestedDays} Arbeitstage) wurde an ${recNames} weitergeleitet.`,
        {id:Date.now(),employeeId:user.id,type:"urlaub",label:"Urlaubsantrag",text:`${vFrom} – ${vTo}`,to:recNames,date:new Date().toLocaleDateString("de-DE")}
      );
    }
    setVFrom("");setVTo("");
  }

  const allVacs=getAllVacs(data);
  const today=new Date().toISOString().split("T")[0];
  const upcoming=allVacs.filter(v=>v.to>=today).slice(0,5);
  const myItems=(data.sentItems||[]).filter(s=>s.employeeId===user.id).slice(-3).reverse();
  const requestedDays=vFrom&&vTo&&vFrom<=vTo?countWorkdays(vFrom,vTo):0;
  const needsApproval=APPROVAL_ROLES.includes(user.role);

  return (
    <div style={S.page}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Logo size={0.7}/>
          <div style={{display:"flex",gap:6}}>
            {user.isAdmin&&<button onClick={()=>setView("admin")} style={{background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:6,padding:"5px 10px",color:C.red,fontSize:11,cursor:"pointer",fontWeight:600}}>⚙ Admin</button>}
            <button onClick={()=>{setUser(null);setView("dashboard");}} style={S.btnGhost}>Abmelden</button>
          </div>
        </div>
        <div style={{padding:"8px 16px 12px",display:"flex",alignItems:"center",gap:10,borderTop:`1px solid ${C.border}`}}>
          <Avatar emp={user} size={34}/>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:C.text}}>Hallo, {user.firstName}!</div>
            <div style={{fontSize:10,color:roleColor(user.role)}}>{user.role}</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,padding:16,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

        {view==="dashboard"&&(
          <div>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Was möchtest du melden?</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:20}}>Wähle eine Kategorie</div>
            {[
              {icon:"📋",title:"Meldung senden",desc:"Arbeitsmittel · Gespräch · Krankheit",to:"meldung"},
              {icon:"🏖️",title:"Urlaub beantragen",desc:"Kalender & Verfügbarkeit prüfen",to:"urlaub"},
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
            {myItems.length>0&&<div style={{marginTop:24}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textLight,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Deine letzten Meldungen</div>
              {myItems.map((item,i)=>(
                <div key={i} style={{...S.card,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:20}}>{item.type==="urlaub"?"🏖️":"📋"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text}}>{item.label}</div>
                    <div style={{fontSize:10,color:C.textLight}}>An: {item.to} · {item.date}</div>
                  </div>
                  <div style={{fontSize:10,background:C.greenLight,color:C.green,padding:"3px 8px",borderRadius:20,fontWeight:600,border:`1px solid ${C.greenBorder}`}}>✓ Gesendet</div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {view==="meldung"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Meldung senden</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:18}}>Was möchtest du melden?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
              {(data.meldungTypes||[]).map(t=>(
                <button key={t.key} onClick={()=>{setMKey(t.key);setMRecip(null);}}
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
                          {r.firstName} {r.name.split(", ")[0]}
                        </button>
                      ))}
                    </div>
                    {mt.coordinatorId&&(()=>{const c=data.employees.find(e=>e.id===mt.coordinatorId);return c?<div style={{marginTop:8,color:C.textLight,fontSize:10}}>Koordiniert über: <span style={{color:C.red,fontWeight:600}}>{c.name}</span></div>:null;})()}
                  </div>
                ):(
                  <div style={{color:C.textMid}}>📨 Wird gesendet an: <span style={{color:C.red,fontWeight:600}}>{getRecips(mt).map(r=>r.name).join(", ")}</span></div>
                )}
              </div>
            )}
            <textarea value={mText} onChange={e=>setMText(e.target.value)} placeholder="Beschreibe dein Anliegen..." rows={4}
              style={{...S.input,resize:"none",fontSize:13,padding:"10px 12px"}}/>
            <button onClick={submitMeldung} disabled={!canSend()}
              style={{...S.btn,marginTop:10,background:canSend()?`linear-gradient(135deg,${C.red},#b91c1c)`:"#e5e7eb",color:canSend()?"#fff":C.textLight,cursor:canSend()?"pointer":"not-allowed"}}>
              Meldung absenden ›
            </button>
          </div>
        )}

        {view==="urlaub"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:19,fontWeight:800,marginBottom:2,color:C.text}}>Urlaub beantragen</div>
            <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Zeitraum wählen & Verfügbarkeit prüfen</div>

            {needsApproval&&(
              <div style={{...S.card,background:C.amberLight,border:`1px solid #fcd34d`,marginBottom:14,padding:"10px 14px",fontSize:12,color:"#92400e"}}>
                ⏳ Dein Antrag wird zuerst von <strong>Torsten May</strong> geprüft. Du bekommst eine E-Mail nach der Entscheidung.
              </div>
            )}

            <VacationDaysBar emp={user} data={data}/>

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
              vacFrom={vFrom} vacTo={vTo} conflict={!!conflict} user={user} data={data}/>

            {upcoming.length>0&&<div style={{marginTop:14,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textLight,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>Aktuelle Urlaubsbuchungen</div>
              {upcoming.map((v,i)=>(
                <div key={i} style={{...S.card,borderRadius:8,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:C.text}}>{v.name}</div>
                    <div style={{fontSize:10,color:C.textLight}}>{v.role}{v.fixed?" · Pflicht":""}</div>
                  </div>
                  <div style={{fontSize:10,color:C.amber,fontWeight:600}}>{v.from.slice(5)} – {v.to.slice(5)}</div>
                </div>
              ))}
            </div>}

            <button onClick={submitUrlaub} disabled={!vFrom||!vTo||vFrom>vTo||!!conflict}
              style={{...S.btn,background:(!vFrom||!vTo||vFrom>vTo||!!conflict)?"#e5e7eb":`linear-gradient(135deg,${C.red},#b91c1c)`,color:(!vFrom||!vTo||vFrom>vTo||!!conflict)?C.textLight:"#fff"}}>
              {needsApproval?"Urlaubsantrag einreichen ›":"Urlaubsantrag senden ›"}
            </button>
          </div>
        )}

        {view==="admin"&&user.isAdmin&&<Admin data={data} updateData={updateData} setView={setView}/>}

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
