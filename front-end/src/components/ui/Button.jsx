import React from "react";

export default function Button({ children, ...props }) {
     return (
          <button
               {...props}
               className="px-4 py-2 rounded-md shadow-sm bg-blue-600 text-white hover:bg-blue-700"
          >
               {children}
          </button>
     );
}
