"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Card, SectionTitle } from "@/components/ui";
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function InstallPage() {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const install = async () => {
    if (!deferred) {
      setMsg("         «Install app»  «   »  .");
      return;
    }
    await deferred.prompt();
    const res = await deferred.userChoice;
    if (res.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <SectionTitle icon="">   </SectionTitle>
      {installed ? <Alert kind="success">       .</Alert> : null}
      {msg ? <Alert kind="info">{msg}</Alert> : null}
      <Card>
        <p className="mb-3 text-sm text-slate-600">
               (PWA)              
             <b>   </b>.

        </p>
        <Button onClick={install} className="w-full sm:w-auto">
               
        </Button>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800"> </h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>    Chrome  .</li>
          <li> « »         «Install app /    ».</li>
          <li>       .</li>
        </ol>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">  (iOS)</h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>   Safari  .</li>
          <li>  (  )  .</li>
          <li> «Add to Home Screen»   .</li>
        </ol>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800"> </h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>   Chrome  Edge  .</li>
          <li>  (⊕)       → «Install».</li>
          <li>   Start         .</li>
        </ol>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">   APK </h3>
        <Alert kind="success">
             PWABuilder  :      (PNG)  maskable 
                (id)  manifest.
        </Alert>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>
            {" "}
            <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="font-bold text-teal-700 und
erline">
              PWABuilder.com
            </a>{" "}
               <b>  </b> (  login)   .
          </li>
          <li> Refresh/Retest    manifest    —   .</li>
          <li> «Package For Stores» → Android    APK/AAB   .</li>
          <li>    «Download Test Package»    APK      .</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://www.pwabuilder.com/reportcard?site="
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white"
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://www.pwabuilder.com/reportcard?site=${window.location.origin}/`, "_blank");
            }}
          >
              APK  PWABuilder
          </a>
          <a
            href="/manifest.webmanifest"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300"
          >
             manifest
          </a>
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">    </h3>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt=" " className="size-20 rounded-2xl ring-1 ring-slate-200" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/maskable-512.png" alt=" maskable" className="size-20 rounded-2xl ring-1 ring-slate-200" 
/>
          <div className="text-xs leading-6 text-slate-600">

                   maskable  apple-touch-icon     .
          </div>
        </div>
      </Card>
    </main>
  );
}
