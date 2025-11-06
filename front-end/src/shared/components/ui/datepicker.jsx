import * as React from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"

import { cn } from "../../../lib/utils"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export function DatePicker({
  value,
  onChange,
  min,
  minDate,
  className = "",
  placeholder = "Chọn ngày",
  disabled,
  fromYear = 2020,
  toYear = 2030,
  ...props
}) {
  const [open, setOpen] = React.useState(false)
  const date = value ? (typeof value === "string" ? new Date(value) : value) : undefined
  // Support both min and minDate props for backward compatibility
  const minDateValue = minDate || min
  const minDateObj = minDateValue ? (typeof minDateValue === "string" ? new Date(minDateValue) : minDateValue) : undefined

  // Format date as d/M/yyyy to match image format (e.g., "2/11/2025")
  const formatDate = (date) => {
    if (!date) return ""
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-gray-500",
            date && "text-gray-900",
            className
          )}
        >
          <span className={cn("line-clamp-1", !date && "text-gray-500")}>
            {date ? formatDate(date) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              // Format as YYYY-MM-DD string for compatibility
              const formatted = format(selectedDate, "yyyy-MM-dd")
              onChange && onChange(formatted)
              setOpen(false)
            } else {
              onChange && onChange("")
            }
          }}
          disabled={minDateObj ? (date) => date < minDateObj : undefined}
          {...props}
        />
      </PopoverContent>
    </Popover>
  )
}
