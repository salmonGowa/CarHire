import { useState } from "react";
import { Car } from "lucide-react";

/** A vehicle photo that falls back to a neutral placeholder when it's missing or fails to load. */
export default function VehicleImage({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <div role="img" aria-label={alt} className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900`}>
        <Car className="w-1/4 h-1/4 max-w-16 max-h-16 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={className} />;
}
