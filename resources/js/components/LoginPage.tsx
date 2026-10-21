import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { appConfig } from "@/lib/appConfig";
import { ApiError } from "@/lib/api";
import { useTheme } from "./ThemeContext";
import Input from "./Input";
import Button from "./Button";
import { type Variants, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Building2,
  Car,
  BarChart3,
  Lock,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";

// Seeded by `php artisan db:seed`; only listed when APP_ENV=local.
const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "superadmin@drivefleet.test" },
  { label: "HR", email: "hr@drivefleet.test" },
  { label: "Dealer", email: "dealer@drivefleet.test" },
  { label: "Customer", email: "customer@drivefleet.test" },
];

const FEATURES = [
  { icon: Building2, text: "Multi-dealer management" },
  { icon: Car, text: "Real-time fleet tracking" },
  { icon: BarChart3, text: "Advanced analytics & reports" },
  { icon: Lock, text: "Role-based access control" },
];

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const slideInRight: Variants = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // The account's role decides which dashboard /dashboard renders.
      await login(email, password, remember);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors.email?.[0] ?? err.message)
          : "Couldn't reach the server. Please try again.",
      );
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
    setError("");
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${isDark ? "bg-[#030712]" : "bg-slate-50"}`}
    >
      {/* Left Branding Panel  */}
      <div
        className={`hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-slate-950"
            : "bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50"
        }`}
      >
        {/* Glow Blobs */}
        <div
          className="absolute -top-64 -left-64 w-[60rem] h-[60rem] pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${isDark ? "rgba(37,99,235,0.2)" : "rgba(96,165,250,0.25)"}, transparent)` }}
        />
        <div
          className="absolute -bottom-64 -right-64 w-[56rem] h-[56rem] pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${isDark ? "rgba(124,58,237,0.2)" : "rgba(167,139,250,0.25)"}, transparent)` }}
        />

        {/* Abstract Grid Pattern */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${isDark ? "opacity-[0.04]" : "opacity-[0.06]"}`}
          style={{
            backgroundImage: isDark
              ? "linear-gradient(rgba(148,163,184,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.5) 1px,transparent 1px)"
              : "linear-gradient(rgba(71,85,105,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(71,85,105,.5) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Link
          to="/"
          className={`absolute top-8 left-8 z-10 inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative max-w-md z-10"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <img
              src="/logo.png"
              alt="DriveFleet logo"
              className="w-56 h-auto object-contain"
            />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className={`text-5xl font-black tracking-tight leading-[1.1] mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            DriveFleet
          
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className={`text-base leading-relaxed mb-12 max-w-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            The all-in-one platform for multi-dealer car hire management. Built
            for scale, designed for speed.
          </motion.p>

          <div className="space-y-5 text-left">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-center gap-4 group cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 group-hover:scale-110 ${
                    isDark
                      ? "bg-slate-900/50 border-slate-800 text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10"
                      : "bg-white border-slate-200 text-blue-600 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50"
                  }`}
                >
                  <f.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span
                  className={`text-[15px] font-medium transition-colors ${isDark ? "text-slate-300 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"}`}
                >
                  {f.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel  */}
      <div
        className={`w-full lg:max-w-[480px] flex flex-col justify-center items-center px-6 py-10 transition-colors duration-500 lg:border-l relative ${
          isDark
            ? "bg-[#0B1120] border-slate-800/50"
            : "bg-white border-slate-200"
        }`}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideInRight}
          className="w-full max-w-[380px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-6 lg:hidden">
                <img src="/logo.png" alt="" className="w-10 h-auto object-contain" />
                <span
                  className={`text-sm font-bold tracking-wide ${isDark ? "text-slate-200" : "text-slate-800"}`}
                >
                  DriveFleet
                </span>
              </Link>
              <h2
                className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Welcome back
              </h2>
              <p
                className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Enter your details to access your account
              </p>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700 shadow-inner"
                  : "bg-slate-50 border-slate-200 text-indigo-500 hover:bg-slate-100 shadow-sm"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Moon className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          </div>

          {appConfig.platform.maintenance_mode && (
            <p role="status" className={`mb-5 p-4 rounded-xl border text-sm ${isDark ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {appConfig.platform.maintenance_message} Only DriveFleet administrators can sign in right now.
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="relative flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 ${
                    remember
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isDark
                        ? "bg-slate-900 border-slate-700 group-hover:border-blue-500"
                        : "bg-white border-slate-300 group-hover:border-blue-500"
                  }`}
                >
                  {remember && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span
                  className={`text-sm transition-colors ${isDark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600 group-hover:text-slate-900"}`}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => setError("Password reset isn't set up yet. Contact your administrator.")}
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-3.5 rounded-xl text-sm font-medium border ${
                  isDark
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-rose-50 border-rose-200 text-rose-600"
                }`}
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="leading-snug">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 rounded-xl font-semibold transition-all duration-300 hover:shadow-blue-500/40"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p
              className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-500 font-semibold transition-colors ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>

          {appConfig.showDemoAccounts && (
            <div
              className={`mt-8 p-4 rounded-xl border border-dashed transition-colors ${
                isDark ? "bg-slate-900/30 border-slate-700/50" : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <p className={`text-[12px] flex items-center gap-2 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <span className="font-semibold">Demo accounts</span> (password: <code>password</code>). Click one to fill the form.
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => fillDemoAccount(a.email)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      email === a.email
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : isDark
                          ? "border-slate-800 text-slate-300 hover:border-slate-600"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="block font-semibold">{a.label}</span>
                    <span className={`block truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
