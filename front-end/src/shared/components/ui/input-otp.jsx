import * as React from "react"
import { cn } from "../../../lib/utils"

const InputOTPContext = React.createContext({
  value: "",
  setValue: () => { },
  inputRefs: []
})

const InputOTP = React.forwardRef(({ className, value = "", onChange, maxLength = 6, children, ...props }, ref) => {
  const inputRefs = React.useRef([])
  const otpValue = value || ""

  const handleChange = React.useCallback((index, newValue) => {
    if (!/^\d*$/.test(newValue)) return

    const newOtp = otpValue.split("")
    newOtp[index] = newValue.slice(-1)
    const updatedOtp = newOtp.join("").slice(0, maxLength)

    if (onChange) {
      onChange(updatedOtp)
    }

    // Auto-focus next input
    if (newValue && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [otpValue, onChange, maxLength])

  const handleKeyDown = React.useCallback((index, e) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [otpValue, maxLength])

  const handlePaste = React.useCallback((e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, maxLength)
    if (!/^\d+$/.test(pastedData)) return

    if (onChange) {
      onChange(pastedData)
    }

    const nextIndex = Math.min(pastedData.length, maxLength - 1)
    inputRefs.current[nextIndex]?.focus()
  }, [onChange, maxLength])

  const contextValue = React.useMemo(() => ({
    value: otpValue,
    setValue: onChange,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    maxLength
  }), [otpValue, onChange, maxLength, handleChange, handleKeyDown, handlePaste])

  return (
    <InputOTPContext.Provider value={contextValue}>
      <div ref={ref} className={cn("flex items-center justify-center gap-2", className)} {...props}>
        {children}
      </div>
    </InputOTPContext.Provider>
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef(({ className, index, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const context = React.useContext(InputOTPContext)

  if (!context || !context.handleChange) {
    console.warn("InputOTPSlot must be used within InputOTP")
    return null
  }

  const { value, handleChange, handleKeyDown, handlePaste, inputRefs } = context
  const slotValue = value[index] || ""

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center border border-slate-300 text-sm transition-all rounded-xl first:rounded-l-xl last:rounded-r-xl bg-white",
        (slotValue || isFocused) && "border-green-500",
        slotValue && "bg-green-50",
        className
      )}
      {...props}
    >
      <input
        ref={(el) => {
          if (inputRefs && inputRefs.current) {
            inputRefs.current[index] = el
          }
        }}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={slotValue}
        onChange={(e) => handleChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent rounded-xl"
        autoFocus={index === 0 && !value}
      />
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn("mx-2", className)} {...props}>
    <div className="h-0.5 w-6 bg-slate-400" />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

