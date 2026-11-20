import { useState } from "react";
import { Car, Info, MapPin } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import { AccountCard, SectionHeading, Toast } from "./AccountUi";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/lib/useToast";
import type { Profile } from "@/types/account";

export default function CustomerPreference({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [types, setTypes] = useState<string[]>(profile.preferences.preferred_vehicle_types);
  const [pickup, setPickup] = useState(profile.preferences.default_pickup_location ?? "");
  const [saving, setSaving] = useState(false);
  const { toast, show } = useToast();
  const toggleType = (t: string) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const save = async () => {
    setSaving(true);
    try {
      onSaved((await api<{ data: Profile }>("/api/profile/preferences", { method: "PUT", body: { preferred_vehicle_types: types, default_pickup_location: pickup.trim() || null } })).data);
      show("Preferences saved");
    } catch (err) {
      show(errorMessage(err), true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading title="Preferences" sub="Shortcuts for booking faster." />

      <AccountCard title="Vehicle types I usually rent" icon={<Car className="w-5 h-5 text-blue-500" />} sub="Listed first when you browse vehicles.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred vehicle types">
          {profile.vehicle_types.map((t) => (
            <button key={t} type="button" onClick={() => toggleType(t)} aria-pressed={types.includes(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${types.includes(t)
                ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400"}`}>{t}</button>
          ))}
        </div>
      </AccountCard>

      <AccountCard title="Usual pickup location" icon={<MapPin className="w-5 h-5 text-emerald-500" />} sub="Filled in for you when you book. You can still change it per booking.">
        <Input label="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. JKIA Terminal 1A, Westlands, Nyali" />
      </AccountCard>

      <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="w-4 h-4 shrink-0" /> All prices are in Kenya shillings (KES) and the app is in English for now.</p>
      <div className="flex justify-end"><Button onClick={save} disabled={saving} className="px-8">{saving ? "Saving…" : "Save Preferences"}</Button></div>
      <Toast message={toast?.message ?? null} error={toast?.error} />
    </div>
  );
}
