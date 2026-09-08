"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson,errorMessage } from "@/lib/client-api";
export function DeleteUserButton({userId,userName}:{userId:string;userName:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),router=useRouter();
 return <div><button className="text-red-400" disabled={busy} onClick={async()=>{if(!confirm("Deactivate "+userName+"? Their history is retained, sessions are revoked, and open assignments return to the queue."))return;setBusy(true);try{await requestJson("/api/users/"+userId,{method:"DELETE"});router.refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>Deactivate</button>{error&&<p role="alert" className="text-red-400">{error}</p>}</div>;
}