import { H1, P } from "@/components/Typography"
import { AdminOrSecretarOnlyServer } from "@/components/RoleGateServer"
import { ImportStudentsForm } from "./_components/ImportStudentsForm"

export default function ImportStudentsPage() {
    return (
        <AdminOrSecretarOnlyServer>
            <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 p-6">
                    <div className="flex gap-2 w-full max-w-7xl">
                        <div className="flex flex-col gap-2">
                            <H1 className="text-left text-2xl">Import Studenți</H1>
                            <P className="text-base [&:not(:first-child)]:mt-0">
                                Importă studenți în masă din fișier CSV sau Excel
                            </P>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center py-8 px-6">
                        <div className="flex flex-col gap-8 w-full max-w-4xl">
                            <ImportStudentsForm />
                        </div>
                    </div>
                </div>
            </div>
        </AdminOrSecretarOnlyServer>
    )
}
