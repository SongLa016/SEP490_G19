import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "./button";
import {
     Command,
     CommandEmpty,
     CommandGroup,
     CommandInput,
     CommandItem,
     CommandList,
} from "./command";
import {
     Popover,
     PopoverContent,
     PopoverTrigger,
} from "./popover";
import { cn } from "../../../lib/utils";

/**
 * Combobox component - Allows both selecting from list and typing custom value
 * Based on shadcn/ui Combobox pattern
 */
export function Combobox({
     options = [],
     value,
     onValueChange,
     placeholder = "Chọn hoặc nhập...",
     emptyText = "Không tìm thấy.",
     searchPlaceholder = "Tìm kiếm...",
     className,
     disabled = false,
     allowCustom = true, // Allow typing custom values
}) {
     const [open, setOpen] = React.useState(false);
     const [searchValue, setSearchValue] = React.useState("");

     // Find selected option
     const selectedOption = options.find((option) => option.value === value);
     const displayValue = selectedOption?.label || value || "";

     const handleSelect = (currentValue) => {
          const newValue = currentValue === value ? "" : currentValue;
          onValueChange(newValue);
          setOpen(false);
          setSearchValue("");
     };

     // Handle custom input when allowCustom is true
     const handleSearchChange = (search) => {
          setSearchValue(search);
          if (allowCustom && search && !options.find(opt => opt.value === search)) {
               // User is typing a custom value
               onValueChange(search);
          }
     };

     return (
          <Popover open={open} onOpenChange={setOpen}>
               <PopoverTrigger asChild>
                    <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={open}
                         className={cn(
                              "w-full justify-between",
                              !displayValue && "text-muted-foreground",
                              className
                         )}
                         disabled={disabled}
                    >
                         <span className="truncate">
                              {displayValue || placeholder}
                         </span>
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
               </PopoverTrigger>
               <PopoverContent className="w-full p-0" align="start">
                    <Command>
                         <CommandInput
                              placeholder={searchPlaceholder}
                              value={searchValue}
                              onValueChange={handleSearchChange}
                         />
                         <CommandList>
                              <CommandEmpty>{emptyText}</CommandEmpty>
                              <CommandGroup>
                                   {options.map((option) => (
                                        <CommandItem
                                             key={option.value}
                                             value={option.value}
                                             onSelect={handleSelect}
                                        >
                                             <Check
                                                  className={cn(
                                                       "mr-2 h-4 w-4",
                                                       value === option.value ? "opacity-100" : "opacity-0"
                                                  )}
                                             />
                                             {option.label}
                                        </CommandItem>
                                   ))}
                              </CommandGroup>
                         </CommandList>
                    </Command>
               </PopoverContent>
          </Popover>
     );
}
