import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}



export function Table({ heads, children }) {
  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        <thead className="hidden sm:table-header-group">
          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80">
            {heads.map((h) => (
              <th 
                key={h} 
                className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block sm:table-row-group divide-y divide-slate-100 dark:divide-slate-800/60">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="block sm:table-row p-4 sm:p-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200 cursor-pointer group"
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = "", label }) {
  return (
    <td className={`flex items-center justify-between sm:table-cell px-2 py-2 sm:px-6 sm:py-5 text-sm text-slate-700 dark:text-slate-300 ${className}`}>
      {label && (
        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-4">
          {label}
        </span>
      )}
      <div className="text-right sm:text-left truncate">
        {children}
      </div>
    </td>
  );
}