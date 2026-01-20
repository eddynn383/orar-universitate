"use client"

import { useState } from "react"
import { Smile } from "lucide-react"
import { Button } from "@/components/Button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"

const EMOJI_CATEGORIES = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
    emotions: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️'],
    objects: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '⛸️', '🎣', '🎿', '🛷', '🥌'],
}

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys')

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-s"
                    title="Adaugă emoji"
                >
                    <Smile className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
                <div className="space-y-2">
                    {/* Category Tabs */}
                    <div className="flex gap-1 border-b border-primary-200 pb-2">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                                className={`px-3 py-1 text-xs rounded ${
                                    activeCategory === category
                                        ? 'bg-primary-300 text-primary-1400'
                                        : 'text-primary-600 hover:bg-primary-200'
                                }`}
                            >
                                {category === 'smileys' && '😊'}
                                {category === 'gestures' && '👍'}
                                {category === 'emotions' && '❤️'}
                                {category === 'objects' && '🎉'}
                            </button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-2xl hover:bg-primary-200 rounded p-1 transition-colors"
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
