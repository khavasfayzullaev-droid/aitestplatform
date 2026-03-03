import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Loader2, Users, TrendingUp, Target, AlertTriangle, Trash2 } from 'lucide-react'

export default function TestResults() {
    const { testId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [testData, setTestData] = useState<any>(null)
    const [submissions, setSubmissions] = useState<any[]>([])

    // Analytics state
    const [masteryPercent, setMasteryPercent] = useState(0)
    const [hardestQ, setHardestQ] = useState<any>(null)
    const [easiestQ, setEasiestQ] = useState<any>(null)

    const fetchResults = async () => {
        setLoading(true)
        // 1. Fetch test details
        const { data: test, error: tErr } = await supabase.from('tests').select('*').eq('id', testId).single()
        if (tErr) {
            console.error(tErr)
            setLoading(false)
            return
        }
        setTestData(test)

        // 2. Fetch submissions
        const { data: subs, error: sErr } = await supabase.from('submissions').select('*').eq('test_id', testId).order('score', { ascending: false })
        if (sErr) console.error(sErr)

        const validSubs = subs || []
        setSubmissions(validSubs)

        // 3. Calculate Analytics
        if (validSubs.length > 0) {
            let totalScores = 0
            let totalPossible = validSubs.length * (test.questions.length || 1)

            // For analyzing questions
            const qStats: Record<string, { correct: number, wrong: number, text: string }> = {}
            test.questions.forEach((q: any) => {
                qStats[q.id] = { correct: 0, wrong: 0, text: q.question }
            });

            validSubs.forEach(sub => {
                totalScores += sub.score
                Object.entries(sub.answers || {}).forEach(([qId, ans]) => {
                    const question = test.questions.find((q: any) => q.id === qId)
                    if (question) {
                        if (ans === question.correctAnswer) qStats[qId].correct += 1
                        else qStats[qId].wrong += 1
                    }
                })
            })

            setMasteryPercent(Math.round((totalScores / totalPossible) * 100))

            // Find easiest and hardest
            let maxCorrect = -1;
            let easiestId = null;
            let maxWrong = -1;
            let hardestId = null;

            Object.keys(qStats).forEach(qId => {
                const stat = qStats[qId]
                if (stat.correct > maxCorrect) {
                    maxCorrect = stat.correct
                    easiestId = qId
                }
                if (stat.wrong > maxWrong) {
                    maxWrong = stat.wrong
                    hardestId = qId
                }
            })

            if (easiestId && maxCorrect > 0) {
                setEasiestQ({ ...qStats[easiestId], percent: Math.round((maxCorrect / validSubs.length) * 100) })
            }
            if (hardestId && maxWrong > 0) {
                setHardestQ({ ...qStats[hardestId], percent: Math.round((maxWrong / validSubs.length) * 100) })
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        if (testId) fetchResults()
    }, [testId])

    const handleDelete = async (subId: string, studentName: string) => {
        if (!confirm(`${studentName} nomli o'quvchi natijasini ro'yxatdan va bazadan butunlay o'chirib tashlamoqchimisiz?`)) return
        const { error } = await supabase.from('submissions').delete().eq('id', subId)
        if (error) {
            alert("Xatolik: O'chirish ruxsati yo'q! " + error.message)
        } else {
            fetchResults()
        }
    }

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#004B49]" />
        </div>
    )

    if (!testData) return <div className="p-10 text-center font-bold text-zinc-500">Test topilmadi</div>

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-zinc-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 line-clamp-1">{testData.title}</h1>
                    <p className="font-semibold text-zinc-500 mt-1">Natijalar va Tahlika (Analitika) Paneli</p>
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Users className="w-5 h-5" /></div>
                        <span className="font-bold text-zinc-500 text-sm">Topshirganlar</span>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-zinc-900">{submissions.length}</h3>
                        <p className="text-sm font-semibold text-zinc-400 mt-1">nafar o'quvchi</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
                        <span className="font-bold text-zinc-500 text-sm">O'zlashtirish</span>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-emerald-500">{masteryPercent}%</h3>
                        <p className="text-sm font-semibold text-zinc-400 mt-1">umumiy o'rtacha foiz</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><AlertTriangle className="w-5 h-5" /></div>
                        <span className="font-bold text-zinc-500 text-sm">Eng qiyin savol</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 line-clamp-1">{hardestQ ? `${hardestQ.percent}% xato` : 'Yo\'q'}</h3>
                        <p className="text-sm font-semibold text-zinc-400 mt-1 line-clamp-2">{hardestQ ? hardestQ.text : 'Yetarli ma\'lumot yo\'q'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500"><Target className="w-5 h-5" /></div>
                        <span className="font-bold text-zinc-500 text-sm">Eng oson savol</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 line-clamp-1">{easiestQ ? `${easiestQ.percent}% to'g'ri` : 'Yo\'q'}</h3>
                        <p className="text-sm font-semibold text-zinc-400 mt-1 line-clamp-2">{easiestQ ? easiestQ.text : 'Yetarli ma\'lumot yo\'q'}</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden mb-10">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                    <h2 className="text-xl font-black text-zinc-900">O'quvchilar Reytingi (Leaderboard)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 text-[11px] uppercase tracking-widest font-bold text-zinc-400">
                                <th className="p-4 pl-6 font-bold">#</th>
                                <th className="p-4 font-bold">Ism Familiya</th>
                                <th className="p-4 font-bold">Topshirgan Vaqti</th>
                                <th className="p-4 font-bold">To'g'ri</th>
                                <th className="p-4 font-bold">Foiz</th>
                                <th className="p-4 pr-6 font-bold text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="text-zinc-800 text-sm font-medium">
                            {submissions.map((sub, idx) => {
                                const percent = Math.round((sub.score / (testData.questions.length || 1)) * 100)
                                const isTop = idx < 3
                                return (
                                    <tr key={sub.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${isTop ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-base">{sub.student_name}</td>
                                        <td className="p-4 text-zinc-500 font-semibold text-xs whitespace-nowrap">
                                            {new Date(sub.submitted_at || sub.started_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                                        </td>
                                        <td className="p-4 font-black text-emerald-600 text-base">{sub.score} / {testData.questions.length}</td>
                                        <td className="p-4 min-w-[140px]">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold w-10">{percent}%</span>
                                                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button onClick={() => handleDelete(sub.id, sub.student_name)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-auto" title="Natijani O'chirish">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center font-bold text-zinc-400">
                                        Hali hech kim testni ishlamabdi. O'quvchilar javoblari shu yerda tushadi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
