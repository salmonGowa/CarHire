import { Bell, Info, Mail, MessageSquare, Megaphone } from "lucide-react";
import { AccountCard, SectionHeading, Switch, Toast } from "./AccountUi";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/lib/useToast";
import type { Preferences, Profile } from "@/types/account";

const CHANNELS: { key: keyof Preferences; label: string; desc: string; Icon: typeof Mail }[] = [
  { key: "email_bookings", label: "Booking emails", desc: "Confirmations, changes and cancellations.", Icon: Mail },
  { key: "email_receipts", label: "Receipt emails", desc: "A copy of each invoice and payment receipt.", Icon: Mail },
  { key: "sms_reminders", label: "SMS reminders", desc: "A text before pickup and before your return time.", Icon: MessageSquare },
  { key: "marketing", label: "Offers and news", desc: "Occasional promotions from DriveFleet dealers.", Icon: Megaphone },
];

export default function CustomerNotification({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const { toast, show } = useToast();
  const toggle = async (key: keyof Preferences, value: boolean) => {
    try {
      onSaved((await api<{ data: Profile }>("/api/profile/preferences", { method: "PUT", body: { [key]: value } })).data);
      show("Saved");
    } catch (err) {
      show(errorMessage(err), true);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading title="Notifications" sub="Choose how DriveFleet keeps you updated." />

      <AccountCard title="In the app" icon={<Bell className="w-5 h-5 text-blue-500" />}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Booking confirmations, payment receipts, replies from support and ID verification results always appear under the bell at the top of the page. These can't be switched off, because they're about your bookings and account.
        </p>
      </AccountCard>

      <AccountCard title="Email and SMS" icon={<Mail className="w-5 h-5 text-violet-500" />}>
        <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <Info className="w-4 h-4 shrink-0" /> DriveFleet doesn't send emails or texts yet. Your choices are saved and will be used once they're switched on.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {CHANNELS.map(({ key, label, desc, Icon }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-slate-400" />
                <div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
              </div>
              <Switch label={label} on={Boolean(profile.preferences[key])} onChange={(v) => toggle(key, v)} />
            </div>
          ))}
        </div>
      </AccountCard>
      <Toast message={toast?.message ?? null} error={toast?.error} />
    </div>
  );
}
