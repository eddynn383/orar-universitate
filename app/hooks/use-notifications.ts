"use client"

import { useEffect, useState } from 'react'
import { useSocket } from '../contexts/socket-context'

interface NotificationOptions {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
}

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSupported, setIsSupported] = useState(false)
    const { socket } = useSocket()

    useEffect(() => {
        // Check if notifications are supported
        if ('Notification' in window) {
            setIsSupported(true)
            setPermission(Notification.permission)
        }
    }, [])

    useEffect(() => {
        if (!socket || !isSupported) return

        // Listen for notification events from Socket.io
        socket.on('conversation_updated', ({ message, conversationId }: any) => {
            // Check if page is not visible (user is in another tab/window)
            if (document.hidden) {
                showNotification({
                    title: message.sender.name || 'Mesaj nou',
                    body: message.content,
                    icon: message.sender.image || '/default-avatar.png',
                    tag: conversationId,
                    data: {
                        conversationId,
                        messageId: message.id
                    }
                })
            }
        })

        return () => {
            socket.off('conversation_updated')
        }
    }, [socket, isSupported])

    const requestPermission = async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            console.warn('Notifications are not supported in this browser')
            return 'denied'
        }

        if (permission === 'granted') {
            return 'granted'
        }

        try {
            const result = await Notification.requestPermission()
            setPermission(result)
            return result
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            return 'denied'
        }
    }

    const showNotification = (options: NotificationOptions) => {
        if (!isSupported) {
            console.warn('Notifications are not supported')
            return
        }

        if (permission !== 'granted') {
            console.warn('Notification permission not granted')
            return
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/logo.png',
                badge: options.badge || '/badge.png',
                tag: options.tag,
                data: options.data,
                requireInteraction: false,
                silent: false
            })

            // Handle notification click
            notification.onclick = (event) => {
                event.preventDefault()
                window.focus()

                // Close notification
                notification.close()

                // You can add custom logic here, e.g., navigate to conversation
                if (options.data?.conversationId) {
                    // Emit event to open conversation
                    const event = new CustomEvent('open-conversation', {
                        detail: { conversationId: options.data.conversationId }
                    })
                    window.dispatchEvent(event)
                }
            }

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close()
            }, 5000)
        } catch (error) {
            console.error('Error showing notification:', error)
        }
    }

    return {
        permission,
        isSupported,
        requestPermission,
        showNotification
    }
}
