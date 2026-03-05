import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, CheckCircle2, Clock, PenTool, BookOpen, Headphones, Save } from 'lucide-react'
import { rawToBand, overallBand, bandToColor, bandToLabel } from '../../lib/bandScore'

export default function MockGrading() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [session, setSession] = useState<any>(null)
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        const [sessRes, resRes] = await Promise.all([
            supabase.from('mock_sessions').select('*').eq('id', id).single(),
            supabase.from('mock_results').select('*').eq('mock_session_id', id).order('started_at', { ascending: false })
        ])
        if (sessRes.data) setSession(sessRes.data)
        if (resRes.data) setResults(resRes.data)
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [id])

    const handleGrade = async (resultId: string, field: string, value: any) => {
        setResults(prev => prev.map(r => r.id === resultId ? { ...r, [field]: value } : r))
    }

    const saveGrade = async (r: any) => {
        setSaving(r.id)
        const lBand = rawToBand(r.listening_score || 0, r.listening_total || 40)
        const rBand = rawToBand(r.reading_score || 0, r.reading_total || 40)
        const wScore = parseFloat(r.writing_score) || 0
        const sScore = parseFloat(r.speaking_score) || 0
        const oBand = overallBand([lBand, rBand, wScore, sScore].filter(s => s > 0))

        await supabase.from('mock_results').update({
            writing_score: wScore || null,
            writing_feedback: r.writing_feedback || '',
            speaking_score: sScore || null,
            speaking_feedback: r.speaking_feedback || '',
            overall_band: oBand,
            status: 'graded'
        }).eq('id', r.id)

        setResults(prev => prev.map(res => res.id === r.id ? { ...res, overall_band: oBand, status: 'graded' } : res))
        setSaving(null)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/mock-exams')} className="p-3 hover:bg-zinc-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-zinc-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">{session?.title || 'Mock Natijalar'}</h1>
                    <p className="text-zinc-500 font-medium mt-1">O'quvchilar natijalari va baholash</p>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="bg-white p-16 rounded-[32px] border border-zinc-100 text-center">
                    <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-zinc-500">Hali hech kim test topshirmagan</h3>
                </div>
            ) : (
                <div className="space-y-6">
                    {results.map(r => {
                        const lBand = rawToBand(r.listening_score || 0, r.listening_total || 1)
                        const rBand = rawToBand(r.reading_score || 0, r.reading_total || 1)
                        const isExpanded = expandedId === r.id
                        const statusColors: Record<string, string> = {
                            'in_progress': 'bg-amber-100 text-amber-700',
                            'finished': 'bg-blue-100 text-blue-700',
                            'graded': 'bg-emerald-100 text-emerald-700'
                        }
                        const statusLabels: Record<string, string> = {
                            'in_progress': 'Jarayonda',
                            'finished': 'Yakunlangan',
                            'graded': 'Baholangan'
                        }

                        return (
                            <div key={r.id} className="bg-white rounded-[28px] border border-zinc-100 shadow-sm overflow-hidden">
                                {/* Summary Row */}
                                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-500 text-lg">
                                            {r.student_name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 text-lg">{r.student_name}</h3>
                                            <p className="text-sm text-zinc-400 font-medium">Section: {r.current_section}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {r.overall_band && (
                                            <div className="text-right">
                                                <p className="text-3xl font-black" style={{ color: bandToColor(r.overall_band) }}>{r.overall_band}</p>
                                                <p className="text-xs font-bold text-zinc-400">{bandToLabel(r.overall_band)}</p>
                                            </div>
                                        )}
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[r.status] || 'bg-zinc-100 text-zinc-500'}`}>
                                            {statusLabels[r.status] || r.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        className="border-t border-zinc-100 p-6 space-y-6">

                                        {/* Scores Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-violet-50 p-4 rounded-2xl text-center">
                                                <Headphones className="w-5 h-5 text-violet-500 mx-auto mb-2" />
                                                <p className="text-2xl font-black text-violet-700">{lBand}</p>
                                                <p className="text-xs font-bold text-violet-400">{r.listening_score}/{r.listening_total}</p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                                <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                                <p className="text-2xl font-black text-blue-700">{rBand}</p>
                                                <p className="text-xs font-bold text-blue-400">{r.reading_score}/{r.reading_total}</p>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                                                <PenTool className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                                <p className="text-2xl font-black text-emerald-700">{r.writing_score || '—'}</p>
                                                <p className="text-xs font-bold text-emerald-400">Writing</p>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-2xl text-center">
                                                <CheckCircle2 className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                                                <p className="text-2xl font-black text-orange-700">{r.speaking_score || '—'}</p>
                                                <p className="text-xs font-bold text-orange-400">Speaking</p>
                                            </div>
                                        </div>

                                        {/* Writing Text */}
                                        {r.writing_text && (
                                            <div>
                                                <h4 className="text-sm font-black text-zinc-500 uppercase mb-3">O'quvchining Writing matni</h4>
                                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-zinc-700 font-medium leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                                    {r.writing_text}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grading Form */}
                                        {(r.status === 'finished' || r.status === 'graded') && (
                                            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                                                <h4 className="font-black text-indigo-800 text-sm uppercase">O'qituvchi bahosi</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-600 mb-1">Writing ball (0-9)</label>
                                                        <input type="number" min="0" max="9" step="0.5"
                                                            value={r.writing_score || ''}
                                                            onChange={e => handleGrade(r.id, 'writing_score', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-600 mb-1">Speaking ball (0-9)</label>
                                                        <input type="number" min="0" max="9" step="0.5"
                                                            value={r.speaking_score || ''}
                                                            onChange={e => handleGrade(r.id, 'speaking_score', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-indigo-600 mb-1">Writing izoh</label>
                                                        <textarea value={r.writing_feedback || ''}
                                                            onChange={e => handleGrade(r.id, 'writing_feedback', e.target.value)}
                                                            placeholder="Grammar, vocabulary, coherence haqida izoh..."
                                                            rows={2}
                                                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium resize-none" />
                                                    </div>
                                                </div>
                                                <button onClick={() => saveGrade(r)} disabled={saving === r.id}
                                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                                    {saving === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Baholash va Saqlash</>}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}
