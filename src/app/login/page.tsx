"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client-api";
export default function Login(){
 const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 return <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-16"><div className="max-w-md mx-auto space-y-5"><h1 className="text-3xl font-semibold">Sign in to Tickety</h1><form className="panel space-y-4" onSubmit={async e=>{e.preventDefault();const fields=new FormData(e.currentTarget);setBusy(true);setError("");try{const result=await signIn("credentials",{email:String(fields.get("email")).trim().toLowerCase(),password:String(fields.get("password")),redirect:false});if(result?.error)throw new Error(result.error==="CredentialsSignin"?"Email or password is incorrect":result.error);router.push("/");router.refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>
 {error&&<p role="alert" className="text-red-400">{error}</p>}<label className="block">Email<input className="field" type="email" name="email" autoComplete="email" required/></label><label className="block">Password<input className="field" type="password" name="password" autoComplete="current-password" required maxLength={72}/></label><button className="btn" disabled={busy}>{busy?"Signing in?":"Sign in"}</button></form><p className="text-sm text-neutral-400">Forgot your password? Contact your administrator for a one-time reset link.</p><Link className="text-indigo-400" href="/register">Create employee account</Link></div></main>;
}