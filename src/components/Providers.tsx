"use client";
import { SessionProvider } from "next-auth/react";
import { PushProvider } from "./PushManager";
export function Providers({children}:{children:React.ReactNode}){return <SessionProvider refetchInterval={60} refetchOnWindowFocus><PushProvider>{children}</PushProvider></SessionProvider>;}