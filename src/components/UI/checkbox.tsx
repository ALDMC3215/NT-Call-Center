import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean
  variant?: "default" | "outline" | "glass"
  size?: "default" | "sm" | "lg"
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, variant = "default", size = "default", checked, onCheckedChange, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = React.useState<boolean | "indeterminate">(
    checked !== undefined ? checked : indeterminate ? "indeterminate" : false
  )

  React.useEffect(() => {
    if (checked !== undefined) {
      setInternalChecked(checked)
    }
  }, [checked])

  React.useEffect(() => {
    if (indeterminate && checked !== true) {
      setInternalChecked("indeterminate")
    }
  }, [indeterminate, checked])

  const handleCheckedChange = (state: boolean | "indeterminate") => {
    setInternalChecked(state)
    onCheckedChange?.(state)
  }

  const isChecked = internalChecked === true
  const isIndeterminate = internalChecked === "indeterminate"

  const sizeClasses = {
    default: "h-5 w-5 rounded-[6px] [&_svg]:h-3.5 [&_svg]:w-3.5",
    sm: "h-4 w-4 rounded-[4px] [&_svg]:h-3 [&_svg]:w-3",
    lg: "h-6 w-6 rounded-[8px] [&_svg]:h-4 [&_svg]:w-4",
  }

  const variantClasses = {
    default: "border-2 border-muted/40 bg-surface text-primary data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500 data-[state=checked]:text-white",
    outline: "border-border bg-transparent text-primary data-[state=checked]:bg-surface-hover data-[state=checked]:border-slate-400",
    glass: "border-border bg-surface text-primary data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-white ",
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={`peer shrink-0 border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden relative flex items-center justify-center ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      checked={internalChecked}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      <AnimatePresence initial={false} mode="wait">
        {isChecked && (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center justify-center"
          >
            <Check strokeWidth={3} />
          </motion.div>
        )}
        {isIndeterminate && (
          <motion.div
            key="minus"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center justify-center"
          >
            <Minus strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
