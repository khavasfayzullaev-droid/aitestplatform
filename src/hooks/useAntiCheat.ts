import { useEffect, useRef, useState } from 'react'

interface AntiCheatState {
    strikes: number
    isBlurred: boolean
}

export function useAntiCheat(maxStrikes = 3, onAutoSubmit?: () => void) {
    const [state, setState] = useState<AntiCheatState>({ strikes: 0, isBlurred: false })
    const strikesRef = useRef(0)

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                strikesRef.current += 1
                setState({ strikes: strikesRef.current, isBlurred: true })
                if (strikesRef.current >= maxStrikes && onAutoSubmit) {
                    onAutoSubmit()
                }
            } else {
                setState(prev => ({ ...prev, isBlurred: false }))
            }
        }

        const handleContextMenu = (e: MouseEvent) => { e.preventDefault() }

        const handleCopyPaste = (e: ClipboardEvent) => { e.preventDefault() }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+Shift+I, F12
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u'].includes(e.key.toLowerCase())) {
                e.preventDefault()
            }
            if (e.key === 'F12') e.preventDefault()
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
                e.preventDefault()
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('copy', handleCopyPaste)
        document.addEventListener('paste', handleCopyPaste)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('copy', handleCopyPaste)
            document.removeEventListener('paste', handleCopyPaste)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [maxStrikes, onAutoSubmit])

    const dismissBlur = () => setState(prev => ({ ...prev, isBlurred: false }))

    return { ...state, dismissBlur }
}
