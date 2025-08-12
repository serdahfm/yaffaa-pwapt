import * as React from "react"

// Simplified stub implementations for now
export const Select = ({ children }: any) => {
  return <div>{children}</div>
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(
  ({ children, ...props }, ref) => (
    <button
      ref={ref}
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  )
)

export const SelectValue = () => null

export const SelectContent = ({ children }: any) => (
  <div className="relative mt-1 max-h-60 overflow-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md">
    {children}
  </div>
)

export const SelectItem = ({ value, children, ...props }: any) => (
  <div
    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
    {...props}
  >
    {children}
  </div>
)