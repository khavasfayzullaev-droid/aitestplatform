import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { User, Clock, CheckCircle2, Loader2, Headphones, BookOpen, PenTool, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAntiCheat } from '../../hooks/useAntiCheat'

type Section = 'listening' | 'reading' | 'writing' | 'finished'

const AUTOSAVE_KEY = (id: string) => `mock_progress_${id}`

export default function MockPlayer() {
    const { id } = useParams()
    const [mockData, setMockData] = useState<any>(null)
    const [studentName, setStudentName] = useState('')
    const [step, setStep] = useState<'gate' | 'playing' | 'result'>('gate')
    const [loading, setLoading] = useState(false)

    const [currentSection, setCurrentSection] = useState<Section>('listening')
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [writingText, setWritingText] = useState('')
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [sectionResult, setSectionResult] = useState<any>(null)

    // Audio ref (no pause, play once)
    const audioRef = useRef<HTMLAudioElement>(null)
    const [audioPlayed, setAudioPlayed] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)

    // Anti-cheat
    const handleAutoSubmit = useCallback(() => {
        if (currentSection === 'writing') submitWriting()
        else submitSection()
    }, [currentSection, answers, writingText]) // eslint-disable-line

    const { strikes, isBlurred, dismissBlur } = useAntiCheat(3, handleAutoSubmit)

    // ——— Load & Start ———
    const handleStart = async () => {
        if (!studentName.trim()) return alert("Ism-familiyangizni kiriting!")
        setLoading(true)
        const { data, error } = await supabase.rpc('get_mock_for_student', { query_id: id })
        if (error || !data) {
            alert("Xatolik: Mock imtihon topilmadi!")
        } else {
            setMockData(data)
            // Check for saved progress
            const saved = localStorage.getItem(AUTOSAVE_KEY(id!))
            if (saved) {
                try {
                    const p = JSON.parse(saved)
                    if (p.studentName === studentName) {
                        setAnswers(p.answers || {})
                        setWritingText(p.writingText || '')
                        setCurrentSection(p.currentSection || 'listening')
                        setTimeLeft(p.timeLeft || data.listening_minutes * 60)
                        setStep('playing')
                        setLoading(false)
                        return
                    }
                } catch { /* ignore parse errors */ }
            }
            setCurrentSection('listening')
            setTimeLeft(data.listening_minutes * 60)
            setStep('playing')
        }
        setLoading(false)
    }

    // ——— Timer ———
    useEffect(() => {
        if (step !== 'playing' || currentSection === 'finished') return
        if (timeLeft <= 0) {
            // Time's up: auto-submit current section
            if (currentSection === 'writing') submitWriting()
            else submitSection()
            return
        }
        const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
        return () => clearInterval(timer)
    }, [step, timeLeft, currentSection]) // eslint-disable-line

    // ——— Auto-save ———
    useEffect(() => {
        if (step !== 'playing' || !id) return
        const interval = setInterval(() => {
            localStorage.setItem(AUTOSAVE_KEY(id), JSON.stringify({
                studentName, answers, writingText, currentSection, timeLeft
            }))
        }, 15000)
        return () => clearInterval(interval)
    }, [step, answers, writingText, currentSection, timeLeft, studentName, id])

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    // ——— Answer ———
    const handleAnswer = (qId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [qId]: value }))
    }

    // ——— Submit Section (Listening / Reading) ———
    const submitSection = async () => {
        setLoading(true)
        let fp = localStorage.getItem('student_fp')
        if (!fp) {
            fp = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
            localStorage.setItem('student_fp', fp)
        }
        const { data, error } = await supabase.rpc('submit_mock_section', {
            p_mock_id: id, p_student: studentName,
            p_section: currentSection, p_answers: answers,
            p_student_fingerprint: fp
        })
        if (error) {
            alert("Xatolik: " + error.message)
        } else {
            setSectionResult(data)
            const next = data.next_section as Section
            setTimeout(() => {
                setSectionResult(null)
                setCurrentSection(next)
                if (next === 'reading') setTimeLeft(mockData.reading_minutes * 60)
                else if (next === 'writing') setTimeLeft(mockData.writing_minutes * 60)
            }, 3000)
        }
        setLoading(false)
    }

    // ——— Submit Writing ———
    const submitWriting = async () => {
        setLoading(true)
        const { error } = await supabase.rpc('submit_mock_writing', {
            p_mock_id: id, p_student: studentName, p_writing_text: writingText
        })
        if (error) {
            alert("Xatolik: " + error.message)
        } else {
            localStorage.removeItem(AUTOSAVE_KEY(id!))
            setCurrentSection('finished')
            setStep('result')
        }
        setLoading(false)
    }

    // ——— Play Audio Once ———
    const playAudio = () => {
        if (audioPlayed || !audioRef.current) return
        audioRef.current.play()
        setAudioPlaying(true)
        setAudioPlayed(true)
    }

    // ——— GATE SCREEN ———
    if (step === 'gate') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl p-10 rounded-[40px] w-full max-w-md border border-white/10 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="w-20 h-20 bg-white/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <User className="w-10 h-10 text-white/80" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Mock Exam</h1>
                    <p className="text-white/50 font-medium mb-8">IELTS formatidagi to'liq imtihon</p>

                    <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                        placeholder="Ism-familiyangiz"
                        className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white/15 text-white text-xl font-bold mb-6 text-center placeholder-white/30 transition-all" />

                    <button onClick={handleStart} disabled={loading || !studentName.trim()}
                        className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Imtihonni Boshlash <ChevronRight className="w-5 h-5" /></>}
                    </button>

                    <div className="mt-6 text-white/30 text-sm font-medium space-y-1">
                        <p>⏱ Listening → Reading → Writing</p>
                        <p>🔒 Tab almashtirilsa — ogohlantirish</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    // ——— SECTION TRANSITION SCREEN ———
    if (sectionResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl p-12 rounded-[40px] w-full max-w-md border border-white/10 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-white mb-3">{currentSection === 'listening' ? 'Listening' : 'Reading'} yakunlandi!</h2>
                    <p className="text-lg text-white/60 font-medium mb-6">
                        Natija: <span className="text-emerald-400 font-black">{sectionResult.score}</span> / {sectionResult.total}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-white/30 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" /> Keyingi bo'limga o'tilmoqda...
                    </div>
                </motion.div>
            </div>
        )
    }

    // ——— PLAYING SCREEN ———
    if (step === 'playing' && mockData && currentSection !== 'finished') {
        const sectionConfig: Record<string, { color: string, icon: any, label: string, bg: string }> = {
            listening: { color: 'text-violet-400', icon: Headphones, label: 'Listening', bg: 'from-violet-900/20' },
            reading: { color: 'text-blue-400', icon: BookOpen, label: 'Reading', bg: 'from-blue-900/20' },
            writing: { color: 'text-emerald-400', icon: PenTool, label: 'Writing', bg: 'from-emerald-900/20' },
        }
        const cfg = sectionConfig[currentSection]
        const Icon = cfg.icon

        const questions = currentSection === 'listening'
            ? mockData.listening_questions
            : currentSection === 'reading'
                ? mockData.reading_questions
                : []

        const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length

        return (
            <div className={`min-h-screen bg-gradient-to-br ${cfg.bg} to-slate-950 font-sans select-none`}>
                {/* Anti-cheat Warning Modal */}
                {isBlurred && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            className="bg-red-950/80 backdrop-blur-xl p-10 rounded-[32px] border border-red-500/30 text-center max-w-md">
                            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-red-300 mb-3">Diqqat!</h2>
                            <p className="text-red-200/70 font-medium mb-6">
                                Siz boshqa oynaga o'tdingiz. Bu imtihon qoidalariga zid.
                                <br /><strong className="text-red-300">Ogohlantirish: {strikes} / 3</strong>
                            </p>
                            <button onClick={dismissBlur} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                                Davom etish
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* Top Bar */}
                <div className="bg-black/30 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${cfg.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-lg">{cfg.label}</h2>
                            <p className="text-white/40 text-sm font-medium">{studentName}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                        <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
                    </div>
                </div>

                {/* ——— LISTENING SECTION ——— */}
                {currentSection === 'listening' && (
                    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32 pt-8">
                        {/* Audio Player (play once, no pause) */}
                        {mockData.listening_questions.some((q: any) => q.mediaUrl) && (
                            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-[28px] border border-white/10 mb-8">
                                {!audioPlayed ? (
                                    <button onClick={playAudio}
                                        className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3">
                                        <Headphones className="w-6 h-6" /> Audioni Boshlash (faqat 1 marta)
                                    </button>
                                ) : (
                                    <div className="text-center text-white/40 font-medium py-4">
                                        <p className="mb-2">🎧 Audio qo'yilmoqda...</p>
                                        <audio ref={audioRef}
                                            src={mockData.listening_questions.find((q: any) => q.mediaUrl)?.mediaUrl}
                                            onEnded={() => setAudioPlaying(false)}
                                            className="hidden" />
                                        {!audioPlaying && <p className="text-emerald-400 font-bold">✓ Audio yakunlandi</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Questions */}
                        {questions.map((q: any, i: number) => (
                            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-lg p-6 sm:p-8 rounded-[28px] border border-white/10 mb-6">
                                <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">
                                    <span className="text-white/30 font-black mr-2">{i + 1}.</span> {q.question}
                                </h3>
                                <div className="space-y-3">
                                    {q.options?.map((opt: any) => {
                                        const selected = answers[q.id] === opt.label
                                        return (
                                            <div key={opt.id} onClick={() => handleAnswer(q.id, opt.label)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selected ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-violet-400 bg-violet-400' : 'border-white/30'}`}>
                                                    {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <span className="font-bold text-white/40 w-6">{opt.label})</span>
                                                <span className={`font-medium ${selected ? 'text-violet-200' : 'text-white/70'}`}>{opt.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        ))}

                        <button onClick={submitSection} disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-[24px] font-black text-xl shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3 mt-8 hover:shadow-violet-600/40 transition-all disabled:opacity-50">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Listening Yakunlash <ChevronRight className="w-5 h-5" /></>}
                        </button>
                    </div>
                )}

                {/* ——— READING SECTION (Split Screen) ——— */}
                {currentSection === 'reading' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-72px)]">
                        {/* Left: Passage */}
                        <div className="bg-white/[0.03] border-r border-white/5 overflow-y-auto p-8 custom-scrollbar">
                            <h3 className="text-lg font-black text-blue-300 mb-4 uppercase tracking-wider">📖 Reading Passage</h3>
                            <div className="text-white/80 font-medium leading-loose whitespace-pre-wrap text-[16px]">
                                {mockData.reading_passage || 'Matn topilmadi. O\'qituvchi hali matn qo\'shmagan.'}
                            </div>
                        </div>

                        {/* Right: Questions */}
                        <div className="overflow-y-auto p-6 pb-32 custom-scrollbar">
                            {questions.map((q: any, i: number) => (
                                <div key={q.id} className="bg-white/5 backdrop-blur-lg p-6 rounded-[24px] border border-white/10 mb-5">
                                    <h3 className="text-lg font-bold text-white mb-5 leading-relaxed">
                                        <span className="text-white/30 font-black mr-2">{i + 1}.</span> {q.question}
                                    </h3>
                                    <div className="space-y-3">
                                        {q.options?.map((opt: any) => {
                                            const selected = answers[q.id] === opt.label
                                            return (
                                                <div key={opt.id} onClick={() => handleAnswer(q.id, opt.label)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selected ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-blue-400 bg-blue-400' : 'border-white/30'}`}>
                                                        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <span className="font-bold text-white/40 w-6">{opt.label})</span>
                                                    <span className={`font-medium ${selected ? 'text-blue-200' : 'text-white/70'}`}>{opt.text}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            <button onClick={submitSection} disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[20px] font-black text-xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 mt-6 hover:shadow-blue-600/40 transition-all disabled:opacity-50">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Reading Yakunlash <ChevronRight className="w-5 h-5" /></>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ——— WRITING SECTION ——— */}
                {currentSection === 'writing' && (
                    <div className="max-w-4xl mx-auto p-4 sm:p-8 pb-32 pt-8">
                        {/* Prompt */}
                        <div className="bg-white/5 backdrop-blur-lg p-6 sm:p-8 rounded-[28px] border border-white/10 mb-8">
                            <h3 className="text-sm font-black text-emerald-300 mb-3 uppercase tracking-wider">Writing Task</h3>
                            <p className="text-white/80 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                                {mockData.writing_prompt || 'No writing prompt provided.'}
                            </p>
                        </div>

                        {/* Text Area */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-[28px] border border-white/10 overflow-hidden">
                            <textarea
                                value={writingText}
                                onChange={e => setWritingText(e.target.value)}
                                placeholder="Start writing your essay here..."
                                className="w-full h-[50vh] p-8 bg-transparent text-white font-medium text-lg leading-relaxed outline-none resize-none placeholder-white/20"
                            />
                            {/* Footer */}
                            <div className="px-8 py-4 border-t border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className={`font-black text-lg ${wordCount >= 250 ? 'text-emerald-400' : wordCount >= 150 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {wordCount} so'z
                                    </span>
                                    {wordCount < 150 && <span className="text-red-400/60 text-sm font-medium">Kamida 150 so'z yozing</span>}
                                    {wordCount >= 250 && <span className="text-emerald-400/60 text-sm font-medium">✓ Yaxshi hajm</span>}
                                </div>
                            </div>
                        </div>

                        <button onClick={submitWriting} disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[24px] font-black text-xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 mt-8 hover:shadow-emerald-600/40 transition-all disabled:opacity-50">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Imtihonni Yakunlash <CheckCircle2 className="w-6 h-6" /></>}
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // ——— RESULT SCREEN ———
    if (step === 'result') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl p-10 rounded-[40px] w-full max-w-lg border border-white/10 text-center shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-t-[40px]" />
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">Mock Exam Yakunlandi!</h1>
                    <p className="text-white/50 font-medium mb-8">Yozma va og'zaki ballari o'qituvchingiz tomonidan qo'yiladi.</p>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
                        <p className="text-white/40 text-sm font-medium mb-2">Natijalaringiz ustozingizga yuborildi</p>
                        <p className="text-white/70 font-bold">Listening va Reading ballari avtomatik hisoblandi.<br />Writing va Speaking ballari tez orada qo'yiladi.</p>
                    </div>

                    <button onClick={() => window.location.reload()}
                        className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/15 transition-all">
                        Yopish
                    </button>
                </motion.div>
            </div>
        )
    }

    return null
}
