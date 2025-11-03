import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../../../lib/utils"

const PopoverContext = React.createContext({
  open: false,
  setOpen: () => { },
  triggerRef: null,
})

const Popover = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef(null)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef(({ asChild, children, className, ...props }, ref) => {
  const { setOpen, open, triggerRef } = React.useContext(PopoverContext)

  React.useImperativeHandle(ref, () => triggerRef.current)

  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      ref: triggerRef,
      onClick: (e) => {
        setOpen(!open)
        children.props.onClick?.(e)
      },
    })
  }

  return (
    <button
      ref={triggerRef}
      className={className}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ className, align = "start", sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext)
  const contentRef = React.useRef(null)

  React.useImperativeHandle(ref, () => contentRef.current)

  React.useEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      // Use setTimeout to ensure contentRef is available
      setTimeout(() => {
        const content = contentRef.current
        if (!content) return

        const triggerRect = trigger.getBoundingClientRect()
        const contentRect = content.getBoundingClientRect()

        let top = triggerRect.bottom + sideOffset
        let left = triggerRect.left

        if (align === "start") {
          left = triggerRect.left
        } else if (align === "center") {
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        } else if (align === "end") {
          left = triggerRect.right - contentRect.width
        }

        // Adjust if content goes off screen
        if (left + contentRect.width > window.innerWidth) {
          left = window.innerWidth - contentRect.width - 8
        }
        if (left < 0) {
          left = 8
        }

        // Adjust vertical position if needed
        if (top + contentRect.height > window.innerHeight) {
          top = triggerRect.top - contentRect.height - sideOffset
        }

        content.style.top = `${top}px`
        content.style.left = `${left}px`
      }, 0)
    }

    // Initial position after render
    const timeoutId = setTimeout(updatePosition, 0)

    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align, sideOffset])

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    // Use setTimeout to avoid immediate closing
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, setOpen])

  if (!open) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 w-auto rounded-2xl border border-gray-200 bg-white text-popover-foreground shadow-lg outline-none",
        className
      )}
      style={{
        top: 0,
        left: 0,
      }}
      {...props}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
