import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../../lib/utils"

const buttonVariants = cva(
     "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
     {
          variants: {
               variant: {
                    default: "bg-teal-500 text-white hover:bg-teal-600 hover:text-white",
                    destructive:
                         "bg-red-500 text-white hover:bg-red-600 hover:text-white",
                    outline:
                         "border border-teal-500 bg-white text-teal-500 hover:bg-teal-500 hover:text-white",
                    secondary:
                         "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800",
                    ghost: "bg-transparent text-teal-600 hover:bg-teal-50 hover:text-teal-700",
                    link: "text-teal-600 underline-offset-4 hover:underline hover:text-teal-700",
               },
               size: {
                    default: "h-10 px-4 py-2",
                    sm: "h-8 rounded-md px-3 py-0.5",
                    lg: "h-11 rounded-md px-8",
                    icon: "h-10 w-10",
               },
          },
          defaultVariants: {
               variant: "default",
               size: "default",
          },
     }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
     const Comp = asChild ? Slot : "button"
     return (
          <Comp
               className={cn(buttonVariants({ variant, size, className }))}
               ref={ref}
               {...props}
          />
     )
})
Button.displayName = "Button"

export { Button, buttonVariants }
