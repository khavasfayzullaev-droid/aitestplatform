import { useState, useRef } from 'react'
import { Play, Pause, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer({ src, playOnce = false }: { src: string, playOnce?: boolean }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [hasPlayed, setHasPlayed] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    const togglePlay = () => {
        if (isFinished && playOnce) return;
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
                setHasPlayed(true)
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime
            const dur = audioRef.current.duration
            setProgress((current / dur) * 100)
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setProgress(100)
        if (playOnce) {
            setIsFinished(true)
        }
    }

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return "00:00"
        const m = Math.floor(timeInSeconds / 60)
        const s = Math.floor(timeInSeconds % 60)
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    }

    const isLocked = isFinished && playOnce;

    return (
        <div className={`w-full max-w-md bg-white p-4 rounded-3xl shadow-sm border-2 transition-all ${isLocked ? 'border-zinc-200 bg-zinc-50' : isPlaying ? 'border-purple-300 shadow-purple-100' : 'border-zinc-100 hover:border-purple-200'}`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />

            <div className="flex items-center gap-5">
                <button
                    onClick={togglePlay}
                    disabled={isLocked}
                    className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-4 ${isLocked ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white active:scale-95 shadow-lg shadow-purple-600/30'}`}
                >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                </button>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className={`text-xs font-black tracking-wider uppercase ${isLocked ? 'text-zinc-400' : 'text-purple-600'}`}>
                            {isLocked ? 'Tugatildi' : isPlaying ? 'Tinglanmoqda' : hasPlayed ? "To'xtatilgan" : 'Audio'}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 tabular-nums">
                            {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden relative">
                        <motion.div
                            className={`absolute top-0 left-0 h-full rounded-full ${isLocked ? 'bg-zinc-300' : 'bg-purple-500'}`}
                            style={{ width: `${progress}%` }}
                            transition={{ ease: "linear", duration: 0.1 }}
                        />
                    </div>
                </div>

                {playOnce && (
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-orange-50 rounded-full text-orange-500" title="Diqqat: Ushbu audioni faqat 1 marta eshitish mumkin.">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                )}
            </div>

            {playOnce && !isFinished && (
                <p className="text-[10px] text-orange-500 font-bold mt-3 text-center uppercase tracking-wide">
                    ⚠️ Audioni takroriy eshitib bo'lmaydi
                </p>
            )}
        </div>
    )
}
