import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import Input from "./Input";
import Button from "./Button";
import { motion } from "framer-motion";
import {
  User,
  Store,
  Shield,
  Users,
  Zap,
  Building2,
  Car,
  BarChart3,
  Lock,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";

const ROLES = [
  { id: "customer", icon: User, label: "Customer", desc: "Rent vehicles" },
  { id: "dealer", icon: Store, label: "Dealer", desc: "Manage fleet" },
  { id: "hr", icon: Users, label: "HR", desc: "HR dashboard" },
  { id: "superadmin", icon: Zap, label: "Super", desc: "Full access" },
];

const FEATURES = [
  { icon: Building2, text: "Multi-dealer management" },
  { icon: Car, text: "Real-time fleet tracking" },
  { icon: BarChart3, text: "Advanced analytics & reports" },
  { icon: Lock, text: "Role-based access control" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const slideInRight = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [role, setRole] = useState("dealer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await login(email, password, role);
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

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
          className={`absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 ${isDark ? "bg-blue-600/20 opacity-100" : "bg-blue-400/30 opacity-70"}`}
        />
        <div
          className={`absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 ${isDark ? "bg-violet-600/20 opacity-100" : "bg-violet-400/30 opacity-70"}`}
        />

        {/* Abstract Grid Pattern */}
        <div
          className={`absolute inset-0 opacity-[0.04] transition-opacity duration-500 ${isDark ? "invert-0" : "invert"}`}
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.5) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative max-w-md z-10"
        >
          <motion.div
            variants={itemVariants}
          >
            <img
              src="/logo.png"
              alt="DriveFleet Pro Logo"
              className="w-full h-full object-contain p-2"
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
        className={`w-full lg:max-w-[480px] flex flex-col justify-center items-center px-6 py-10 transition-colors duration-500 border-l relative ${
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
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  D
                </div>
                <span
                  className={`text-sm font-bold tracking-wide ${isDark ? "text-slate-200" : "text-slate-800"}`}
                >
                  DriveFleet Pro
                </span>
              </div>
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

          {/* Role Selector */}
          <div className="mb-8">
            <p
              className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Select Role
            </p>
            <div className="grid grid-cols-5 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  title={r.desc}
                  className={`relative flex flex-col items-center gap-2 py-3 px-1 rounded-xl border transition-all duration-200 ease-in-out ${
                    role === r.id
                      ? isDark
                        ? "bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                      : isDark
                        ? "bg-slate-900/50 border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <r.icon
                    className={`w-5 h-5 ${role === r.id ? "animate-pulse" : ""}`}
                    strokeWidth={role === r.id ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-bold tracking-wide leading-none">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*********"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isDark
                      ? "bg-slate-900 border-slate-700 group-hover:border-blue-500"
                      : "bg-white border-slate-300 group-hover:border-blue-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="opacity-0 absolute w-4 h-4 cursor-pointer"
                  />
                </div>
                <span
                  className={`text-sm transition-colors ${isDark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600 group-hover:text-slate-900"}`}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
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
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p
              className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-500 font-semibold transition-colors ml-1"
              >
                Create an account
              </button>
            </p>
          </div>

          {/* Demo Hint */}
          <div
            className={`mt-8 p-4 rounded-xl border border-dashed transition-colors ${
              isDark
                ? "bg-slate-900/30 border-slate-700/50"
                : "bg-slate-50/50 border-slate-200"
            }`}
          >
            <p
              className={`text-[12px] text-center flex items-center justify-center gap-2 ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              <Lock className="w-3.5 h-3.5" />
              Demo mode — select any role to test
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
