import React from "react";
import { cn } from "../../../lib/utils";

export function Checkbox({ 
     checked, 
     onCheckedChange, 
     className,
     disabled,
     ...props 
}) {
     const handleChange = (e) => {
          if (onCheckedChange) {
               onCheckedChange(e.target.checked);
          }
     };

     return (
          <input
               type="checkbox"
               checked={checked || false}
               onChange={handleChange}
               disabled={disabled}
               className={cn(
                    "h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
               )}
               {...props}
          />
     );
}

