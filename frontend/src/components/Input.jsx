// import { useState } from "react";
// import ICONS from "./SvgIcons";

// export default function Input({
//   label,
//   type = "text",
//   value,
//   onChange,
//   placeholder,
//   error,
//   icon: Icon, 
//   required = false,
//   disabled = false,
//   name,
//   autoComplete,
//   className = "",
// }) {
//   const [focused, setFocused] = useState(false);
//   const [showPwd, setShowPwd] = useState(false);

//   // Toggle type between text and password
//   const actualType = type === "password" ? (showPwd ? "text" : "password") : type;

//   return (
//     <div className={`flex flex-col gap-1.5 w-full ${className}`}>
//       {label && (
//         <label className="text-xs font-medium text-slate-400 tracking-wide">
//           {label}
//           {required && <span className="text-rose-400 ml-0.5">*</span>}
//         </label>
//       )}

//       <div className="relative flex items-center">
//         {/* Render the passed-in icon (e.g., ICONS.Lock) */}
//         {Icon && (
//           <span
//             className={`absolute left-3 transition-colors ${
//               focused ? "text-blue-400" : "text-slate-500"
//             }`}
//           >
//             <Icon className="w-4 h-4" />
//           </span>
//         )}

//         <input
//           type={actualType}
//           name={name}
//           value={value}
//           onChange={onChange}
//           placeholder={placeholder}
//           required={required}
//           disabled={disabled}
//           autoComplete={autoComplete}
//           onFocus={() => setFocused(true)}
//           onBlur={() => setFocused(false)}
//           className={[
//             "w-full h-11 bg-slate-800/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200",
//             Icon ? "pl-9" : "pl-3.5",
//             type === "password" ? "pr-10" : "pr-3.5",
//             error
//               ? "border-rose-500 focus:ring-2 focus:ring-rose-500/25"
//               : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
//             disabled ? "opacity-50 cursor-not-allowed" : "",
//           ].join(" ")}
//         />

//         {/* Password Visibility Toggle */}
//         {type === "password" && (
//           <button
//             type="button"
//             onClick={() => setShowPwd((s) => !s)}
//             className="absolute right-3 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
//           >
//             {showPwd ? (
//               <ICONS.EyeOff className="w-5 h-5" />
//             ) : (
//               <ICONS.Eye className="w-5 h-5" />
//             )}
//           </button>
//         )}
//       </div>

//       {error && (
//         <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
//           <ICONS.AlertTriangle className="w-3.5 h-3.5" />
//           {error}
//         </span>
//       )}
//     </div>
//   );
// }


import { useState } from "react";
import ICONS from "./SvgIcons";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon, // ✅ No longer aliased to an uppercase Component
  required = false,
  disabled = false,
  name,
  autoComplete,
  className = "",
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Toggle type between text and password
  const actualType = type === "password" ? (showPwd ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-medium text-slate-400 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* ✅ Render the passed-in icon directly as a node */}
        {icon && (
          <span
            className={`absolute left-3 flex items-center justify-center transition-colors ${
              focused ? "text-blue-400" : "text-slate-500"
            }`}
          >
            {icon}
          </span>
        )}

        <input
          type={actualType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={[
            "w-full h-11 bg-slate-800/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200",
            icon ? "pl-9" : "pl-3.5",
            type === "password" ? "pr-10" : "pr-3.5",
            error
              ? "border-rose-500 focus:ring-2 focus:ring-rose-500/25"
              : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />

        {/* Password Visibility Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-3 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
          >
            {showPwd ? (
              <ICONS.EyeOff className="w-5 h-5" />
            ) : (
              <ICONS.Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
          <ICONS.AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}