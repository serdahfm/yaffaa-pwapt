import * as React from "react"
import { cn } from "@/lib/utils"

// Simplified tab implementation
const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: "", onValueChange: () => {} })

export const Tabs = ({ defaultValue, children }: any) => {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ className, children }: any) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
    {children}
  </div>
)

export const TabsTrigger = ({ value, children }: any) => {
  const context = React.useContext(TabsContext)
  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        context.value === value && "bg-background text-foreground shadow-sm"
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, children }: any) => {
  const context = React.useContext(TabsContext)
  if (context.value !== value) return null
  return <div className="mt-2">{children}</div>
}