"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { requestJson,jsonOptions,errorMessage } from "@/lib/client-api";
type PushState={enabled:boolean;ready:boolean;busy:boolean;error:string;available:boolean;toggle:()=>Promise<void>;detach:()=>Promise<void>};
const Context=createContext<PushState|null>(null);
function keyBytes(value:string){const text=atob(value.replaceAll("-","+").replaceAll("_","/"));return Uint8Array.from(text,c=>c.charCodeAt(0));}
export function PushProvider({children}:{children:ReactNode}){
  const {data:session,status}=useSession();
  const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const available=!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  useEffect(()=>{
    if(status==="loading")return;
    let active=true;
    void Promise.resolve().then(async()=>{
      if(!("serviceWorker" in navigator)||!("PushManager" in window)){if(active)setReady(false);return;}
      const registration=await navigator.serviceWorker.register("/sw.js");
      const subscription=await registration.pushManager.getSubscription();
      if(!active)return;
      if(subscription){
        if(session?.user?.id)await requestJson("/api/push/subscribe",jsonOptions("POST",subscription.toJSON()));
        else await subscription.unsubscribe();
      }
      if(active){setEnabled(!!subscription&&!!session?.user?.id);setReady(true);}
    }).catch(e=>{if(active)setError(errorMessage(e));});
    return()=>{active=false;};
  },[session?.user?.id,status]);
  const detach=useCallback(async()=>{
    if(!("serviceWorker" in navigator))return;
    const registration=await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription=await registration?.pushManager.getSubscription();
    if(subscription){
      // Invalidate the browser endpoint even if the server is temporarily unavailable.
      await subscription.unsubscribe();
      if(session?.user?.id)await requestJson("/api/push/subscribe",jsonOptions("DELETE",{endpoint:subscription.endpoint}));
    }
    setEnabled(false);
  },[session?.user?.id]);
  async function toggle(){
    setBusy(true);setError("");
    try{
      if(enabled){await detach();return;}
      const registration=await navigator.serviceWorker.ready;
      const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)});
      try{await requestJson("/api/push/subscribe",jsonOptions("POST",sub.toJSON()));setEnabled(true);}catch(e){await sub.unsubscribe();throw e;}
    }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }
  return <Context.Provider value={{enabled,ready,busy,error,available,toggle,detach}}>{children}</Context.Provider>;
}
export function usePush(){const value=useContext(Context);if(!value)throw new Error("PushProvider missing");return value;}
export function PushManager(){
  const state=usePush();
  return <div><button className="text-sm text-indigo-300" disabled={!state.ready||!state.available||state.busy} onClick={state.toggle}>{!state.available?"Push unavailable":state.busy?"Updating?":state.enabled?"Disable push":"Enable push"}</button>{state.error&&<p role="alert" className="text-red-400 text-xs max-w-64">{state.error}</p>}</div>;
}