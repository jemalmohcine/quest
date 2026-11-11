import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
