// _components/SearchInput.tsx
"use client"

import { Input } from "@/components/Input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Search } from "lucide-react"

export function SearchInput() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)

        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }

        replace(`${pathname}?${params.toString()}`)
    }, 300)

    return (
        <div className="relative flex-1 max-w-[320px]">
            <Input
                className="bg-primary-100 rounded-lg pr-10"
                sizes="L"
                name="search"
                type="text"
                placeholder="Caută cadre didactice..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('search')?.toString()}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary-600" />
        </div>
    )
}