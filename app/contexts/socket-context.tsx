"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    joinConversation: (conversationId: string) => void
    leaveConversation: (conversationId: string) => void
    sendTypingStart: (conversationId: string) => void
    sendTypingStop: (conversationId: string) => void
    markAsRead: (conversationId: string) => void
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    joinConversation: () => {},
    leaveConversation: () => {},
    sendTypingStart: () => {},
    sendTypingStop: () => {},
    markAsRead: () => {}
})

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}

interface SocketProviderProps {
    children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const { data: session } = useSession()

    useEffect(() => {
        // Inițializează conexiunea Socket.io doar dacă utilizatorul este autentificat
        if (session?.user?.id) {
            const socketInstance = io({
                path: '/api/socket/io',
                auth: {
                    token: session.user.id
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            })

            socketInstance.on('connect', () => {
                console.log('Socket.io connected')
                setIsConnected(true)
            })

            socketInstance.on('disconnect', () => {
                console.log('Socket.io disconnected')
                setIsConnected(false)
            })

            socketInstance.on('connect_error', (error) => {
                console.error('Socket.io connection error:', error)
                setIsConnected(false)
            })

            setSocket(socketInstance)

            return () => {
                socketInstance.disconnect()
            }
        }
    }, [session?.user?.id])

    const joinConversation = (conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('join_conversation', conversationId)
        }
    }

    const leaveConversation = (conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('leave_conversation', conversationId)
        }
    }

    const sendTypingStart = (conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('typing_start', { conversationId })
        }
    }

    const sendTypingStop = (conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('typing_stop', { conversationId })
        }
    }

    const markAsRead = (conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('mark_read', {
                conversationId,
                timestamp: new Date()
            })
        }
    }

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                joinConversation,
                leaveConversation,
                sendTypingStart,
                sendTypingStop,
                markAsRead
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}
