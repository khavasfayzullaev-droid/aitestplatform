import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { User, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function TestPlayer() {
    const { id } = useParams()
    const [testData, setTestData] = useState<any>(null)
    const [studentName, setStudentName] = useState('')
    const [step, setStep] = useState<'gate' | 'playing' | 'result'>('gate')
    const [loading, setLoading] = useState(false)

    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [result, setResult] = useState<any>(null)

    const handleStart = async () => {
        if (!studentName.trim()) return alert("Ism-familiyangizni kiriting!")
        setLoading(true)
        const { data, error } = await supabase.rpc('get_test_for_student', { query_id: id })
        if (error || !data) {
            alert("Xatolik: Test mavjud emas, vaqti o'tgan yoki nofaol holatda!")
        } else {
            setTestData(data)
            if (data.settings?.timeLimit) setTimeLeft(data.settings.timeLimit * 60)
            setStep('playing')
        }
        setLoading(false)
    }

    useEffect(() => {
        if (step === 'playing' && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(l => (l && l > 0 ? l - 1 : 0)), 1000)
            return () => clearInterval(timer)
        } else if (step === 'playing' && timeLeft === 0) {
            handleSubmit() // Auto submit when time runs out
        }
    }, [step, timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const handleAnswer = (qId: string, label: string) => {
        setAnswers(prev => ({ ...prev, [qId]: label }))
        if (testData?.settings?.interactiveMode) {
            setTimeout(() => {
                if (currentQIndex < testData.questions.length - 1) setCurrentQIndex(i => i + 1)
            }, 300)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        const { data, error } = await supabase.rpc('submit_test', { p_test_id: id, p_student: studentName, p_answers: answers })
        if (error) {
            alert("Natijani yuklashda xizmat xatosi: " + error.message)
        } else {
            setResult(data)
            setStep('result')
        }
        setLoading(false)
    }

    if (step === 'gate') {
        return (
            <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] w-full max-w-md border border-zinc-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#004B49] to-[#31C48D]" />
                    <div className="w-20 h-20 bg-[#004B49]/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-[#004B49]" />
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Imtihonga hush kelibsiz</h1>
                    <p className="text-zinc-500 font-medium mb-8">Testni boshlash uchun ism-familiyangizni to'liq kiriting</p>

                    <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Masalan: Alisherov Vali" className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl outline-none focus:border-[#004B49] focus:bg-white text-xl font-bold mb-6 text-center transition-all" />

                    <button onClick={handleStart} disabled={loading || !studentName.trim()} className="w-full h-16 bg-[#004B49] text-white rounded-2xl font-black text-xl shadow-xl shadow-[#004B49]/20 hover:-translate-y-1 hover:bg-[#003B39] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Testni Boshlash"}
                    </button>
                </motion.div>
            </div>
        )
    }

    if (step === 'playing' && testData) {
        const isInteractive = testData.settings.interactiveMode;
        const qsToRender = isInteractive ? [testData.questions[currentQIndex]] : testData.questions;

        return (
            <div className="min-h-screen bg-[#FBFBFA] font-sans">
                {/* Header */}
                <div className="bg-white border-b border-zinc-100 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h2 className="font-black text-xl text-zinc-900 line-clamp-1 max-w-xs sm:max-w-md">{testData.title}</h2>
                        <p className="font-semibold text-zinc-500 text-sm mt-0.5">{studentName}</p>
                    </div>
                    {timeLeft !== null && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-red-600 font-black text-lg shadow-sm">
                            <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32 pt-8">
                    {qsToRender.map((q: any, i: number) => {
                        const actualIndex = isInteractive ? currentQIndex : i;
                        return (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={q.id} className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm mb-6 border border-zinc-100">
                                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-8 leading-relaxed whitespace-pre-wrap">
                                    <span className="text-zinc-400 mr-2 font-black">{actualIndex + 1}.</span> {q.question}
                                </h3>
                                <div className="space-y-4">
                                    {q.options.map((opt: any) => {
                                        const selected = answers[q.id] === opt.label
                                        return (
                                            <div onClick={() => handleAnswer(q.id, opt.label)} key={opt.id} className={`flex items-center gap-5 p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${selected ? 'border-[#004B49] bg-[#004B49]/5 shadow-md' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white'}`}>
                                                <div className={`w-7 h-7 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-[#004B49] bg-[#004B49]' : 'border-zinc-300'}`}>
                                                    {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                </div>
                                                <span className="font-black text-xl text-zinc-400">{opt.label})</span>
                                                <span className={`font-bold text-lg ${selected ? 'text-[#004B49]' : 'text-zinc-700'}`}>{opt.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )
                    })}

                    {isInteractive && (
                        <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
                            <button onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))} disabled={currentQIndex === 0} className="px-6 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-30">Orqaga</button>
                            <div className="font-black text-zinc-900 bg-zinc-100 px-6 py-2.5 rounded-2xl">{currentQIndex + 1} / {testData.questions.length}</div>
                            {currentQIndex < testData.questions.length - 1 ? (
                                <button onClick={() => setCurrentQIndex(i => i + 1)} className="px-6 py-3 bg-[#004B49] text-white font-bold rounded-xl shadow-lg shadow-[#004B49]/20 hover:bg-[#003B39] transition-all">Keyingisi</button>
                            ) : (
                                <button onClick={handleSubmit} className="px-8 py-3 bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center gap-2">Yakunlash <CheckCircle2 className="w-5 h-5" /></button>
                            )}
                        </div>
                    )}

                    {!isInteractive && (
                        <button onClick={handleSubmit} disabled={loading} className="w-full py-5 sm:py-6 bg-[#004B49] text-white rounded-[24px] font-black text-2xl hover:bg-[#003B39] transition-all shadow-xl shadow-[#004B49]/20 flex justify-center items-center gap-3 mt-10">
                            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Testni Yakunlash <CheckCircle2 className="w-7 h-7" /></>}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (step === 'result' && result) {
        return (
            <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 sm:p-12 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] w-full max-w-xl border border-zinc-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-400 to-[#31C48D]" />
                    <div className="w-32 h-32 bg-[#31C48D]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-[8px] border-white shadow-xl relative z-10">
                        <CheckCircle2 className="w-16 h-16 text-[#31C48D]" />
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 mb-2">Imtihon Yakunlandi!</h1>
                    <p className="text-xl font-medium text-zinc-500 mb-10">Urra, {studentName} javoblaringiz qabul qilindi.</p>

                    <div className="bg-[#FBFBFA] p-8 rounded-[32px] border border-zinc-100 flex flex-col sm:flex-row justify-center gap-8 sm:gap-12 inset-shadow">
                        <div>
                            <p className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wide">Jami Savollar</p>
                            <h2 className="text-5xl font-black text-zinc-800">{result.total}</h2>
                        </div>
                        <div className="hidden sm:block w-px bg-zinc-200"></div>
                        <div className="block sm:hidden h-px bg-zinc-200 w-full"></div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wide">To'g'ri Javoblar</p>
                            <h2 className="text-5xl font-black text-[#31C48D] drop-shadow-sm">{result.score}</h2>
                        </div>
                    </div>

                    {result.details && (
                        <div className="mt-8 bg-blue-50/50 border border-blue-100 text-blue-800 p-6 rounded-3xl font-semibold flex items-start gap-4 text-left shadow-inner">
                            <AlertCircle className="w-7 h-7 shrink-0 text-blue-500" />
                            <p className="leading-relaxed">Sizning natijalaringiz ustozlar xonasiga (leaderboard) saqlandi. Har bir xatoingiz tahlil qilinadi.</p>
                        </div>
                    )}

                    <button onClick={() => window.location.reload()} className="mt-10 px-8 py-5 w-full rounded-2xl bg-zinc-900 text-white font-black text-xl hover:bg-black hover:-translate-y-1 shadow-xl shadow-black/10 transition-all">Yopish va Chiqish</button>
                </motion.div>
            </div>
        )
    }

    return null;
}
