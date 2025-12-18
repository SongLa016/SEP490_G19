import * as React from "react"

import { cn } from "../../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
     return (
          <input
               type={type}
               spellCheck={false}
               className={cn(
                    "flex h-10 w-full rounded-md border hover:ring-teal-500 hover:ring-2 hover:border-transparent bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
               )}
               ref={ref}
               {...props}
          />
     )
})
Input.displayName = "Input"

// PhoneInput - Chỉ cho phép nhập số, tự động format
const PhoneInput = React.forwardRef(({ className, onChange, value, maxLength = 10, ...props }, ref) => {
     const handleChange = (e) => {
          // Chỉ giữ lại các ký tự số
          const numericValue = e.target.value.replace(/[^0-9]/g, "");
          // Giới hạn độ dài
          const limitedValue = numericValue.slice(0, maxLength);

          // Tạo event giả với giá trị đã xử lý
          const syntheticEvent = {
               ...e,
               target: {
                    ...e.target,
                    value: limitedValue
               }
          };
          onChange?.(syntheticEvent);
     };

     const handleKeyDown = (e) => {
          // Cho phép: Backspace, Delete, Tab, Escape, Enter, Arrow keys
          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

          // Cho phép Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
               return;
          }

          // Cho phép các phím điều khiển
          if (allowedKeys.includes(e.key)) {
               return;
          }

          // Chặn nếu không phải số
          if (!/^[0-9]$/.test(e.key)) {
               e.preventDefault();
          }
     };

     const handlePaste = (e) => {
          e.preventDefault();
          const pastedText = e.clipboardData.getData('text');
          // Chỉ giữ lại số từ text paste
          const numericValue = pastedText.replace(/[^0-9]/g, "");
          const currentValue = value || "";
          const newValue = (currentValue + numericValue).slice(0, maxLength);

          const syntheticEvent = {
               target: { value: newValue }
          };
          onChange?.(syntheticEvent);
     };

     return (
          <input
               type="tel"
               inputMode="numeric"
               pattern="[0-9]*"
               spellCheck={false}
               autoComplete="tel"
               value={value}
               onChange={handleChange}
               onKeyDown={handleKeyDown}
               onPaste={handlePaste}
               className={cn(
                    "flex h-10 w-full rounded-md border hover:ring-teal-500 hover:ring-2 hover:border-transparent bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
               )}
               ref={ref}
               {...props}
          />
     )
})
PhoneInput.displayName = "PhoneInput"

export { Input, PhoneInput }
