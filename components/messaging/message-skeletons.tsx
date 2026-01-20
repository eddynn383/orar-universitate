import { Skeleton } from "@/components/Skeleton"

export function ConversationListSkeleton() {
    return (
        <div className="divide-y divide-primary-200">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3">
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function MessageListSkeleton() {
    return (
        <div className="p-3 space-y-3">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className={`flex gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-1 max-w-[70%]">
                        <Skeleton className={`h-16 ${i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-36' : 'w-56'} rounded-lg`} />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function UserListSkeleton() {
    return (
        <div className="divide-y divide-primary-200">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
