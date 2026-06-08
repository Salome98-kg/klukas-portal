import { useState, useEffect } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function roleColor(role) {
  return { GF:"#e11d48", Bauleiter:"#f59e0b", Büro:"#3b82f6", Lagerist:"#8b5cf6", Vorarbeiter:"#10b981", Monteur:"#6366f1", Azubi:"#6b7280" }[role] || "#6b7280";
}
function getInitials(name) {
  const p = name.split(", ");
  return ((p[1]?.[0]||"")+(p[0]?.[0]||"")).toUpperCase();
}
function dateInRange(ds,from,to){return ds>=from&&ds<=to;}

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_EMPLOYEES = [
  {id:1,  name:"Klukas, Ralf",       firstName:"Ralf",      role:"GF",          email:"ralf.klukas@klukas-gerueste.de",       lkwGross:true,  lkwKlein:false,pkw:true,  password:"ralf2024",      isAdmin:true },
  {id:2,  name:"Gulde, Thomas",       firstName:"Thomas",    role:"GF",          email:"thomas.gulde@klukas-gerueste.de",       lkwGross:false, lkwKlein:true, pkw:true,  password:"thomas2024",    isAdmin:true },
  {id:3,  name:"May, Torsten",        firstName:"Torsten",   role:"Bauleiter",   email:"torsten.may@klukas-gerueste.de",        lkwGross:true,  lkwKlein:false,pkw:false, password:"torsten2024",   isAdmin:false},
  {id:4,  name:"Kademann, Falk",      firstName:"Falk",      role:"Bauleiter",   email:"falk.kademann@klukas-gerueste.de",      lkwGross:false, lkwKlein:true, pkw:true,  password:"falk2024",      isAdmin:false},
  {id:5,  name:"Brausewetter, Maik",  firstName:"Maik",      role:"Bauleiter",   email:"maik.brausewetter@klukas-gerueste.de",  lkwGross:false, lkwKlein:false,pkw:true,  password:"maik2024",      isAdmin:false},
  {id:6,  name:"Anders, Elke",        firstName:"Elke",      role:"Büro",        email:"elke.anders@klukas-gerueste.de",        lkwGross:false, lkwKlein:false,pkw:true,  password:"elke2024",      isAdmin:false},
  {id:7,  name:"Dörschel, Angela",    firstName:"Angela",    role:"Büro",        email:"angela.doerschel@klukas-gerueste.de",   lkwGross:false, lkwKlein:false,pkw:true,  password:"angela2024",    isAdmin:false},
  {id:8,  name:"Fuchs, Salome",       firstName:"Salome",    role:"Büro",        email:"salome.fuchs@klukas-gerueste.de",       lkwGross:false, lkwKlein:false,pkw:true,  password:"salome2024",    isAdmin:true },
  {id:9,  name:"Gillhoff, Oliver",    firstName:"Oliver",    role:"Lagerist",    email:"oliver.gillhoff@klukas-gerueste.de",    lkwGross:true,  lkwKlein:true, pkw:true,  password:"oliver2024",    isAdmin:false},
  {id:10, name:"Dörschel, Tobias",    firstName:"Tobias",    role:"Lagerist",    email:"tobias.doerschel@klukas-gerueste.de",   lkwGross:false, lkwKlein:false,pkw:true,  password:"tobias2024",    isAdmin:false},
  {id:11, name:"Hagedorn, Marko",     firstName:"Marko",     role:"Lagerist",    email:"marko.hagedorn@klukas-gerueste.de",     lkwGross:false, lkwKlein:false,pkw:true,  password:"marko2024",     isAdmin:false},
  {id:12, name:"Schimank, Frank",     firstName:"Frank",     role:"Vorarbeiter", email:"frank.schimank@klukas-gerueste.de",     lkwGross:false, lkwKlein:true, pkw:true,  password:"frankS2024",    isAdmin:false},
  {id:13, name:"Schmidt, Frank",      firstName:"Frank",     role:"Vorarbeiter", email:"frank.schmidt@klukas-gerueste.de",      lkwGross:false, lkwKlein:false,pkw:false, password:"frankSC2024",   isAdmin:false},
  {id:14, name:"Lehmann, Jan",        firstName:"Jan",       role:"Monteur",     email:"jan.lehmann@klukas-gerueste.de",        lkwGross:false, lkwKlein:true, pkw:true,  password:"jan2024",       isAdmin:false},
  {id:15, name:"Linke, Andreas",      firstName:"Andreas",   role:"Monteur",     email:"andreas.linke@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"andreas2024",   isAdmin:false},
  {id:16, name:"Rasp, Oliver",        firstName:"Oliver",    role:"Monteur",     email:"oliver.rasp@klukas-gerueste.de",        lkwGross:true,  lkwKlein:true, pkw:true,  password:"oliverR2024",   isAdmin:false},
  {id:17, name:"Geiger, Charly",      firstName:"Charly",    role:"Monteur",     email:"charly.geiger@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"charly2024",    isAdmin:false},
  {id:18, name:"Böttcher, Harley",    firstName:"Harley",    role:"Monteur",     email:"harley.boettcher@klukas-gerueste.de",   lkwGross:true,  lkwKlein:true, pkw:true,  password:"harley2024",    isAdmin:false},
  {id:19, name:"Ellmer, Holger",      firstName:"Holger",    role:"Vorarbeiter", email:"holger.ellmer@klukas-gerueste.de",      lkwGross:true,  lkwKlein:true, pkw:true,  password:"holger2024",    isAdmin:false},
  {id:20, name:"Weiß, Alexandra",     firstName:"Alexandra", role:"Monteur",     email:"alexandra.weiss@klukas-gerueste.de",    lkwGross:false, lkwKlein:false,pkw:true,  password:"alexandra2024", isAdmin:false},
  {id:21, name:"Eschmann, Anton",     firstName:"Anton",     role:"Vorarbeiter", email:"anton.eschmann@klukas-gerueste.de",     lkwGross:true,  lkwKlein:true, pkw:true,  password:"anton2024",     isAdmin:false},
  {id:22, name:"Graf, René",          firstName:"René",      role:"Monteur",     email:"rene.graf@klukas-gerueste.de",          lkwGross:false, lkwKlein:false,pkw:true,  password:"rene2024",      isAdmin:false},
  {id:23, name:"Geiger, Florian",     firstName:"Florian",   role:"Azubi",       email:"florian.geiger@klukas-gerueste.de",     lkwGross:false, lkwKlein:false,pkw:false, password:"florian2024",   isAdmin:false},
  {id:24, name:"Ergin, Mehmet",       firstName:"Mehmet",    role:"Azubi",       email:"mehmet.ergin@klukas-gerueste.de",       lkwGross:false, lkwKlein:false,pkw:true,  password:"mehmet2024",    isAdmin:false},
  {id:25, name:"Pietsch, Kay",        firstName:"Kay",       role:"Azubi",       email:"kay.pietsch@klukas-gerueste.de",        lkwGross:false, lkwKlein:false,pkw:false, password:"kay2024",       isAdmin:false},
];

const DEFAULT_RULES = { maxLkwGross:3, maxLkwKlein:1, maxVorarbeiter:2, blockedMonths:[11], summerBlock:{start:"2027-07-10",end:"2027-08-20"} };

const DEFAULT_FIXED = [
  {employeeIds:[21,17,18,12,22], from:"2027-07-12",to:"2027-07-30",label:"Gruppe A"},
  {employeeIds:[19,15,16,14,13,20], from:"2027-08-02",to:"2027-08-20",label:"Gruppe B"},
  {employeeIds:[9],  from:"2027-07-12",to:"2027-07-30",label:"Lager"},
  {employeeIds:[11], from:"2027-07-19",to:"2027-08-06",label:"Lager"},
  {employeeIds:[10], from:"2027-08-02",to:"2027-08-20",label:"Lager"},
];

const DEFAULT_BOOKED = [
  {id:"v1",employeeId:15,name:"Linke, Andreas", role:"Monteur",    lkwGross:true, from:"2026-07-07",to:"2026-07-11"},
  {id:"v2",employeeId:16,name:"Rasp, Oliver",   role:"Monteur",    lkwGross:true, from:"2026-07-14",to:"2026-07-18"},
  {id:"v3",employeeId:19,name:"Ellmer, Holger", role:"Vorarbeiter",lkwGross:true, from:"2026-08-03",to:"2026-08-07"},
];

const DEFAULT_MELDUNGEN = [
  {key:"arbeitsmittel",icon:"🔧",label:"Arbeitsmittel",desc:"Fehlendes / defektes Material",recipientIds:[7],multiSelect:false},
  {key:"gespraech",   icon:"💬",label:"Gespräch",      desc:"Gesprächswunsch",              recipientIds:[1,2,3,4,5],multiSelect:true,coordinatorId:8},
  {key:"krank",       icon:"🤒",label:"Krankmeldung",  desc:"Krankheit melden",             recipientIds:[4,3,6],multiSelect:false},
];

const DEFAULT_VAC_RECIPIENTS = [3,4,6];
const STORAGE_KEY = "klukas_v2";
const ROLES = ["GF","Bauleiter","Büro","Lagerist","Vorarbeiter","Monteur","Azubi"];

function loadData() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) { const p=JSON.parse(r); return {employees:p.employees||DEFAULT_EMPLOYEES,rules:p.rules||DEFAULT_RULES,fixedVacations:p.fixedVacations||DEFAULT_FIXED,bookedVacations:p.bookedVacations||DEFAULT_BOOKED,meldungTypes:p.meldungTypes||DEFAULT_MELDUNGEN,vacationRecipientIds:p.vacationRecipientIds||DEFAULT_VAC_RECIPIENTS,sentItems:p.sentItems||[]}; }
  } catch(e){}
  return {employees:DEFAULT_EMPLOYEES,rules:DEFAULT_RULES,fixedVacations:DEFAULT_FIXED,bookedVacations:DEFAULT_BOOKED,meldungTypes:DEFAULT_MELDUNGEN,vacationRecipientIds:DEFAULT_VAC_RECIPIENTS,sentItems:[]};
}
function saveData(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch(e){}}

function getAllVacs(data){
  const all=[...(data.bookedVacations||[])];
  for(const fv of (data.fixedVacations||[])) for(const eid of fv.employeeIds){const e=data.employees.find(x=>x.id===eid);if(e)all.push({employeeId:eid,name:e.name,role:e.role,lkwGross:e.lkwGross,lkwKlein:e.lkwKlein,from:fv.from,to:fv.to,fixed:true,label:fv.label});}
  return all;
}

function checkConflict(from,to,emp,data){
  if(!from||!to||from>to) return null;
  const rules=data.rules;
  let d=new Date(from);const end=new Date(to);
  while(d<=end){if((rules.blockedMonths||[]).includes(d.getMonth())) return {msg:`Im ${d.toLocaleDateString("de-DE",{month:"long"})} ist kein Urlaub möglich.`}; d.setDate(d.getDate()+1);}
  const sb=rules.summerBlock;
  if(sb&&from<=sb.end&&to>=sb.start){const inGroup=(data.fixedVacations||[]).some(fv=>fv.employeeIds.includes(emp.id)&&from>=fv.from&&to<=fv.to);if(!inGroup) return {msg:"Sommerblock: Urlaub nur für eingeplante Gruppen möglich."};}
  const all=getAllVacs(data);
  function maxOv(fn){let m=0;let dd=new Date(from);while(dd<=new Date(to)){const ds=dd.toISOString().split("T")[0];const c=all.filter(v=>v.employeeId!==emp.id&&fn(v)&&dateInRange(ds,v.from,v.to)).length;if(c>m)m=c;dd.setDate(dd.getDate()+1);}return m;}
  if(emp.lkwGross&&maxOv(v=>v.lkwGross)>=rules.maxLkwGross) return {msg:`Bereits ${rules.maxLkwGross} LKW-Groß-Fahrer im Urlaub.`};
  if(emp.lkwKlein&&!emp.lkwGross&&maxOv(v=>v.lkwKlein&&!v.lkwGross)>=rules.maxLkwKlein) return {msg:`Bereits ${rules.maxLkwKlein} LKW-Klein-Fahrer im Urlaub.`};
  if(emp.role==="Vorarbeiter"&&maxOv(v=>v.role==="Vorarbeiter")>=rules.maxVorarbeiter) return {msg:`Bereits ${rules.maxVorarbeiter} Vorarbeiter im Urlaub.`};
  return null;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S={
  page:{minHeight:"100vh",background:"#0d0f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#e8eaf0",display:"flex",flexDirection:"column"},
  card:{background:"#14161f",border:"1px solid #1e2130",borderRadius:14,padding:16},
  input:{width:"100%",background:"#0d0f18",border:"1px solid #1e2130",borderRadius:8,padding:"10px 12px",color:"#e8eaf0",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
  btn:{background:"linear-gradient(135deg,#e11d48,#be123c)",border:"none",borderRadius:10,padding:"13px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%",transition:"all 0.15s"},
  btnGhost:{background:"none",border:"1px solid #1e2130",borderRadius:8,padding:"7px 12px",color:"#6b7280",fontSize:12,cursor:"pointer"},
  back:{background:"none",border:"none",color:"#e11d48",cursor:"pointer",fontSize:13,padding:"0 0 14px 0",display:"flex",alignItems:"center",gap:4},
  label:{fontSize:9,color:"#4b5563",marginBottom:5,fontWeight:700,letterSpacing:"1px",display:"block"},
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({size=1}){
  return (
    <div style={{display:"flex",alignItems:"center",gap:8*size}}>
      <img src="./logo.png" alt="Klukas-Gerüste" style={{height:40*size,width:"auto"}}/>
    </div>
  );
}
// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({emp,size=36}){
  const c=roleColor(emp.role);
  return <div style={{width:size,height:size,borderRadius:"50%",background:c+"22",border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:700,color:c,flexShrink:0}}>{getInitials(emp.name)}</div>;
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
    <div style={{minHeight:"100vh",background:"#0d0f18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <Logo size={1.4}/>
      </div>
      <div style={{width:"100%",maxWidth:360,...S.card,padding:24}}>
        {!sel ? (
          <>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Anmelden</div>
            <div style={{fontSize:12,color:"#4b5563",marginBottom:14}}>Namen eingeben zum Suchen</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="z.B. Müller..." autoFocus style={S.input}/>
            {filtered.length>0&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
              {filtered.map(emp=>(
                <button key={emp.id} onClick={()=>{setSel(emp);setPw("");setErr("");}} style={{background:"#0d0f18",border:"1px solid #1e2130",borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="#e11d48"} onMouseOut={e=>e.currentTarget.style.borderColor="#1e2130"}>
                  <Avatar emp={emp} size={34}/><div><div style={{fontSize:13,fontWeight:600,color:"#e8eaf0"}}>{emp.name}</div><div style={{fontSize:11,color:roleColor(emp.role)}}>{emp.role}</div></div>
                </button>
              ))}
            </div>}
            {search.length>1&&filtered.length===0&&<div style={{marginTop:8,fontSize:12,color:"#4b5563",textAlign:"center"}}>Kein Mitarbeiter gefunden</div>}
          </>
        ):(
          <>
            <button onClick={()=>setSel(null)} style={S.back}>‹ Zurück</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,background:"#0d0f18",borderRadius:10,padding:"10px 12px"}}>
              <Avatar emp={sel} size={38}/><div><div style={{fontSize:13,fontWeight:700}}>{sel.name}</div><div style={{fontSize:11,color:roleColor(sel.role)}}>{sel.role}</div></div>
            </div>
            <label style={S.label}>PASSWORT</label>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus
              style={{...S.input,border:`1px solid ${err?"#e11d48":"#1e2130"}`,letterSpacing:"2px"}}/>
            {err&&<div style={{fontSize:11,color:"#e11d48",marginTop:6}}>{err}</div>}
            <button onClick={doLogin} style={{...S.btn,marginTop:12,background:pw?"linear-gradient(135deg,#e11d48,#be123c)":"#1e2130",color:pw?"#fff":"#374151",cursor:pw?"pointer":"not-allowed"}}>Anmelden ›</button>
          </>
        )}
      </div>
      <div style={{marginTop:14,fontSize:10,color:"#1e2130"}}>Wir helfen aufzubauen!</div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function Calendar({year,month,onChangeMonth,vacFrom,vacTo,conflict,user,data}){
  const allVacs=getAllVacs(data);
  const days=new Date(year,month+1,0).getDate();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const monthName=new Date(year,month).toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  function cell(n){
    const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
    const sel=vacFrom&&vacTo&&vacFrom<=ds&&ds<=vacTo;
    const busy=allVacs.some(v=>v.employeeId!==user.id&&dateInRange(ds,v.from,v.to));
    const blk=(data.rules?.blockedMonths||[]).includes(month);
    const sb=data.rules?.summerBlock;const sum=sb&&ds>=sb.start&&ds<=sb.end;
    if(sel&&conflict) return {bg:"#2a1010",bd:"1.5px solid #e11d48",c:"#f87171"};
    if(sel) return {bg:"#0e2414",bd:"1.5px solid #22c55e",c:"#4ade80"};
    if(blk) return {bg:"#160808",bd:"1px solid transparent",c:"#2a1010"};
    if(sum) return {bg:"#161608",bd:"1px solid transparent",c:"#2a2a08"};
    if(busy) return {bg:"#1a1508",bd:"1px solid #f59e0b33",c:"#6b7280"};
    return {bg:"transparent",bd:"1px solid transparent",c:"#4b5563"};
  }
  return (
    <div style={{...S.card,padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>onChangeMonth(-1)} style={{background:"none",border:"none",color:"#e11d48",fontSize:20,cursor:"pointer"}}>‹</button>
        <div style={{fontWeight:700,fontSize:13}}>{monthName}</div>
        <button onClick={()=>onChangeMonth(1)} style={{background:"none",border:"none",color:"#e11d48",fontSize:20,cursor:"pointer"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=><div key={d} style={{fontSize:9,color:"#374151",textAlign:"center",fontWeight:700}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i)=>{const s=cell(i+1);return <div key={i+1} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,fontSize:10,fontWeight:600,background:s.bg,border:s.bd,color:s.c}}>{i+1}</div>;})}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
        {[["#22c55e","Dein Antrag"],["#f59e0b","Belegt"],["#e11d48","Nicht möglich"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#6b7280"}}>
            <div style={{width:8,height:8,borderRadius:2,background:c+"33",border:`1px solid ${c}`}}/>{l}
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
    <div style={{background:"#0d0f18",border:"1.5px solid #e11d4850",borderRadius:12,padding:14,marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:"#e11d48",marginBottom:12}}>{emp.id?"Bearbeiten":"Neuer Mitarbeiter"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        {[["Name (Nachname, Vorname)","name"],["Rufname","firstName"],["E-Mail","email"],["Passwort","password"]].map(([l,k])=>(
          <div key={k}><label style={S.label}>{l.toUpperCase()}</label><input value={emp[k]||""} onChange={e=>set(k,e.target.value)} style={{...S.input,fontSize:11,padding:"7px 8px"}}/></div>
        ))}
      </div>
      <div style={{marginBottom:8}}>
        <label style={S.label}>ROLLE</label>
        <select value={emp.role} onChange={e=>set("role",e.target.value)} style={{...S.input,fontSize:11,padding:"7px 8px"}}>
          {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        {[["LKW Groß","lkwGross"],["LKW Klein","lkwKlein"],["PKW","pkw"],["Admin","isAdmin"]].map(([l,k])=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9ca3af",cursor:"pointer"}}>
            <input type="checkbox" checked={!!emp[k]} onChange={e=>set(k,e.target.checked)} style={{accentColor:"#e11d48"}}/>{l}
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
      <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>⚙ Admin-Bereich</div>
      <div style={{fontSize:12,color:"#4b5563",marginBottom:16}}>Nur für Administratoren</div>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {[["employees","Mitarbeiter"],["rules","Regeln"],["sent","Meldungen"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?"#e11d4820":"#14161f",border:tab===k?"1.5px solid #e11d48":"1px solid #1e2130",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?"#e11d48":"#6b7280"}}>{l}</button>
        ))}
      </div>

      {tab==="employees"&&(
        <div>
          <button onClick={()=>setNewEmp({name:"",firstName:"",role:"Monteur",email:"",lkwGross:false,lkwKlein:false,pkw:false,password:"",isAdmin:false})}
            style={{width:"100%",...S.card,border:"1px dashed #e11d4860",padding:"10px",cursor:"pointer",color:"#e11d48",fontWeight:600,fontSize:13,marginBottom:12,textAlign:"center"}}>
            + Neuen Mitarbeiter hinzufügen
          </button>
          {newEmp&&<EmpForm emp={newEmp} onSave={saveEmp} onCancel={()=>setNewEmp(null)}/>}
          {data.employees.map(emp=>(
            <div key={emp.id}>
              {editEmp?.id===emp.id?<EmpForm emp={editEmp} onSave={saveEmp} onCancel={()=>setEditEmp(null)}/>:(
                <div style={{...S.card,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                  <Avatar emp={emp} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                      {emp.name}{emp.isAdmin&&<span style={{fontSize:9,background:"#e11d4820",color:"#e11d48",padding:"1px 5px",borderRadius:10}}>Admin</span>}
                    </div>
                    <div style={{fontSize:10,color:"#4b5563"}}>{emp.role} · {emp.email}</div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setEditEmp({...emp})} style={{...S.btnGhost,padding:"4px 8px",fontSize:11}}>✏</button>
                    <button onClick={()=>delEmp(emp.id)} style={{...S.btnGhost,padding:"4px 8px",fontSize:11,color:"#e11d48"}}>✕</button>
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
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Urlaubsregeln</div>
            {[["maxLkwGross","Max. LKW-Groß gleichzeitig"],["maxLkwKlein","Max. LKW-Klein gleichzeitig"],["maxVorarbeiter","Max. Vorarbeiter gleichzeitig"]].map(([k,l])=>(
              <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:12,color:"#9ca3af"}}>{l}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>setRules(p=>({...p,[k]:Math.max(1,(p[k]||1)-1)}))} style={{width:28,height:28,background:"#0d0f18",border:"1px solid #1e2130",borderRadius:6,color:"#e11d48",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:20,textAlign:"center"}}>{rules[k]}</span>
                  <button onClick={()=>setRules(p=>({...p,[k]:(p[k]||1)+1}))} style={{width:28,height:28,background:"#0d0f18",border:"1px solid #1e2130",borderRadius:6,color:"#e11d48",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Sommerblock</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Von","start"],["Bis","end"]].map(([l,k])=>(
                <div key={k}><label style={S.label}>{l}</label>
                  <input type="date" value={rules.summerBlock?.[k]||""} onChange={e=>setRules(p=>({...p,summerBlock:{...p.summerBlock,[k]:e.target.value}}))} style={{...S.input,fontSize:11,padding:"7px 8px"}}/>
                </div>
              ))}
            </div>
          </div>
          <button onClick={saveRules} style={{...S.btn,background:saved?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#e11d48,#be123c)"}}>
            {saved?"✓ Gespeichert!":"Regeln speichern"}
          </button>
        </div>
      )}

      {tab==="sent"&&(
        <div>
          <div style={{fontSize:12,color:"#4b5563",marginBottom:12}}>Alle eingegangenen Meldungen & Anträge</div>
          {(data.sentItems||[]).length===0&&<div style={{textAlign:"center",color:"#4b5563",fontSize:13,padding:24}}>Noch keine Meldungen vorhanden</div>}
          {[...(data.sentItems||[])].reverse().map((item,i)=>{
            const emp=data.employees.find(e=>e.id===item.employeeId);
            return (
              <div key={i} style={{...S.card,borderRadius:10,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700}}>{item.label}</div>
                  <div style={{fontSize:10,color:"#4b5563"}}>{item.date}</div>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:4}}>Von: <span style={{color:"#e8eaf0"}}>{emp?.name||"?"}</span> ({emp?.role})</div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:item.text?6:0}}>An: <span style={{color:"#e11d48"}}>{item.to}</span></div>
                {item.text&&<div style={{fontSize:11,color:"#6b7280",background:"#0d0f18",borderRadius:6,padding:"6px 8px"}}>{item.text}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [data,setData]=useState(loadData());
  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [successMsg,setSuccessMsg]=useState("");

  // Meldung state
  const [mKey,setMKey]=useState(null);
  const [mText,setMText]=useState("");
  const [mRecip,setMRecip]=useState(null);

  // Urlaub state
  const [vFrom,setVFrom]=useState("");
  const [vTo,setVTo]=useState("");
  const [conflict,setConflict]=useState(null);
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calMonth,setCalMonth]=useState(new Date().getMonth());

  useEffect(()=>{if(vFrom&&vTo&&user) setConflict(checkConflict(vFrom,vTo,user,data)); else setConflict(null);},[vFrom,vTo,user]);

  function updateData(d){setData(d);saveData(d);}

  function addSent(item){
    const newData={...data,sentItems:[...(data.sentItems||[]),item]};
    updateData(newData);
  }

  function handleSuccess(msg,item){
    if(item) addSent(item);
    setSuccessMsg(msg);
    setView("success");
  }

  if(!user) return <Login employees={data.employees} onLogin={u=>{setUser(u);setView("dashboard");}}/>;

  const mt=data.meldungTypes?.find(m=>m.key===mKey);
  function getRecips(m){return (m?.recipientIds||[]).map(id=>data.employees.find(e=>e.id===id)).filter(Boolean);}
  function canSendMeldung(){if(!mt||!mText.trim()) return false;if(mt.multiSelect&&!mRecip) return false;return true;}

  function submitMeldung(){
    if(!canSendMeldung()) return;
    const recips=mt.multiSelect?[data.employees.find(e=>e.id===mRecip)?.name].filter(Boolean):getRecips(mt).map(r=>r.name);
    const toStr=recips.join(", ");
    handleSuccess(`Deine Meldung wurde weitergeleitet an: ${toStr}.`,{id:Date.now(),employeeId:user.id,type:"meldung",label:mt.label,text:mText,to:toStr,date:new Date().toLocaleDateString("de-DE")});
    setMKey(null);setMText("");setMRecip(null);
  }

  function submitUrlaub(){
    if(!vFrom||!vTo||conflict) return;
    const recNames=(data.vacationRecipientIds||[]).map(id=>data.employees.find(e=>e.id===id)?.name).filter(Boolean).join(", ");
    handleSuccess(`Dein Urlaubsantrag (${vFrom} – ${vTo}) wurde an ${recNames} weitergeleitet.`,{id:Date.now(),employeeId:user.id,type:"urlaub",label:"Urlaubsantrag",text:`${vFrom} – ${vTo}`,to:recNames,date:new Date().toLocaleDateString("de-DE")});
    setVFrom("");setVTo("");
  }

  function changeMonth(d){let m=calMonth+d,y=calYear;if(m<0){m=11;y--;}if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);}

  const allVacs=getAllVacs(data);
  const upcoming=allVacs.filter(v=>v.to>=new Date().toISOString().split("T")[0]).slice(0,5);
  const myItems=(data.sentItems||[]).filter(s=>s.employeeId===user.id).slice(-3).reverse();

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={{background:"#14161f",borderBottom:"1px solid #1e2130"}}>
        <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Logo/>
          <div style={{display:"flex",gap:6}}>
            {user.isAdmin&&<button onClick={()=>setView("admin")} style={{background:"#e11d4820",border:"1px solid #e11d4850",borderRadius:6,padding:"5px 10px",color:"#e11d48",fontSize:11,cursor:"pointer",fontWeight:600}}>⚙ Admin</button>}
            <button onClick={()=>{setUser(null);setView("dashboard");}} style={S.btnGhost}>Abmelden</button>
          </div>
        </div>
        <div style={{padding:"8px 16px 10px",display:"flex",alignItems:"center",gap:10,borderTop:"1px solid #1e2130"}}>
          <Avatar emp={user} size={34}/>
          <div><div style={{fontWeight:700,fontSize:13}}>Hallo, {user.firstName}!</div><div style={{fontSize:10,color:roleColor(user.role)}}>{user.role}</div></div>
        </div>
      </div>

      <div style={{flex:1,padding:16,maxWidth:480,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div>
            <div style={{fontSize:18,fontWeight:800,marginBottom:2,letterSpacing:"-0.4px"}}>Was möchtest du melden?</div>
            <div style={{fontSize:12,color:"#4b5563",marginBottom:20}}>Wähle eine Kategorie</div>
            {[{icon:"📋",title:"Meldung senden",desc:"Arbeitsmittel · Gespräch · Krankheit",to:"meldung"},{icon:"🏖️",title:"Urlaub beantragen",desc:"Kalender & Verfügbarkeit prüfen",to:"urlaub"}].map((item,i)=>(
              <button key={i} onClick={()=>setView(item.to)} style={{width:"100%",...S.card,padding:"16px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.borderColor="#e11d48";e.currentTarget.style.background="#1a0f10";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#1e2130";e.currentTarget.style.background="#14161f";}}>
                <div style={{fontSize:26}}>{item.icon}</div>
                <div><div style={{fontWeight:700,fontSize:14}}>{item.title}</div><div style={{fontSize:11,color:"#4b5563",marginTop:2}}>{item.desc}</div></div>
                <div style={{marginLeft:"auto",color:"#e11d48",fontSize:20}}>›</div>
              </button>
            ))}
            {myItems.length>0&&<div style={{marginTop:24}}>
              <div style={{fontSize:10,fontWeight:700,color:"#4b5563",marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Deine letzten Meldungen</div>
              {myItems.map((item,i)=>(
                <div key={i} style={{...S.card,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:18}}>{item.type==="urlaub"?"🏖️":"📋"}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{item.label}</div><div style={{fontSize:10,color:"#4b5563"}}>An: {item.to} · {item.date}</div></div>
                  <div style={{fontSize:9,background:"#22c55e15",color:"#22c55e",padding:"3px 7px",borderRadius:20,fontWeight:600}}>✓ Gesendet</div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* MELDUNG */}
        {view==="meldung"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>Meldung senden</div>
            <div style={{fontSize:12,color:"#4b5563",marginBottom:18}}>Was möchtest du melden?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18}}>
              {(data.meldungTypes||[]).map(t=>(
                <button key={t.key} onClick={()=>{setMKey(t.key);setMRecip(null);}} style={{background:mKey===t.key?"#1a0f10":"#14161f",border:mKey===t.key?"1.5px solid #e11d48":"1px solid #1e2130",borderRadius:12,padding:"14px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{t.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:"#e8eaf0"}}>{t.label}</div>
                  <div style={{fontSize:9,color:"#4b5563",marginTop:2}}>{t.desc}</div>
                </button>
              ))}
            </div>
            {mt&&(
              <div style={{...S.card,border:"1px solid #e11d4833",marginBottom:14,fontSize:11}}>
                {mt.multiSelect?(
                  <div>
                    <div style={{color:"#4b5563",marginBottom:8}}>Gesprächspartner wählen:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {getRecips(mt).map(r=>(
                        <button key={r.id} onClick={()=>setMRecip(r.id)} style={{background:mRecip===r.id?"#e11d4822":"#0d0f18",border:mRecip===r.id?"1.5px solid #e11d48":"1px solid #1e2130",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,color:mRecip===r.id?"#e11d48":"#9ca3af",transition:"all 0.15s"}}>
                          {r.firstName} {r.name.split(", ")[0]}
                        </button>
                      ))}
                    </div>
                    {mt.coordinatorId&&(()=>{const c=data.employees.find(e=>e.id===mt.coordinatorId);return c?<div style={{marginTop:8,color:"#4b5563",fontSize:10}}>Koordiniert über: <span style={{color:"#e11d48"}}>{c.name}</span></div>:null;})()}
                  </div>
                ):(
                  <div>📨 Wird gesendet an: <span style={{color:"#e11d48",fontWeight:600}}>{getRecips(mt).map(r=>r.name).join(", ")}</span></div>
                )}
              </div>
            )}
            <textarea value={mText} onChange={e=>setMText(e.target.value)} placeholder="Beschreibe dein Anliegen..." rows={4}
              style={{...S.input,resize:"none",fontSize:13,padding:"10px 12px"}}/>
            <button onClick={submitMeldung} disabled={!canSendMeldung()} style={{...S.btn,marginTop:10,background:canSendMeldung()?"linear-gradient(135deg,#e11d48,#be123c)":"#1e2130",color:canSendMeldung()?"#fff":"#374151",cursor:canSendMeldung()?"pointer":"not-allowed"}}>
              Meldung absenden ›
            </button>
          </div>
        )}

        {/* URLAUB */}
        {view==="urlaub"&&(
          <div>
            <button onClick={()=>setView("dashboard")} style={S.back}>‹ Zurück</button>
            <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>Urlaub beantragen</div>
            <div style={{fontSize:12,color:"#4b5563",marginBottom:16}}>Zeitraum wählen & Verfügbarkeit prüfen</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[["VON",vFrom,setVFrom],["BIS",vTo,setVTo]].map(([l,val,setter])=>(
                <div key={l}><label style={S.label}>{l}</label>
                  <input type="date" value={val} onChange={e=>setter(e.target.value)} style={{...S.input,fontSize:12,padding:"9px 10px"}}/>
                </div>
              ))}
            </div>
            {vFrom&&vTo&&vFrom<=vTo&&(
              <div style={{background:conflict?"#1a0808":"#081a0e",border:`1px solid ${conflict?"#e11d48":"#22c55e"}`,borderRadius:10,padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{fontSize:18,flexShrink:0}}>{conflict?"🚫":"✅"}</span>
                <div>
                  <div style={{fontWeight:700,color:conflict?"#e11d48":"#22c55e",fontSize:13,marginBottom:2}}>{conflict?"Buchung nicht möglich":"Zeitraum verfügbar"}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{conflict?conflict.msg:"Du kannst diesen Zeitraum beantragen."}</div>
                </div>
              </div>
            )}
            <Calendar year={calYear} month={calMonth} onChangeMonth={changeMonth} vacFrom={vFrom} vacTo={vTo} conflict={!!conflict} user={user} data={data}/>
            {upcoming.length>0&&<div style={{marginTop:14,marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#4b5563",marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Aktuelle Urlaubsbuchungen</div>
              {upcoming.map((v,i)=>(
                <div key={i} style={{...S.card,borderRadius:8,padding:"8px 10px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:11,fontWeight:600}}>{v.name}</div><div style={{fontSize:10,color:"#4b5563"}}>{v.role}{v.fixed?" · Pflicht":""}</div></div>
                  <div style={{fontSize:10,color:"#f59e0b",fontWeight:600}}>{v.from.slice(5)} – {v.to.slice(5)}</div>
                </div>
              ))}
            </div>}
            <button onClick={submitUrlaub} disabled={!vFrom||!vTo||vFrom>vTo||!!conflict}
              style={{...S.btn,background:(!vFrom||!vTo||vFrom>vTo||!!conflict)?"#1e2130":"linear-gradient(135deg,#e11d48,#be123c)",color:(!vFrom||!vTo||vFrom>vTo||!!conflict)?"#374151":"#fff",cursor:"pointer"}}>
              Urlaubsantrag senden ›
            </button>
          </div>
        )}

        {/* ADMIN */}
        {view==="admin"&&user.isAdmin&&<Admin data={data} updateData={updateData} setView={setView}/>}

        {/* SUCCESS */}
        {view==="success"&&(
          <div style={{textAlign:"center",paddingTop:50}}>
            <div style={{fontSize:60,marginBottom:16}}>✅</div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:10,letterSpacing:"-0.4px"}}>Erfolgreich gesendet!</div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.7,marginBottom:32,padding:"0 10px"}}>{successMsg}</div>
            <button onClick={()=>setView("dashboard")} style={{...S.btn,width:"auto",padding:"13px 30px"}}>Zurück zur Übersicht</button>
          </div>
        )}
      </div>
      <div style={{borderTop:"1px solid #1e2130",padding:"8px 16px",textAlign:"center"}}>
        <div style={{fontSize:9,color:"#1e2130"}}>KLUKAS-GERÜSTE GmbH · Wir helfen aufzubauen!</div>
      </div>
    </div>
  );
}
