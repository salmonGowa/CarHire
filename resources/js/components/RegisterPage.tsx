import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type RegisterInput } from "./AuthContext";
import { ApiError } from "@/lib/api";
import { useTheme } from "./ThemeContext";
import Input from "./Input";
import Button from "./Button";
import { 
  User, 
  Store, 
  Check, 
  Sun, 
  Moon, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  MapPin, 
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

const STEPS = ["Account Type", "Your Details", "Credentials"];

const ACCOUNT_TYPES: { id: RegisterInput["role"]; icon: typeof User; label: string; desc: string }[] = [
  { id: "customer", icon: User, label: "Customer", desc: "I want to rent vehicles for personal or business use" },
  { id: "dealer",   icon: Store, label: "Car Dealer", desc: "I manage a car hire business and want to list vehicles" },
];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep]     = useState(0);
  const [type, setType]     = useState<RegisterInput["role"]>("customer");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", license: "", city: "",
    password: "", confirm: "",
  });

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.firstName) e.firstName = "Required";
      if (!form.lastName)  e.lastName = "Required";
      if (!form.email)     e.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.phone)     e.phone = "Required";
      if (type === "dealer" && !form.company) e.company = "Required";
    }
    if (step === 2) {
      if (!form.password)  e.password = "Required";
      else if (form.password.length < 8) e.password = "Minimum 8 characters";
      if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 2)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        company: type === "dealer" ? form.company : undefined,
        role: type,
        password: form.password,
        password_confirmation: form.confirm,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        // Map Laravel field names back onto the form and return to the step that has the problem.
        const fieldMap: Record<string, string> = { name: "firstName", password: "password", email: "email", phone: "phone", company: "company" };
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors)) mapped[fieldMap[field] ?? "submit"] = messages[0];
        if (mapped.email || mapped.firstName || mapped.phone || mapped.company) setStep(1);
        setErrors(mapped);
      } else {
        setErrors({ submit: err instanceof ApiError ? err.message : "Registration failed. Please try again." });
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-500 ${
      isDark ? "bg-[#030712]" : "bg-slate-50"
    }`}>
      <div className={`w-full max-w-[480px] rounded-2xl p-8 border transition-all duration-500 relative overflow-hidden ${
        isDark 
          ? "bg-[#0B1120] border-slate-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)]" 
          : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <img src="/logo.png" alt="DriveFleet Logo" className="w-10 h-10 mb-2" />
            <h2 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Create account</h2>
          </div>
          <button 
            onClick={toggleTheme} 
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700" 
                : "bg-slate-50 border-slate-200 text-indigo-500 hover:bg-slate-100"
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" strokeWidth={2} /> : <Moon className="w-5 h-5" strokeWidth={2} />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all duration-300 ${
                i < step  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : i === step 
                  ? (isDark ? "bg-slate-900 text-blue-400 border-2 border-blue-500/50 ring-4 ring-blue-500/10" : "bg-blue-50 text-blue-600 border-2 border-blue-600 ring-4 ring-blue-100")
                  : (isDark ? "bg-slate-900/50 text-slate-500 border-2 border-slate-800" : "bg-slate-50 text-slate-400 border-2 border-slate-200")
              }`}>
                {i < step ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[13px] hidden sm:inline transition-colors duration-300 ${
                i === step 
                  ? (isDark ? "text-slate-200 font-semibold" : "text-slate-900 font-bold") 
                  : (i < step ? (isDark ? "text-slate-400" : "text-slate-600") : "text-slate-500")
              }`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${i < step ? "bg-blue-600" : (isDark ? "bg-slate-800" : "bg-slate-200")}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Account type */}
        {step === 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <p className={`text-[13px] font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Select your path</p>
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                  type === t.id
                    ? isDark ? "border-blue-500 bg-blue-600/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-blue-500 bg-blue-50 shadow-sm"
                    : isDark ? "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  type === t.id 
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md" 
                    : isDark ? "bg-slate-800 text-slate-400 group-hover:text-slate-300" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                }`}>
                  <t.icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-base font-bold transition-colors ${
                    type === t.id ? (isDark ? "text-blue-400" : "text-blue-700") : (isDark ? "text-slate-200" : "text-slate-800")
                  }`}>{t.label}</p>
                  <p className={`text-[13px] mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 mt-0.5 ${
                  type === t.id 
                    ? "border-blue-500 bg-blue-500 text-white" 
                    : "border-slate-300 dark:border-slate-700 transparent text-transparent"
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              </button>
            ))}
            <Button fullWidth size="lg" onClick={next} className="mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 rounded-xl font-semibold flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="John" icon={<User className="w-4 h-4" />} required error={errors.firstName} />
              <Input label="Last Name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Doe"  icon={<User className="w-4 h-4" />} required error={errors.lastName} />
            </div>
            <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" icon={<Mail className="w-4 h-4" />} required error={errors.email} />
            <Input label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="+254 7XX XXX XXX" icon={<Phone className="w-4 h-4" />} required error={errors.phone} />
            
            {type === "dealer" && (
              <div className="space-y-5 pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                <Input label="Business Name" value={form.company} onChange={set("company")} placeholder="Acme Car Hire Ltd" icon={<Building2 className="w-4 h-4" />} required error={errors.company} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="License No." value={form.license} onChange={set("license")} placeholder="BL-XXXXXXXX" icon={<FileText className="w-4 h-4" />} />
                  <Input label="City" value={form.city} onChange={set("city")} placeholder="Nairobi" icon={<MapPin className="w-4 h-4" />} />
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2" onClick={back}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button fullWidth onClick={next} className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 rounded-xl font-semibold flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <Input label="Create Password" type="password" value={form.password} onChange={set("password")} placeholder="Minimum 8 characters" icon={<Lock className="w-4 h-4" />} required error={errors.password} />
            <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter your password" icon={<ShieldCheck className="w-4 h-4" />} required error={errors.confirm} />
            
            <div className={`p-4 mt-2 border rounded-xl text-[13px] leading-relaxed flex items-start gap-3 transition-colors ${
              isDark 
                ? "bg-blue-900/10 border-blue-800/30 text-slate-400" 
                : "bg-blue-50 border-blue-100 text-slate-600"
            }`}>
              <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
              <p>
                By creating an account you agree to our{" "}
                <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-semibold">Terms of Service</span> and{" "}
                <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-semibold">Privacy Policy</span>.
              </p>
            </div>

            {errors.submit && (
              <div className={`p-3 border rounded-lg text-sm font-medium animate-in fade-in ${
                isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600"
              }`}>
                {errors.submit}
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2" onClick={back}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button fullWidth loading={loading} onClick={handleSubmit} className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 rounded-xl font-semibold flex items-center justify-center gap-2">
                Create Account <Check className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Already have an account?{" "}
            <span 
              onClick={() => navigate("/login")} 
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors cursor-pointer ml-1"
            >
              Sign in instead
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}