"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson,jsonOptions,errorMessage } from "@/lib/client-api";
export function UserAdmin(){
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),router=useRouter();
 return <details className="panel"><summary className="cursor-pointer font-medium">Provision an account</summary><form className="space-y-3 mt-4" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);setError("");try{await requestJson("/api/users",jsonOptions("POST",Object.fromEntries(new FormData(form))));form.reset();router.refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>{error&&<p role="alert" className="text-red-400">{error}</p>}<label className="block">Name<input className="field" name="name" required maxLength={160}/></label><label className="block">Email<input className="field" type="email" name="email" required/></label><label className="block">Initial password<input className="field" type="password" name="password" required minLength={12} maxLength={72} autoComplete="new-password"/></label><label className="block">Role<select className="field" name="role"><option>TECH</option><option>EMPLOYEE</option><option>ADMIN</option></select></label><button className="btn" disabled={busy}>Create account</button></form></details>;
}
export function ResetUser({userId}:{userId:string}){
 const [link,setLink]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 return <div className="space-y-2"><button disabled={busy} onClick={async()=>{if(!confirm("Issue a one-time reset link and revoke this account's sessions?"))return;setBusy(true);try{const data=await requestJson<{path:string}>("/api/users/"+userId+"/reset",{method:"POST"});setLink(window.location.origin+data.path);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>Issue reset link</button>{link&&<label className="block text-xs">Private link, valid one hour. Share securely with this user.<input readOnly className="field" value={link} onFocus={e=>e.target.select()}/></label>}{error&&<p role="alert" className="text-red-400">{error}</p>}</div>;
}