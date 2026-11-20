import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import Button from "../components/Button";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrors({ password_confirmation: "The passwords don't match." });
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: { token, email, password, password_confirmation: confirm } });
      navigate("/login?reset=1", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthCard title="Link incomplete" subtitle="This page needs the full link from the reset email.">
        <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:underline">Request a new reset link</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle={<>For <strong>{email}</strong>. You'll be signed out on every other device.</>}>
      <form onSubmit={submit} className="space-y-5">
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required autoComplete="new-password" placeholder="At least 8 characters" />
        <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.password_confirmation} required autoComplete="new-password" />
        {(errors.email || errors.token || errors.form) && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {errors.email ?? errors.token ?? errors.form} <Link to="/forgot-password" className="font-semibold underline">Get a new link</Link>
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0">Set new password</Button>
      </form>
      <Link to="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>
    </AuthCard>
  );
}
