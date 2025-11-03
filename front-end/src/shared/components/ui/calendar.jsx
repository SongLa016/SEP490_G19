import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getYear, getMonth } from "date-fns"

import { cn } from "../../../lib/utils"
import { Button } from "./button"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function Calendar({
  selected,
  onSelect,
  mode = "single",
  className,
  captionLayout = "buttons",
  fromYear = 1900,
  toYear = 2100,
  disabled,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(getYear(selected), getMonth(selected), 1) : new Date(getYear(new Date()), getMonth(new Date()), 1)
  )
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false)
  const [showYearDropdown, setShowYearDropdown] = React.useState(false)
  const monthRef = React.useRef(null)
  const yearRef = React.useRef(null)

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(new Date(getYear(selected), getMonth(selected), 1))
    }
  }, [selected])

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setShowMonthDropdown(false)
      }
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(new Date(getYear(currentMonth), monthIndex, 1))
    setShowMonthDropdown(false)
  }

  const handleYearSelect = (year) => {
    setCurrentMonth(new Date(year, getMonth(currentMonth), 1))
    setShowYearDropdown(false)
  }

  const isDateDisabled = (date) => {
    if (!disabled) return false
    if (typeof disabled === "function") {
      return disabled(date)
    }
    return false
  }

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return
    onSelect?.(date)
  }

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)

  return (
    <div className={cn("p-3", className)} {...props}>
      {/* Caption */}
      <div className="flex justify-between items-center mb-4">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-50 hover:opacity-100"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Month and Year Dropdowns */}
        <div className="flex gap-2 items-center">
          {captionLayout === "dropdown" ? (
            <>
              <div className="relative" ref={monthRef}>
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown)
                    setShowYearDropdown(false)
                  }}
                  className="h-8 px-1 text-sm rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer appearance-none min-w-[100px] flex items-center justify-between"
                >
                  {MONTHS[getMonth(currentMonth)]}
                  <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                </button>
                {showMonthDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-fit bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-auto">
                    {MONTHS.map((month, index) => (
                      <button
                        key={index}
                        onClick={() => handleMonthSelect(index)}
                        className={cn(
                          "w-20 text-left px-2 py-1.5 text-sm hover:bg-teal-700 hover:text-white cursor-pointer",
                          getMonth(currentMonth) === index && "bg-teal-200 rounded-md text-accent-foreground"
                        )}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={yearRef}>
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown)
                    setShowMonthDropdown(false)
                  }}
                  className="h-8 px-1 text-sm rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer appearance-none min-w-[75px] flex items-center justify-between"
                >
                  {getYear(currentMonth)}
                  <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className={cn(
                          "w-fit text-left px-2 py-1.5 text-sm hover:bg-teal-700 hover:text-white cursor-pointer",
                          getYear(currentMonth) === year && "bg-teal-200 rounded-md text-accent-foreground"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm font-medium">
              {MONTHS[getMonth(currentMonth)]} {getYear(currentMonth)}
            </div>
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-50 hover:opacity-100"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="flex mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="w-9 text-center text-xs font-normal text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex w-full">
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date) => {
              const isSelected = selected && isSameDay(date, selected)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isCurrentDay = isToday(date)
              const isDisabled = isDateDisabled(date)

              return (
                <div key={date.toString()} className="w-9 h-9 text-center text-sm p-0 relative">
                  <button
                    type="button"
                    onClick={() => handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      "w-9 h-9 rounded-md font-normal transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      isSelected && "bg-teal-500 text-white hover:bg-teal-500 hover:text-white",
                      isCurrentDay && !isSelected && "bg-teal-200 text-accent-foreground",
                      !isCurrentMonth && "text-muted-foreground opacity-50",
                      isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {format(date, "d")}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"
