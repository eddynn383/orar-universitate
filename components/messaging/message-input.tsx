"use client"

import { useState, KeyboardEvent } from "react"
import { Button } from "@/components/Button"
import { Textarea } from "@/components/Textarea"
import { Send } from "lucide-react"
import { useSocket } from "@/app/contexts/socket-context"
import { useDebouncedCallback } from "use-debounce"

interface MessageInputProps {
    onSendMessage: (content: string) => void
    conversationId: string
}

export function MessageInput({ onSendMessage, conversationId }: MessageInputProps) {
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const { sendTypingStart, sendTypingStop } = useSocket()

    const handleTypingStop = useDebouncedCallback(() => {
        sendTypingStop(conversationId)
    }, 1000)

    const handleChange = (value: string) => {
        setMessage(value)

        if (value.length > 0) {
            sendTypingStart(conversationId)
            handleTypingStop()
        } else {
            sendTypingStop(conversationId)
        }
    }

    const handleSend = async () => {
        if (message.trim().length === 0 || isSending) return

        setIsSending(true)
        sendTypingStop(conversationId)

        try {
            await onSendMessage(message.trim())
            setMessage("")
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex gap-2">
            <Textarea
                value={message}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrie un mesaj..."
                className="min-h-[60px] max-h-[200px] resize-none"
                disabled={isSending}
            />
            <Button
                onClick={handleSend}
                disabled={message.trim().length === 0 || isSending}
                size="icon-m"
                className="h-[60px] w-[60px]"
            >
                <Send className="h-5 w-5" />
            </Button>
        </div>
    )
}
