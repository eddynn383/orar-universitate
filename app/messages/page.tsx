"use client"

import { useState } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ChatWindow } from "@/components/messaging/chat-window"
import { NewConversationDialog } from "@/components/messaging/new-conversation-dialog"
import { useSession } from "next-auth/react"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
    const { data: session } = useSession()
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        Trebuie să fii autentificat pentru a accesa mesajele
                    </p>
                </div>
            </div>
        )
    }

    const handleConversationCreated = (conversationId: string) => {
        setSelectedConversationId(conversationId)
        // Refresh conversation list
        window.location.reload()
    }

    return (
        <div className="container mx-auto h-[calc(100vh-4rem)] py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Conversation List */}
                <div className="md:col-span-1 border rounded-lg overflow-hidden bg-card">
                    <ConversationList
                        onSelectConversation={setSelectedConversationId}
                        onNewConversation={() => setShowNewConversationDialog(true)}
                        selectedConversationId={selectedConversationId}
                        currentUserId={session.user.id}
                    />
                </div>

                {/* Chat Window */}
                <div className="md:col-span-2 border rounded-lg overflow-hidden bg-card">
                    {selectedConversationId ? (
                        <ChatWindow
                            conversationId={selectedConversationId}
                            currentUserId={session.user.id!}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Bun venit în Mesaje
                            </h3>
                            <p className="text-muted-foreground">
                                Selectează o conversație din listă sau începe una nouă
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Conversation Dialog */}
            <NewConversationDialog
                open={showNewConversationDialog}
                onOpenChange={setShowNewConversationDialog}
                onConversationCreated={handleConversationCreated}
            />
        </div>
    )
}
