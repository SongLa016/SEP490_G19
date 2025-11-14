import * as React from "react"
import { cn } from "../../../lib/utils"

const Container = React.forwardRef(({ className, children, ...props }, ref) => (
     <div
          ref={ref}
          className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}
          {...props}
     >
          {children}
     </div>
))
Container.displayName = "Container"

const Section = React.forwardRef(({ className, children, ...props }, ref) => (
     <section
          ref={ref}
          className={cn(className)}
          {...props}
     >
          {children}
     </section>
))
Section.displayName = "Section"

const Row = React.forwardRef(({ className, children, ...props }, ref) => (
     <div
          ref={ref}
          className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}
          {...props}
     >
          {children}
     </div>
))
Row.displayName = "Row"

const Col = React.forwardRef(({ className, children, ...props }, ref) => (
     <div
          ref={ref}
          className={cn(className)}
          {...props}
     >
          {children}
     </div>
))
Col.displayName = "Col"

export { Container, Section, Row, Col }
