import React from "react";

// Lightweight calendar wrapper (shadcn-style API subset)
export function Calendar({ selected, onSelect, className = "", ...props }) {
     return (
          <input
               type="date"
               value={selected}
               onChange={(e) => onSelect && onSelect(e.target.value)}
               className={`w-full rounded-lg border border-gray-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${className}`}
               {...props}
          />
     );
}


