import * as React from "react";
import { cn } from "../../../lib/utils";

const Command = React.forwardRef(({ className, ...props }, ref) => (
     <div
          ref={ref}
          className={cn(
               "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-900",
               className
          )}
          {...props}
     />
));
Command.displayName = "Command";

const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
     <div className="flex items-center border-b px-3">
          <input
               ref={ref}
               className={cn(
                    "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
                    className
               )}
               {...props}
          />
     </div>
));
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef(({ className, ...props }, ref) => (
     <div
          ref={ref}
          className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
          {...props}
     />
));
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef((props, ref) => (
     <div
          ref={ref}
          className="py-6 text-center text-sm text-gray-500"
          {...props}
     />
));
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
     <div
          ref={ref}
          className={cn(
               "overflow-hidden p-1 text-gray-900",
               className
          )}
          {...props}
     />
));
CommandGroup.displayName = "CommandGroup";

const CommandItem = React.forwardRef(
     ({ className, ...props }, ref) => (
          <div
               ref={ref}
               className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    className
               )}
               {...props}
          />
     )
);
CommandItem.displayName = "CommandItem";

export {
     Command,
     CommandInput,
     CommandList,
     CommandEmpty,
     CommandGroup,
     CommandItem,
};
