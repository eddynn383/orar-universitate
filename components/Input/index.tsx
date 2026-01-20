import * as React from "react"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
    "file:text-foreground placeholder:text-primary-700 selection:bg-primary selection:bg-brand-400 border-input w-full min-w-0 rounded-md border border-primary-300 bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring-brand focus-visible:ring-ring-brand/50 focus-visible:ring-[3px] aria-invalid:ring-fail-400/40 aria-invalid:border-fail-400",
    {
        variants: {
            sizes: {
                S: "h-8 rounded-md gap-1.5 px-2 has-[>svg]:px-2.5",
                M: "h-9 px-3 py-2 has-[>svg]:px-3",
                L: "h-11 rounded-md px-4 has-[>svg]:px-4",
            },
        },
        defaultVariants: {
            sizes: "M",
        },
    }
)

function Input({ className, sizes, type, ...props }: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={
                cn(inputVariants({ sizes, className }))}
            {...props}
        />
    )
}

export { Input }
