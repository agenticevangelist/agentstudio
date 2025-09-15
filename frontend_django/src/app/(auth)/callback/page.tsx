"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CallbackInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const appName = searchParams.get("appName") || undefined;

  const [message, setMessage] = useState("Completing authentication...");

  useEffect(() => {
    // This page is passive; the opener is waiting server-side.
    if (status && status.toUpperCase() === "SUCCESS") {
      setMessage(`Successfully connected${appName ? ` to ${appName}` : ""}. You can close this window.`);
      setTimeout(() => window.close(), 1500);
    } else {
      setMessage("You may close this window.");
      setTimeout(() => window.close(), 2500);
    }
  }, [status, appName]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
      <CallbackInner />
    </Suspense>
  );
}


