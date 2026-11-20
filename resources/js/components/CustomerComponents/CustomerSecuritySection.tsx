import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, KeyRound, LogOut, Trash2, X } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import { AccountCard, SectionHeading, Toast } from "./AccountUi";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useToast } from "@/lib/useToast";

export default function CustomerSecuritySection() {
  const [pw, setPw] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<"signout" | "delete" | null>(null);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [dialogError, setDialogError] = useState("");
  const { toast, show } = useToast();

  const strength = [pw.password.length >= 8, /[A-Z]/.test(pw.password) && /[a-z]/.test(pw.password), /\d/.test(pw.password), /[^A-Za-z0-9]/.test(pw.password)].filter(Boolean).length;

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api<{ message: string }>("/api/profile/password", { method: "PUT", body: pw });
      setPw({ current_password: "", password: "", password_confirmation: "" });
      setPwErrors({});
      show(res.message);
    } catch (err) {
      setPwErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const closeDialog = () => { setConfirm(null); setPassword(""); setTyped(""); setDialogError(""); };
  const runDialog = async () => {
    try {
      if (confirm === "signout") {
        const res = await api<{ message: string }>("/api/profile/sign-out-others", { method: "POST", body: { password } });
        closeDialog();
        show(res.message);
      } else {
        await api("/api/profile", { method: "DELETE", body: { password } });
        window.location.assign("/");
      }
    } catch (err) {
      setDialogError(fieldErrors(err).password ?? errorMessage(err));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading title="Security & Privacy" sub="Your password, where you're signed in, and closing your account." />

      <AccountCard title="Change password" icon={<KeyRound className="w-5 h-5 text-blue-500" />} sub="Changing it signs you out everywhere else.">
        <form onSubmit={changePassword} className="space-y-4 max-w-lg">
          <Input label="Current password" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} error={pwErrors.current_password} autoComplete="current-password" required />
          <div>
            <Input label="New password" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={pwErrors.password} autoComplete="new-password" required />
            {pw.password && (
              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex gap-1 flex-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength >= 3 ? "bg-emerald-500" : "bg-amber-500") : "bg-slate-200 dark:bg-slate-700"}`} />)}</div>
                <span className="text-xs font-bold text-slate-500">{pw.password.length < 8 ? "At least 8 characters" : strength >= 3 ? "Strong" : "Add numbers or symbols"}</span>
              </div>
            )}
          </div>
          <Input label="Confirm new password" type="password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} autoComplete="new-password" required />
          <Button type="submit" disabled={saving}>{saving ? "Updating…" : "Update Password"}</Button>
        </form>
      </AccountCard>

      <AccountCard title="Signed-in devices" icon={<LogOut className="w-5 h-5 text-violet-500" />}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Lost a phone or used a shared computer? Sign out of DriveFleet everywhere except this browser.</p>
          <Button variant="secondary" onClick={() => setConfirm("signout")} className="shrink-0">Sign out other devices</Button>
        </div>
        <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="w-4 h-4 shrink-0" /> Two-step sign-in isn't available yet.</p>
      </AccountCard>

      <AccountCard title="Close account" icon={<Trash2 className="w-5 h-5 text-rose-500" />} className="border-rose-200 dark:border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Deletes your login, profile and uploaded ID documents. Dealers keep the booking and invoice records they're required to hold. You can't close your account with a booking in progress or money owed.</p>
          <Button variant="danger" onClick={() => setConfirm("delete")} className="shrink-0">Close my account</Button>
        </div>
      </AccountCard>

      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={closeDialog}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label={confirm === "delete" ? "Close account" : "Sign out other devices"}
              className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {confirm === "delete" ? <><AlertTriangle className="w-5 h-5 text-rose-500" /> Close your account?</> : "Sign out other devices?"}
                </h3>
                <button onClick={closeDialog} aria-label="Close" className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              {confirm === "delete" && <p className="text-sm text-slate-600 dark:text-slate-400">This can't be undone. Type <strong>DELETE</strong> and enter your password to confirm.</p>}
              {confirm === "delete" && <Input label="Type DELETE" value={typed} onChange={(e) => setTyped(e.target.value)} />}
              <Input label="Your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={dialogError || undefined} autoComplete="current-password" />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={closeDialog}>Cancel</Button>
                <Button variant={confirm === "delete" ? "danger" : "primary"} onClick={runDialog} disabled={!password || (confirm === "delete" && typed !== "DELETE")}>
                  {confirm === "delete" ? "Close account" : "Sign out others"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast message={toast?.message ?? null} error={toast?.error} />
    </div>
  );
}
