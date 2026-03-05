import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Clock, FileText, Loader2, Link2, Trash2, ClipboardCheck, BookOpen, Headphones, PenTool, HelpCircle, ChevronRight, CheckCircle2 } from 'lucide-react'
import ConfirmModal from '../../components/ConfirmModal'
import { useNavigate } from 'react-router-dom'

export default function MockExams() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState<any[]>([])
    const [tests, setTests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<any>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isGuideOpen, setIsGuideOpen] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [listeningTestId, setListeningTestId] = useState('')
    const [readingTestId, setReadingTestId] = useState('')
    const [listeningMin, setListeningMin] = useState('30')
    const [readingMin, setReadingMin] = useState('60')
    const [writingMin, setWritingMin] = useState('60')
    const [writingPrompt, setWritingPrompt] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const [sessRes, testRes] = await Promise.all([
            supabase.from('mock_sessions').select('*').order('created_at', { ascending: false }),
            supabase.from('tests').select('id, title, folder_id').order('title')
        ])
        if (sessRes.data) setSessions(sessRes.data)
        if (testRes.data) setTests(testRes.data)
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const resetForm = () => {
        setTitle(''); setListeningTestId(''); setReadingTestId('')
        setListeningMin('30'); setReadingMin('60'); setWritingMin('60')
        setWritingPrompt(''); setEditingId(null)
    }

    const openNew = () => { resetForm(); setIsModalOpen(true) }

    const openEdit = (s: any) => {
        setEditingId(s.id)
        setTitle(s.title)
        setListeningTestId(s.listening_test_id || '')
        setReadingTestId(s.reading_test_id || '')
        setListeningMin(String(s.listening_minutes || 30))
        setReadingMin(String(s.reading_minutes || 60))
        setWritingMin(String(s.writing_minutes || 60))
        setWritingPrompt(s.writing_prompt || '')
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!title.trim()) return alert("Sarlavha kiriting!")
        if (!listeningTestId && !readingTestId) return alert("Kamida bitta test tanlang!")
        setSaving(true)

        const payload = {
            title: title.trim(),
            listening_test_id: listeningTestId || null,
            reading_test_id: readingTestId || null,
            listening_minutes: parseInt(listeningMin) || 30,
            reading_minutes: parseInt(readingMin) || 60,
            writing_minutes: parseInt(writingMin) || 60,
            writing_prompt: writingPrompt.trim(),
        }

        if (editingId) {
            await supabase.from('mock_sessions').update(payload).eq('id', editingId)
        } else {
            await supabase.from('mock_sessions').insert(payload)
        }

        setSaving(false)
        setIsModalOpen(false)
        resetForm()
        fetchData()
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await supabase.from('mock_sessions').delete().eq('id', deleteTarget.id)
        setDeleteTarget(null)
        fetchData()
    }

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/mock/${id}`
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
    )

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ClipboardCheck className="w-6 h-6 text-white" />
                        </div>
                        Mock Exam
                    </h1>
                    <p className="text-zinc-500 font-medium mt-2">IELTS formatidagi to'liq imtihon sessiyalari</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsGuideOpen(true)} className="px-5 py-4 bg-amber-50 text-amber-700 flex gap-2 items-center rounded-2xl font-bold hover:bg-amber-100 transition-colors border border-amber-200">
                        <HelpCircle className="w-5 h-5" /> Qo'llanma
                    </button>
                    <button onClick={openNew} className="px-6 py-4 bg-indigo-600 text-white flex gap-3 items-center rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
                        <Plus className="w-5 h-5" /> Yangi Mock
                    </button>
                </div>
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <div className="bg-white p-16 rounded-[40px] border border-zinc-100 shadow-sm text-center">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full mx-auto flex items-center justify-center mb-6">
                        <ClipboardCheck className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-3">Hali mock imtihon yo'q</h2>
                    <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8">IELTS formatidagi to'liq imtihon yaratish uchun "Yangi Mock" tugmasini bosing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sessions.map(s => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[28px] border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative">

                            <div className="flex items-start justify-between mb-6">
                                <h3 className="text-xl font-black text-zinc-900 flex-1 pr-4">{s.title}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(s)} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-700">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeleteTarget(s)} className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Section badges */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {s.listening_test_id && (
                                    <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                        <Headphones className="w-3.5 h-3.5" /> Listening · {s.listening_minutes} min
                                    </span>
                                )}
                                {s.reading_test_id && (
                                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5" /> Reading · {s.reading_minutes} min
                                    </span>
                                )}
                                {s.writing_prompt && (
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                        <PenTool className="w-3.5 h-3.5" /> Writing · {s.writing_minutes} min
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button onClick={() => copyLink(s.id)}
                                    className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${copiedId === s.id ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                                    <Link2 className="w-4 h-4" /> {copiedId === s.id ? 'Nusxalandi!' : 'Havola nusxalash'}
                                </button>
                                <button onClick={() => navigate(`/dashboard/mock-exams/${s.id}/grading`)}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                    <ClipboardCheck className="w-4 h-4" /> Natijalar
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-zinc-100 flex justify-between items-center z-10 rounded-t-[32px]">
                                <h2 className="text-2xl font-black text-zinc-900">{editingId ? "Mock Tahrirlash" : "Yangi Mock Yaratish"}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Imtihon Nomi</label>
                                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="1-sinov imtihoni"
                                        className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-base text-zinc-900" />
                                </div>

                                {/* Listening */}
                                <div className="bg-violet-50/50 p-6 rounded-2xl border border-violet-100">
                                    <h3 className="font-black text-violet-800 mb-4 flex items-center gap-2">
                                        <Headphones className="w-5 h-5" /> Tinglash Bo'limi
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-violet-600 mb-2 uppercase">Testni Tanlang</label>
                                            <select value={listeningTestId} onChange={e => setListeningTestId(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-violet-200 rounded-2xl outline-none focus:border-violet-500 font-bold text-base text-zinc-900 appearance-none">
                                                <option value="">Tanlanmagan</option>
                                                {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-violet-600 mb-2 uppercase flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Vaqt (daqiqa)
                                            </label>
                                            <input type="number" min="1" value={listeningMin} onChange={e => setListeningMin(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-violet-200 rounded-2xl outline-none focus:border-violet-500 font-bold text-base text-zinc-900" />
                                        </div>
                                    </div>
                                </div>

                                {/* Reading */}
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" /> O'qish Bo'limi
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 mb-2 uppercase">Testni Tanlang</label>
                                            <select value={readingTestId} onChange={e => setReadingTestId(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-base text-zinc-900 appearance-none">
                                                <option value="">Tanlanmagan</option>
                                                {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-600 mb-2 uppercase flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Vaqt (daqiqa)
                                            </label>
                                            <input type="number" min="1" value={readingMin} onChange={e => setReadingMin(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-base text-zinc-900" />
                                        </div>
                                    </div>
                                </div>

                                {/* Writing */}
                                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                    <h3 className="font-black text-emerald-800 mb-4 flex items-center gap-2">
                                        <PenTool className="w-5 h-5" /> Yozish Bo'limi
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-600 mb-2 uppercase">Yozish Topshirig'i</label>
                                            <textarea value={writingPrompt} onChange={e => setWritingPrompt(e.target.value)}
                                                placeholder="Kamida 250 so'z yozing..."
                                                rows={4}
                                                className="w-full px-5 py-4 bg-white border border-emerald-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-base text-zinc-900 resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-600 mb-2 uppercase flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Vaqt (daqiqa)
                                            </label>
                                            <input type="number" min="1" value={writingMin} onChange={e => setWritingMin(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-emerald-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-base text-zinc-900" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="px-8 py-6 border-t border-zinc-100 bg-white/50 backdrop-blur-md rounded-b-[32px]">
                                <button onClick={handleSave} disabled={saving}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{editingId ? "Saqlash" : "Mock Yaratish"}</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Mock o'chirilsinmi?"
                message={`"${deleteTarget?.title}" va undagi barcha natijalar o'chiriladi.`}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />

            {/* Guide Modal */}
            <AnimatePresence>
                {isGuideOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsGuideOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-zinc-100 flex justify-between items-center z-10 rounded-t-[32px]">
                                <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <HelpCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    Mock Exam Qo'llanmasi
                                </h2>
                                <button onClick={() => setIsGuideOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* 1-qadam */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                                        <h3 className="font-black text-indigo-900 text-lg">Avval oddiy testlar yarating</h3>
                                    </div>
                                    <p className="text-indigo-700/70 font-medium leading-relaxed pl-11">
                                        Sinov imtihoni mavjud testlaringizdan foydalanadi. Shuning uchun <strong>avval "Papkalar va Testlar"</strong> bo'limiga o'tib, Tinglash va O'qish uchun alohida testlar yarating. Har bir testda savollar va to'g'ri javoblar bo'lishi shart.
                                    </p>
                                </div>

                                {/* 2-qadam */}
                                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 rounded-2xl border border-violet-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                                        <h3 className="font-black text-violet-900 text-lg">"Yangi Mock" tugmasini bosing</h3>
                                    </div>
                                    <p className="text-violet-700/70 font-medium leading-relaxed pl-11">
                                        Imtihon nomini yozing (masalan: "1-sinov imtihoni"). Keyin 3 ta bo'limni sozlang:
                                    </p>
                                    <div className="pl-11 mt-3 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Headphones className="w-4 h-4 text-violet-500" />
                                            <span className="font-bold text-violet-800">Tinglash</span>
                                            <ChevronRight className="w-3 h-3 text-violet-300" />
                                            <span className="text-violet-600">Oldindan yaratgan testingizni tanlang va vaqt belgilang</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <BookOpen className="w-4 h-4 text-violet-500" />
                                            <span className="font-bold text-violet-800">O'qish</span>
                                            <ChevronRight className="w-3 h-3 text-violet-300" />
                                            <span className="text-violet-600">O'qish testini tanlang va vaqt belgilang</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <PenTool className="w-4 h-4 text-violet-500" />
                                            <span className="font-bold text-violet-800">Yozish</span>
                                            <ChevronRight className="w-3 h-3 text-violet-300" />
                                            <span className="text-violet-600">Topshiriq matnini yozing (insho topshirig'i)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3-qadam */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                                        <h3 className="font-black text-emerald-900 text-lg">O'quvchiga havola yuboring</h3>
                                    </div>
                                    <p className="text-emerald-700/70 font-medium leading-relaxed pl-11">
                                        Imtihon yaratilgach, kartochkada <strong>"Havola nusxalash"</strong> tugmasi paydo bo'ladi. Uni bosib havolani nusxalang va o'quvchiga messenja orqali yuboring.
                                    </p>
                                </div>

                                {/* 4-qadam */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                                        <h3 className="font-black text-blue-900 text-lg">O'quvchi imtihon topshiradi</h3>
                                    </div>
                                    <p className="text-blue-700/70 font-medium leading-relaxed pl-11">
                                        O'quvchi havolani ochadi va ketma-ket <strong>Tinglash → O'qish → Yozish</strong> bo'limlarini topshiradi. Har bir bo'limda vaqt sanagich ishlaydi. Vaqt tugasa — avtomatik yakunlanadi.
                                    </p>
                                    <div className="pl-11 mt-3 space-y-1.5">
                                        <p className="text-blue-600 text-sm font-medium">🔒 Oyna almashtirilsa — ogohlantirish chiqadi</p>
                                        <p className="text-blue-600 text-sm font-medium">💾 Har 15 soniyada javoblar avtomatik saqlanadi</p>
                                        <p className="text-blue-600 text-sm font-medium">📱 Aloqa uzilsa — qayta kirganda davom etadi</p>
                                    </div>
                                </div>

                                {/* 5-qadam */}
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-sm">5</div>
                                        <h3 className="font-black text-amber-900 text-lg">Natijalarni baholang</h3>
                                    </div>
                                    <p className="text-amber-700/70 font-medium leading-relaxed pl-11">
                                        <strong>"Natijalar"</strong> tugmasini bosing. Tinglash va O'qish ballari <strong>avtomatik</strong> 9 ballik shkalada hisoblanadi. Yozish uchun o'quvchining matnini o'qib, 0 dan 9 gacha ball va izoh yozing.
                                    </p>
                                </div>

                                {/* IELTS Ball Shkalasi */}
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                                    <h4 className="font-black text-zinc-700 text-sm uppercase mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-zinc-500" /> IELTS Ball Shkalasi
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        {[['39-40', '9.0'], ['35-36', '8.0'], ['30-32', '7.0'], ['23-26', '6.0'], ['16-19', '5.0'], ['10-12', '4.0'], ['6-9', '3.5'], ['1-5', '2.0-3.0']].map(([raw, band]) => (
                                            <div key={raw} className="bg-white p-2 rounded-xl border border-zinc-100">
                                                <p className="text-xs text-zinc-400 font-medium">{raw} ✓</p>
                                                <p className="text-lg font-black text-zinc-800">{band}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-400 font-medium mt-3 text-center">To'g'ri javoblar soni → ball (40 ta savolga asoslangan)</p>
                                </div>

                                {/* CEFR Ball Shkalasi */}
                                <div className="bg-gradient-to-br from-sky-50 to-indigo-50 p-6 rounded-2xl border border-sky-200">
                                    <h4 className="font-black text-sky-800 text-sm uppercase mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-sky-500" /> CEFR Daraja Shkalasi
                                    </h4>
                                    <p className="text-sky-700/60 text-xs font-medium mb-3">Umumiy Yevropa Til Standartlari bo'yicha daraja aniqlash</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            ['A1', 'Boshlang\'ich', '10-19%', 'bg-red-50 border-red-100 text-red-700'],
                                            ['A2', 'Tayanch', '20-39%', 'bg-orange-50 border-orange-100 text-orange-700'],
                                            ['B1', 'O\'rta', '40-59%', 'bg-amber-50 border-amber-100 text-amber-700'],
                                            ['B2', 'Yuqori o\'rta', '60-74%', 'bg-emerald-50 border-emerald-100 text-emerald-700'],
                                            ['C1', 'Ilg\'or', '75-89%', 'bg-blue-50 border-blue-100 text-blue-700'],
                                            ['C2', 'Mukammal', '90-100%', 'bg-violet-50 border-violet-100 text-violet-700'],
                                        ].map(([level, label, percent, style]) => (
                                            <div key={level} className={`p-3 rounded-xl border ${style}`}>
                                                <p className="text-xl font-black">{level}</p>
                                                <p className="text-[11px] font-bold opacity-70">{label}</p>
                                                <p className="text-[10px] font-medium opacity-50 mt-1">{percent}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-sky-500/60 font-medium mt-3 text-center">To'g'ri javoblar foizi → daraja</p>
                                </div>
                            </div>

                            <div className="px-8 py-6 border-t border-zinc-100 bg-white/50 backdrop-blur-md rounded-b-[32px]">
                                <button onClick={() => setIsGuideOpen(false)}
                                    className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-lg hover:bg-zinc-800 transition-all">
                                    Tushundim, yopish ✓
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
