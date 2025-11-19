import React from "react";

export function Table({ className = "", children }) {
     return (
          <div className={`w-full overflow-x-auto ${className}`}>
               <table className="w-full text-sm text-slate-700">{children}</table>
          </div>
     );
}

export function TableHeader({ children }) {
     return (
          <thead className="bg-slate-50 border-b border-slate-200">
               {children}
          </thead>
     );
}

export function TableRow({ children, className = "" }) {
     return <tr className={className}>{children}</tr>;
}

export function TableHead({ children, className = "" }) {
     return (
          <th className={`px-3 py-2 text-left font-semibold tracking-wide text-slate-500 ${className}`}>
               {children}
          </th>
     );
}

export function TableBody({ children }) {
     return <tbody className="bg-white divide-y divide-slate-200">{children}</tbody>;
}

export function TableCell({ children, className = "" }) {
     return <td className={`px-3 py-1 align-middle ${className}`}>{children}</td>;
}

export function TableFooter({ children }) {
     return <tfoot className="bg-slate-50 border-t border-slate-200">{children}</tfoot>;
}


