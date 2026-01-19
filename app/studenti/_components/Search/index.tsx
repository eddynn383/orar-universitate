"use client"

import { Input } from "@/components/Input"
import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export const SearchInput = () => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)

        if (term) {
            params.set("search", term)
        } else {
            params.delete("search")
        }

        replace(`${pathname}?${params.toString()}`)
    }, 300)

    return (
        <div className="relative w-full max-w-[320px]">
            <Input
                type="text"
                placeholder="Caută studenți..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("search")?.toString()}
                className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 size-4" />
        </div>
    )
}
