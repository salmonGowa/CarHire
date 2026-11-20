import { useState, type ChangeEvent } from "react";
import { CheckCircle2, Clock, Eye, FileText, IdCard, Trash2, Upload, User, XCircle } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import { AccountCard, SectionHeading, Toast } from "./AccountUi";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useToast } from "@/lib/useToast";
import { longDate } from "@/lib/format";
import type { Profile } from "@/types/account";

const FIELDS = ["name", "email", "phone", "alt_phone", "date_of_birth", "gender", "address", "county", "national_id", "kra_pin", "licence_number", "licence_expires_on"] as const;
type Form = Record<(typeof FIELDS)[number], string> & { current_password: string };

const selectClass = "w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40";

export default function PersonalSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [form, setForm] = useState<Form>(() => ({ ...Object.fromEntries(FIELDS.map((f) => [f, profile[f] ?? ""])), current_password: "" }) as Form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadType, setUploadType] = useState(Object.keys(profile.document_types)[0]);
  const [uploading, setUploading] = useState(false);
  const { toast, show } = useToast();
  const verified = profile.kyc.status === "verified";
  const emailChanged = form.email.trim() !== profile.email;

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
      const res = await api<{ data: Profile }>("/api/profile", { method: "PUT", body });
      onSaved(res.data);
      setForm((f) => ({ ...f, current_password: "" }));
      setErrors({});
      show("Profile saved");
    } catch (err) {
      const e = fieldErrors(err);
      setErrors(e);
      show(e.form ?? "Check the highlighted fields", true);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const data = new FormData();
    data.append("type", uploadType);
    data.append("file", file);
    setUploading(true);
    try {
      const res = await api<{ data: Profile }>("/api/profile/documents", { method: "POST", form: data });
      onSaved(res.data);
      show(`${profile.document_types[uploadType]} uploaded`);
    } catch (err) {
      show(errorMessage(err), true);
    } finally {
      setUploading(false);
    }
  };
  const remove = async (id: number) => {
    try {
      onSaved((await api<{ data: Profile }>(`/api/profile/documents/${id}`, { method: "DELETE" })).data);
    } catch (err) {
      show(errorMessage(err), true);
    }
  };

  const status = {
    verified: { Icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      text: `Your identity was verified${profile.kyc.reviewed_at ? ` on ${longDate(profile.kyc.reviewed_at)}` : ""}. Your ID number and date of birth are now locked; contact support if they need correcting.` },
    pending: { Icon: Clock, tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      text: profile.documents.length ? "Thanks, your documents are waiting for review. This usually takes a working day." : "Upload a photo of your national ID (or passport) and driving licence so we can verify you." },
    rejected: { Icon: XCircle, tone: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
      text: `We couldn't verify your ID${profile.kyc.note ? `: ${profile.kyc.note}` : ""}. Upload a clearer copy and it goes back for review.` },
  }[profile.kyc.status];

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading title="Personal Information" sub="Dealers see your name and phone on bookings. ID details are only seen by DriveFleet for verification." />

      <AccountCard title="Contact details" icon={<User className="w-5 h-5 text-blue-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Full Name" value={form.name} onChange={set("name")} error={errors.name} required />
          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
          {emailChanged && (
            <div className="sm:col-span-2">
              <Input label="Current password (needed to change your email)" type="password" value={form.current_password} onChange={set("current_password")} error={errors.current_password} autoComplete="current-password" />
            </div>
          )}
          <Input label="Phone Number" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+254 7XX XXX XXX" />
          <Input label="Alternative Phone" value={form.alt_phone} onChange={set("alt_phone")} error={errors.alt_phone} />
          <Input label="Physical Address" value={form.address} onChange={set("address")} error={errors.address} placeholder="Estate, street or building" />
          <Input label="County" value={form.county} onChange={set("county")} error={errors.county} placeholder="e.g. Nairobi" />
        </div>
      </AccountCard>

      <AccountCard title="Identity & driving licence" icon={<IdCard className="w-5 h-5 text-violet-500" />}
        sub={verified ? "Verified details can't be edited here." : "Used to verify you before your first pickup."}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="National ID / Passport No." value={form.national_id} onChange={set("national_id")} error={errors.national_id} disabled={verified} />
          <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} error={errors.date_of_birth} disabled={verified} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</span>
            <select value={form.gender} onChange={set("gender")} className={selectClass}>
              <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
            </select>
          </label>
          <Input label="KRA PIN (for company invoices)" value={form.kra_pin} onChange={set("kra_pin")} error={errors.kra_pin} />
          <Input label="Driving Licence No." value={form.licence_number} onChange={set("licence_number")} error={errors.licence_number} />
          <Input label="Licence Expiry" type="date" value={form.licence_expires_on} onChange={set("licence_expires_on")} error={errors.licence_expires_on} />
        </div>
        {profile.licence_expired && <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Your driving licence has expired. Dealers can refuse to hand over a vehicle until it's renewed.</p>}
      </AccountCard>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="px-8">{saving ? "Saving…" : "Save Changes"}</Button>
      </div>

      <AccountCard title="ID verification" icon={<FileText className="w-5 h-5 text-emerald-500" />}>
        <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm ${status.tone}`}>
          <status.Icon className="w-5 h-5 shrink-0" /> <p>{status.text}</p>
        </div>

        {profile.documents.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
            {profile.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{d.label}</p>
                  <p className="text-xs text-slate-500 truncate">{d.original_name} · uploaded {longDate(d.uploaded_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`/api/documents/${d.id}/file?inline=1`} target="_blank" rel="noreferrer" aria-label={`View ${d.label}`} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye className="w-4 h-4" /></a>
                  {!verified && <button onClick={() => remove(d.id)} aria-label={`Remove ${d.label}`} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="block flex-1">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Document</span>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className={selectClass}>
              {Object.entries(profile.document_types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold cursor-pointer ${uploading ? "bg-slate-300 text-slate-600" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
            <Upload className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload photo or PDF"}
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-slate-500">Up to 5 MB. Make sure all four corners and the text are readable. Files are stored privately and only DriveFleet's verification team can open them.</p>
      </AccountCard>

      <Toast message={toast?.message ?? null} error={toast?.error} />
    </div>
  );
}
