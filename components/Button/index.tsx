import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-primary-300 text-primary-1400 hover:bg-primary-400 hover:text-primary-1400 focus-visible:border-ring-primary focus-visible:ring-ring-primary/50 focus-visible:ring-[3px]",
                outline: "border border-primary-300 hover:bg-primary-300 hover:text-accent-foreground focus-visible:border-ring-primary focus-visible:ring-ring-primary/50 focus-visible:ring-[3px] shadow-xs",
                text: "text-primary-1400 hover:text-primary-1000 focus-visible:border-ring-primary focus-visible:ring-ring-primary/50 focus-visible:ring-[3px] shadow-xs",
                brand: "bg-brand-400 text-brand-100 hover:bg-brand-500 hover:text-brand-100 focus-visible:border-ring-brand focus-visible:ring-ring-brand/50 focus-visible:ring-[3px]",
                destructive:
                    "bg-fail-400 text-fail-100 hover:bg-fail-500 hover:text-fail-100 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                ghost:
                    "bg-primary-200 hover:bg-accent-400 hover:text-accent-foreground focus-visible:border-brand-400 focus-visible:ring-brand-400/50 focus-visible:ring-[3px]",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                S: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                M: "h-9 px-4 py-2 has-[>svg]:px-3",
                L: "h-11 rounded-md px-6 has-[>svg]:px-4",
                "icon-s": "size-8",
                "icon-m": "size-9",
                "icon-l": "size-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "M",
        },
    }
)

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
