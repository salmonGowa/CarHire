import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import Button from "../components/Button";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSent(res.message);
      setError(undefined);
    } catch (err) {
      const errors = fieldErrors(err);
      setError(errors.email ?? errors.form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter the email you sign in with and we'll send you a link to choose a new one.">
      {sent ? (
        <div role="status" className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 text-sm">
            <MailCheck className="w-5 h-5 shrink-0" /> <p>{sent}</p>
          </div>
          <p className="text-sm text-slate-500">Didn't get it? Check spam, or <button type="button" onClick={() => setSent(null)} className="text-blue-600 font-semibold hover:underline">try again</button>.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required autoComplete="email" placeholder="name@company.com" />
          <Button type="submit" fullWidth size="lg" loading={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0">Send reset link</Button>
        </form>
      )}
      <Link to="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>
    </AuthCard>
  );
}
