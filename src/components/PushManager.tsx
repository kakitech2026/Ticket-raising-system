"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY || ""),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to subscribe user:", error);
      alert("Failed to enable notifications. Please check browser permissions.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribeUser : subscribeUser}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isSubscribed 
          ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" 
          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
      }`}
      title={isSubscribed ? "Disable Desktop Notifications" : "Enable Desktop Notifications"}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellRing className="w-4 h-4" />
          <span className="hidden sm:inline">Push Enabled</span>
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          <span className="hidden sm:inline">Enable Push</span>
        </>
      )}
    </button>
  );
}
