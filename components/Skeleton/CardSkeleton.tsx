import { Skeleton } from "./index"

export function CardSkeleton() {
    return (
        <div className="bg-primary-100 border border-primary-200 rounded-lg p-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                </div>
            </div>
        </div>
    )
}

export function CardListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(count)].map((_, i) => (
                <li key={i}>
                    <CardSkeleton />
                </li>
            ))}
        </ul>
    )
}
