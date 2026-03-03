import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { User, Clock, CheckCircle2, AlertCircle, Loader2, XCircle, ArrowRight } from 'lucide-react'

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

        let fp = localStorage.getItem('student_fp')
        if (!fp) {
            fp = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
            localStorage.setItem('student_fp', fp)
        }

        const { data, error } = await supabase.rpc('submit_test', {
            p_test_id: id,
            p_student: studentName,
            p_answers: answers,
            p_student_fingerprint: fp
        })
        if (error) {
            alert("Natijani yuklashda xizmat xatosi: " + error.message)
        } else {
            setResult(data)
            setStep('result')

            // Telegram notification integration
            if (testData.settings && testData.settings.telegramChatId) {
                const p = Math.round((data.score / (data.total || 1)) * 100);
                const msg = `📝 <b>Yangi Natija!</b>\n\n🎯 <b>Test:</b> ${testData.title}\n👤 <b>O'quvchi:</b> ${studentName}\n✅ <b>To'g'ri:</b> ${data.score} ta (Jami ${data.total})\n📊 <b>Foiz:</b> ${p}%\n\n📱 <i>AI Test Platform</i>`;

                fetch('/api/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: testData.settings.telegramChatId, message: msg })
                }).catch(console.error);
            }
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
        const percent = Math.round((result.score / (result.total || 1)) * 100);

        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-10 px-4 font-sans">
                {/* Top Success Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-[32px] shadow-sm w-full max-w-2xl border border-slate-100 text-center mb-10">
                    <div className="w-20 h-20 rounded-full border-[3px] border-[#31C48D] flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-[#31C48D]" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] mb-2 tracking-tight">Test Yakunlandi!</h1>
                    <p className="text-[15px] font-medium text-slate-500 mb-8 tracking-wide">Natijangiz ustozingizga yuborildi.</p>

                    <div className="bg-slate-50/50 rounded-3xl py-12 px-8 mb-8">
                        <h2 className="text-7xl sm:text-[80px] font-black text-[#508DF8] tracking-tighter mb-4">{percent}%</h2>
                        <p className="text-lg font-medium text-slate-700">{result.score} ta to'g'ri (Jami {result.total} ta)</p>
                    </div>

                    <div className="bg-[#F3F4F6] rounded-[20px] p-6 text-[15px] font-medium text-slate-600 leading-relaxed text-center">
                        Test yakunlandi. Agar natijalarni ko'rib bo'lgan bo'lsangiz,<br /> ushbu sahifani yopishingiz mumkin.
                    </div>
                </motion.div>

                {/* Analysis Section */}
                {result.details && result.details.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-2xl">
                        <div className="mb-8 flex justify-center">
                            <h3 className="text-2xl font-black text-[#1E293B] flex items-center gap-2">
                                <span className="bg-[#FBCFE8] px-3 py-1 rounded-md text-[#1E293B]">Javoblar</span> Tahlili
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {testData.questions.map((q: any, i: number) => {
                                const detail = result.details.find((d: any) => d.id === q.id)
                                if (!detail) return null;

                                const isCorrect = detail.correct;

                                return (
                                    <div key={q.id} className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                        <div className="flex items-start gap-2 mb-6">
                                            <div className="mt-1 shrink-0">
                                                {isCorrect ? (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#31C48D]"><CheckCircle2 className="w-5 h-5" /></div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#F43F5E]"><XCircle className="w-5 h-5" /></div>
                                                )}
                                            </div>
                                            <p className="font-bold text-lg text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                                                <span className="font-black mr-1">{i + 1}.</span>{q.question}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {q.options.map((opt: any) => {
                                                const isSelected = opt.label === detail.studentAnswer;
                                                const isActuallyCorrect = opt.label === detail.correctAnswer;

                                                let containerClasses = "border-slate-200 bg-white text-slate-600";
                                                let circleClasses = "border-slate-200 border-[2px]";
                                                let textClasses = "font-medium";
                                                let badge = null;

                                                if (isActuallyCorrect) {
                                                    containerClasses = "border-[#31C48D] bg-[#ECFDF5]";
                                                    circleClasses = isSelected ? "border-[#31C48D] border-[6px]" : "border-[#31C48D] border-[2px]";
                                                    textClasses = "font-bold text-[#059669]";
                                                    badge = <span className="bg-[#10B981] text-white text-[12px] font-bold px-3 py-1 rounded-full">To'g'ri javob</span>;
                                                } else if (isSelected && !isActuallyCorrect) {
                                                    containerClasses = "border-[#FDA4AF] bg-[#FFF1F2]";
                                                    circleClasses = "border-[#FB7185] border-[6px]";
                                                    textClasses = "font-medium text-[#F43F5E]";
                                                    badge = <span className="bg-[#FB7185] text-white text-[12px] font-bold px-3 py-1 rounded-full">Sizning javobingiz</span>;
                                                }

                                                return (
                                                    <div key={opt.id} className={`flex items-center justify-between p-4 rounded-xl border ${containerClasses}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-[22px] h-[22px] rounded-full shrink-0 ${circleClasses}`} />
                                                            <span className={`text-[15px] sm:text-base ${textClasses}`}>{opt.text}</span>
                                                        </div>
                                                        {badge}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        )
    }

    return null;
}
