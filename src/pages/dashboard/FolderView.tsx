import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText, Loader2, X, Wand2, Plus, Settings as SettingsIcon, Clock, Calendar, CheckCircle2, Trash2, BarChart2, Edit2, Link2, Printer, Send, AlertCircle, Info, ImagePlus, Music, XCircle } from 'lucide-react'
import ConfirmModal from '../../components/ConfirmModal'
import { useReactToPrint } from 'react-to-print'
import { useRef } from 'react'
import { PrintTest } from '../../components/pdf/PrintTest'

function parseTestText(rawText: string) {
    let mainText = rawText;
    let answersText = '';

    const splitMatch = rawText.match(/\b(kalitlar|javoblar)\b/i);
    if (splitMatch && splitMatch.index !== undefined) {
        mainText = rawText.substring(0, splitMatch.index);
        answersText = rawText.substring(splitMatch.index);
    }

    const lines = mainText.split('\n').map(l => l.trim()).filter(Boolean);
    const questions: any[] = [];
    let currentQ: any = null;
    const qRegex = /^(\d+)[\.\)]\s*(.*)/;
    const optRegex = /^([A-Ea-e])[\.\)]\s*(.*)/;

    for (const line of lines) {
        const qMatch = line.match(qRegex);
        if (qMatch) {
            if (currentQ) questions.push(currentQ);
            currentQ = { id: crypto.randomUUID(), num: qMatch[1], question: qMatch[2] || line, options: [] };
            continue;
        }
        const optMatch = line.match(optRegex);
        if (optMatch && currentQ) {
            currentQ.options.push({ id: crypto.randomUUID(), text: optMatch[2] || line, label: optMatch[1].toUpperCase() });
            continue;
        }
        if (currentQ && currentQ.options.length === 0) currentQ.question += '\n' + line;
    }
    if (currentQ) questions.push(currentQ);

    const answersMap: Record<string, string> = {};
    const ansRegex = /\b(\d+)\s*[-=.)]?\s*([A-Ea-e])\b/gi;

    if (answersText) {
        let match;
        while ((match = ansRegex.exec(answersText)) !== null) {
            answersMap[match[1]] = match[2].toUpperCase();
        }
    } else {
        const allLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of allLines) {
            if (/^([\d\sA-Ea-e\-.,)]+)$/.test(line)) {
                let match;
                while ((match = ansRegex.exec(line)) !== null) {
                    answersMap[match[1]] = match[2].toUpperCase();
                }
            }
        }
    }

    questions.forEach((q, index) => {
        const num = q.num || String(index + 1);
        q.correctAnswer = answersMap[num] || answersMap[String(index + 1)] || '';
        delete q.num;
    });

    return questions;
}

const Toggle = ({ checked, onChange, label, desc }: any) => (
    <div className="flex items-center justify-between p-4 bg-zinc-50 border-2 border-transparent hover:border-zinc-200 rounded-2xl cursor-pointer transition-all" onClick={() => onChange(!checked)}>
        <div className="pr-4">
            <h4 className="font-bold text-zinc-900">{label}</h4>
            <p className="text-xs font-semibold text-zinc-500 mt-1">{desc}</p>
        </div>
        <div className={`w-12 h-6 md:w-14 md:h-7 shrink-0 rounded-full p-1 transition-colors relative ${checked ? 'bg-[#31C48D]' : 'bg-zinc-300'}`}>
            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'}`} />
        </div>
    </div>
)

export default function FolderView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [folder, setFolder] = useState<any>(null)
    const [tests, setTests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [creationMode, setCreationMode] = useState<'auto' | 'manual'>('auto')

    const [testTitle, setTestTitle] = useState('')
    const [description, setDescription] = useState('')
    const [timeLimit, setTimeLimit] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [showResults, setShowResults] = useState(true)
    const [interactiveMode, setInteractiveMode] = useState(false)
    const [telegramChatId, setTelegramChatId] = useState('')

    const [rawText, setRawText] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [editingTestId, setEditingTestId] = useState<string | null>(null)

    // Deletion Modal States
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Folder Rename States
    const [isEditingFolder, setIsEditingFolder] = useState(false)
    const [editFolderName, setEditFolderName] = useState("")
    const [savingFolder, setSavingFolder] = useState(false)

    const getEmptyQ = () => ({ id: crypto.randomUUID(), question: '', options: [{ id: crypto.randomUUID(), text: '', label: 'A' }, { id: crypto.randomUUID(), text: '', label: 'B' }, { id: crypto.randomUUID(), text: '', label: 'C' }, { id: crypto.randomUUID(), text: '', label: 'D' }], correctAnswer: '' })
    const [manualQs, setManualQs] = useState<any[]>([getEmptyQ()])
    const [uploadingQId, setUploadingQId] = useState<string | null>(null)

    // Telegram Quiz state
    const [quizTarget, setQuizTarget] = useState<any>(null);
    const [quizSuccess, setQuizSuccess] = useState<{ count: number; skipped: number } | null>(null);
    const [tgBotToken, setTgBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
    const [tgChatId, setTgChatId] = useState(() => localStorage.getItem('tg_chat_id') || '');
    const [sendingQuiz, setSendingQuiz] = useState(false);
    const [sentQuizCount, setSentQuizCount] = useState(0);

    // PDF Printing states
    const printRef = useRef<HTMLDivElement>(null)
    const [printingTests, setPrintingTests] = useState<any[]>([])
    const handlePrintContent = useReactToPrint({
        contentRef: printRef,
        documentTitle: folder?.name ? `${folder.name} Testlari` : 'Testlar'
    })

    const handlePrint = (testsToPrint: any[]) => {
        setPrintingTests(testsToPrint)
        setTimeout(() => {
            handlePrintContent()
        }, 300) // allow DOM to layout the invisible component
    }

    const handleOpenEdit = (test: any) => {
        setEditingTestId(test.id);
        setCreationMode('manual');
        setTestTitle(test.title);
        setDescription(test.settings?.description || '');
        setTimeLimit(test.settings?.timeLimit ? String(test.settings.timeLimit) : '');
        setStartTime(test.settings?.startTime || '');
        setEndTime(test.settings?.endTime || '');
        setShowResults(test.settings?.showResults ?? true);
        setInteractiveMode(test.settings?.interactiveMode ?? false);
        setTelegramChatId(test.settings?.telegramChatId || '');
        setManualQs(test.questions && test.questions.length > 0 ? test.questions : [getEmptyQ()]);
        setIsModalOpen(true);
    }

    const openNewTest = () => {
        setEditingTestId(null);
        setCreationMode('auto');
        setTestTitle(''); setDescription(''); setTimeLimit(''); setStartTime(''); setEndTime('');
        setShowResults(true); setInteractiveMode(false); setTelegramChatId(''); setRawText(''); setManualQs([getEmptyQ()]);
        setIsModalOpen(true);
    }

    const fetchFolderData = async () => {
        setLoading(true)
        const { data: folderData } = await supabase.from('folders').select('*').eq('id', id).single()
        if (folderData) {
            setFolder(folderData)
            const { data: testsData } = await supabase.from('tests').select('*').eq('folder_id', id).order('created_at', { ascending: false })
            if (testsData) setTests(testsData)
        }
        setLoading(false)
    }

    useEffect(() => { if (id) fetchFolderData() }, [id])

    const addQ = () => setManualQs(prev => [...prev, getEmptyQ()])
    const rmQ = (qid: string) => setManualQs(prev => prev.filter(q => q.id !== qid))
    const upQ = (id: string, field: string, val: any) => setManualQs(prev => prev.map(q => q.id === id ? { ...q, [field]: val } : q))
    const upQMulti = (id: string, fields: Record<string, any>) => setManualQs(prev => prev.map(q => q.id === id ? { ...q, ...fields } : q))

    const handleSave = async () => {
        if (!testTitle.trim()) return alert("Sarlavhani kiritish majburiy!")
        setParsing(true)

        let finalQuestions = []
        if (creationMode === 'auto') {
            finalQuestions = parseTestText(rawText)
            if (finalQuestions.length === 0) return alert("Matnda savollar topilmadi."), setParsing(false);
        } else {
            const valid = manualQs.every(q => q.question.trim() && q.options.every((o: any) => o.text.trim()) && q.correctAnswer);
            if (!valid) return alert("Barcha variantlar va to'g'ri javoblarni belgilang!"), setParsing(false);
            finalQuestions = manualQs;
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const payload = {
            title: testTitle,
            questions: finalQuestions,
            settings: {
                description: description.trim(),
                timeLimit: timeLimit ? parseInt(timeLimit) : null,
                startTime: startTime || null,
                endTime: endTime || null,
                showResults,
                interactiveMode,
                telegramChatId: telegramChatId.trim()
            }
        };

        if (editingTestId) {
            const { error } = await supabase.from('tests').update(payload).eq('id', editingTestId);
            if (!error) { setIsModalOpen(false); fetchFolderData(); }
            else { alert("Xatolik: " + error.message); }
        } else {
            const { error } = await supabase.from('tests').insert([{ ...payload, folder_id: id, user_id: user.id, answers: {}, is_active: true }]);
            if (!error) { setIsModalOpen(false); fetchFolderData(); }
            else { alert("Xatolik: " + error.message); }
        }
        setParsing(false)
    }

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#004B49]" /></div>
    if (!folder) return <div className="p-10 text-center font-bold text-xl">Papka topilmadi.</div>

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full relative pb-20">
            <button onClick={() => navigate('/dashboard/folders')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold mb-6 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl w-fit">
                <ArrowLeft className="w-5 h-5" /> Orqaga
            </button>

            <div className="flex justify-between items-end mb-10">
                <div>
                    <div className="flex items-center gap-3">
                        {isEditingFolder ? (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!editFolderName.trim()) return;
                                    setSavingFolder(true);
                                    const { error } = await supabase.from('folders').update({ name: editFolderName }).eq('id', folder.id);
                                    if (!error) {
                                        setFolder({ ...folder, name: editFolderName });
                                        setIsEditingFolder(false);
                                    } else alert("Xatolik: " + error.message);
                                    setSavingFolder(false);
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    autoFocus
                                    value={editFolderName}
                                    onChange={e => setEditFolderName(e.target.value)}
                                    className="text-4xl font-black text-zinc-900 tracking-tight bg-transparent border-b-2 border-dashed border-zinc-300 focus:border-[#004B49] outline-none px-1 py-1 w-full max-w-[300px] sm:max-w-[400px]"
                                />
                                <button type="submit" disabled={savingFolder} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#004B49] text-white hover:bg-[#003B39] transition-colors shadow-md disabled:opacity-50"><CheckCircle2 className="w-6 h-6" /></button>
                                <button type="button" onClick={() => setIsEditingFolder(false)} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"><X className="w-6 h-6" /></button>
                            </form>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{folder.name}</h1>
                                <button onClick={() => { setEditFolderName(folder.name); setIsEditingFolder(true) }} className="p-2 text-zinc-400 hover:text-[#004B49] hover:bg-[#004B49]/10 rounded-xl transition-all h-fit" title="Papkani nomini o'zgartirish">
                                    <Edit2 className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-zinc-500 font-medium mt-3 text-lg">Ichki testlar ro'yxati</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => tests.length > 0 ? handlePrint(tests) : alert("Papka ichida testlar yo'q!")} className="px-6 py-3.5 bg-zinc-900 text-white flex gap-2 items-center rounded-2xl font-bold shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-colors">
                        <Printer className="w-5 h-5" /> <span className="hidden sm:inline">Barcha Testlar (PDF)</span>
                    </button>
                    <button onClick={openNewTest} className="px-6 py-3.5 bg-[#004B49] text-white flex gap-2 items-center rounded-2xl font-bold shadow-xl shadow-[#004B49]/20 hover:bg-[#003B39]">
                        <Plus className="w-5 h-5" /> Yangi Test Yaratish
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(test => (
                    <motion.div whileHover={{ y: -4 }} key={test.id} className="bg-white p-6 rounded-[32px] shadow-sm shadow-slate-200/50 hover:shadow-xl transition-all flex flex-col group border-2 border-transparent hover:border-slate-100">
                        <div className="flex justify-between items-start mb-5 gap-2">
                            <div className="w-16 h-16 bg-[#F3F4F6] rounded-[20px] flex shrink-0 items-center justify-center transition-colors">
                                <FileText className="w-8 h-8 text-[#115E59]" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(test);
                                }} className="w-11 h-11 flex shrink-0 items-center justify-center bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFEDD5] rounded-[14px] transition-colors" title="Testni Tahrirlash/Ko'rish">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget({ id: test.id, title: test.title });
                                }} className="w-11 h-11 flex shrink-0 items-center justify-center bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] rounded-[14px] transition-colors" title="Testni O'chirish">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint([test]);
                                }} className="w-11 h-11 bg-[#F9FAFB] text-slate-500 hover:text-[#115E59] hover:bg-slate-100 rounded-[14px] flex items-center justify-center transition-colors shadow-sm" title="Joriy Testni PDF qilish">
                                    <Printer className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-[26px] font-bold text-slate-800 line-clamp-1 leading-tight tracking-tight mb-1">{test.title}</h3>
                        <p className="text-[15px] font-bold text-slate-400 mb-5">{test.questions?.length || 0} ta tayyor savollar</p>

                        <div className="flex flex-col gap-2 mb-6">
                            {test.settings?.description && (
                                <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                                    {test.settings.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[13px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-[12px] flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(test.created_at || Date.now()).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                                </span>
                                {test.settings?.timeLimit && (
                                    <span className="text-[13px] font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-[12px] flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> {test.settings.timeLimit} daq
                                    </span>
                                )}
                                {test.settings?.interactiveMode && (
                                    <span className="text-[13px] font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-[12px]">
                                        ⚡️ Interaktiv
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto flex gap-2 w-full border-t border-slate-100 pt-5">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/test/${test.id}/results`);
                            }} className="flex-1 flex items-center justify-center gap-1.5 bg-[#EFF6FF] text-[#3B82F6] font-bold py-3.5 hover:bg-[#DBEAFE] rounded-[18px] transition-colors shrink-0" title="O'quvchilar natijalari">
                                <BarChart2 className="w-5 h-5 text-[#3B82F6]" /> <span>Natijalar</span>
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const link = `${window.location.origin}/t/${test.id}`;
                                navigator.clipboard.writeText(link);
                                setCopiedId(test.id);
                                setTimeout(() => setCopiedId(null), 2000);
                            }} className={`flex-1 flex items-center justify-center gap-1.5 font-bold py-3.5 rounded-[18px] transition-colors shrink-0 ${copiedId === test.id ? 'bg-[#10B981] text-white hover:bg-[#059669]' : 'bg-[#F3F4F6] text-[#0F172A] hover:bg-[#E5E7EB]'}`}>
                                {copiedId === test.id ? <><CheckCircle2 className="w-5 h-5" /> Olindi</> : <><Link2 className="w-5 h-5" /> <span>Havola</span></>}
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                setQuizTarget(test);
                            }} className="w-[52px] h-[52px] items-center justify-center bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] rounded-[18px] transition-colors flex shrink-0" title="Viktorinani Telegramga yuborish">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[40px] w-full max-w-7xl h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden">

                            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
                                <h2 className="text-3xl font-black text-zinc-900">{editingTestId ? 'Testni Tahrirlash' : 'Test Markazi'}</h2>
                                {!editingTestId && (
                                    <div className="flex bg-zinc-100 p-1 rounded-2xl w-[400px]">
                                        <button onClick={() => setCreationMode('manual')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm ${creationMode === 'manual' ? 'bg-white shadow text-[#004B49]' : 'text-zinc-500'}`}>Qo'lda kiritish</button>
                                        <button onClick={() => setCreationMode('auto')} className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm ${creationMode === 'auto' ? 'bg-[#004B49] shadow text-white' : 'text-zinc-500'}`}><Wand2 className="w-4 h-4" /> Avto (Parser)</button>
                                    </div>
                                )}
                                {editingTestId && (
                                    <div className="px-5 py-2.5 bg-orange-50 text-orange-600 font-bold rounded-xl text-sm flex items-center gap-2"><Edit2 className="w-4 h-4" /> Tahrirlash (Ko'rish) Rejimidasiz</div>
                                )}
                                <button onClick={() => setIsModalOpen(false)} className="p-3 text-zinc-400 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#FBFBFA]">
                                <div className="flex-1 overflow-y-auto p-8 border-r border-zinc-100 bg-white custom-scrollbar">
                                    {creationMode === 'auto' ? (
                                        <div className="h-full flex flex-col">
                                            <label className="block text-sm font-bold text-zinc-700 mb-3 ml-2 uppercase">Test matni</label>
                                            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="1. O'zbekistonning poytaxti qayer?&#10;A) Buxoro B) Toshkent C) Samarqand D) Xiva&#10;&#10;2. ...&#10;&#10;Kalitlar:&#10;1-B, 2-C" className="flex-1 w-full px-6 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-3xl outline-none focus:border-[#004B49] focus:bg-white text-lg resize-none leading-relaxed" />
                                        </div>
                                    ) : (
                                        <div className="space-y-8 pb-10">
                                            <h3 className="text-2xl font-black text-zinc-900 mb-6">Savollar darchasi</h3>
                                            {manualQs.map((q, qIndex) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={q.id} className="bg-white border-2 border-zinc-100 p-8 rounded-[32px] shadow-sm relative group hover:border-[#004B49]/20 transition-all">
                                                    <button onClick={() => rmQ(q.id)} className="absolute top-6 right-6 p-2 text-red-400 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                                                    <div className="mb-6">
                                                        <label className="block text-sm font-black text-zinc-300 mb-3 uppercase">{qIndex + 1}-Savol</label>
                                                        <textarea value={q.question} onChange={e => upQ(q.id, 'question', e.target.value)} placeholder="Savolni kiriting..." className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl outline-none focus:bg-white text-xl font-bold" rows={2} />
                                                    </div>

                                                    {/* Media Upload */}
                                                    {uploadingQId === q.id ? (
                                                        <div className="mb-6 flex flex-col items-center justify-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-200">
                                                            <div className="relative w-12 h-12 mb-3">
                                                                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                                                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                                                            </div>
                                                            <p className="text-sm font-bold text-blue-600">Yuklanmoqda...</p>
                                                            <p className="text-xs text-blue-400 font-medium mt-1">Iltimos kuting</p>
                                                        </div>
                                                    ) : q.mediaUrl ? (
                                                        <div className="mb-6 relative group/media">
                                                            {q.mediaType === 'image' ? (
                                                                <div className="rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 flex justify-center">
                                                                    <img src={q.mediaUrl} alt="Media" className="max-h-[200px] object-contain" />
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3">
                                                                    <Music className="w-5 h-5 text-purple-500" />
                                                                    <audio src={q.mediaUrl} controls className="flex-1 h-10" />
                                                                </div>
                                                            )}
                                                            <button onClick={() => upQMulti(q.id, { mediaUrl: '', mediaType: '' })} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/media:opacity-100 transition-opacity">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-3 mb-6">
                                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-100 transition-colors">
                                                                <ImagePlus className="w-4 h-4" /> Rasm
                                                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                                    const file = e.target.files?.[0]; if (!file) return;
                                                                    setUploadingQId(q.id);
                                                                    const path = `questions/${Date.now()}_${file.name}`;
                                                                    const { error } = await supabase.storage.from('test_media').upload(path, file);
                                                                    if (error) { setUploadingQId(null); return alert('Yuklash xatosi: ' + error.message); }
                                                                    const { data: urlData } = supabase.storage.from('test_media').getPublicUrl(path);
                                                                    upQMulti(q.id, { mediaUrl: urlData.publicUrl, mediaType: 'image' });
                                                                    setUploadingQId(null);
                                                                }} />
                                                            </label>
                                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold cursor-pointer hover:bg-purple-100 transition-colors">
                                                                <Music className="w-4 h-4" /> Audio (MP3)
                                                                <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                                                                    const file = e.target.files?.[0]; if (!file) return;
                                                                    setUploadingQId(q.id);
                                                                    const path = `questions/${Date.now()}_${file.name}`;
                                                                    const { error } = await supabase.storage.from('test_media').upload(path, file);
                                                                    if (error) { setUploadingQId(null); return alert('Yuklash xatosi: ' + error.message); }
                                                                    const { data: urlData } = supabase.storage.from('test_media').getPublicUrl(path);
                                                                    upQMulti(q.id, { mediaUrl: urlData.publicUrl, mediaType: 'audio' });
                                                                    setUploadingQId(null);
                                                                }} />
                                                            </label>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {q.options.map((opt: any, oIndex: number) => {
                                                            const sel = q.correctAnswer === opt.label;
                                                            return (
                                                                <div key={opt.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer ${sel ? 'border-[#31C48D] bg-[#31C48D]/5' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}>
                                                                    <input type="radio" checked={sel} onChange={() => upQ(q.id, 'correctAnswer', opt.label)} className="w-5 h-5 text-[#31C48D] cursor-pointer" />
                                                                    <span className={`font-black text-lg ${sel ? 'text-[#31C48D]' : 'text-zinc-400'}`}>{opt.label})</span>
                                                                    <input type="text" value={opt.text} onChange={e => { const newOpts = [...q.options]; newOpts[oIndex].text = e.target.value; upQ(q.id, 'options', newOpts); }} className="flex-1 bg-transparent border-none outline-none font-semibold text-lg" placeholder="Variant matni" />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <button onClick={addQ} className="w-full py-5 border-2 border-dashed border-zinc-300 text-zinc-500 font-bold text-lg rounded-[32px] hover:border-[#004B49] hover:bg-[#004B49]/5 hover:text-[#004B49] flex items-center justify-center gap-2"><Plus className="w-6 h-6" /> Qushish</button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full md:w-[450px] overflow-y-auto p-8 custom-scrollbar">
                                    <h3 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-[#004B49]" /> Texnik Sozlamalar</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Majburiy Sarlavha</label>
                                            <input type="text" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="Matematika Testi" className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] font-bold text-zinc-900" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Ta'rif (Ixtiyoriy)</label>
                                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Test qoidalari..." className="w-full px-5 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] font-medium text-zinc-600 resize-none min-h-[100px]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Vaqt Chegarasi</label>
                                                <div className="relative">
                                                    <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Bo'sh bo'lsa cheksiz" className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] font-bold text-zinc-900" />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">daqiqa</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Boshlanish</label>
                                                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] font-medium text-sm text-zinc-700" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tugash V.</label>
                                                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] font-medium text-sm text-zinc-700" />
                                            </div>
                                        </div>
                                        <div className="pt-4 space-y-3">
                                            <Toggle checked={showResults} onChange={setShowResults} label="Natijalarni ko'rsatish" desc="Test yakunida to'g'ri/xato fosh etish" />
                                            <Toggle checked={interactiveMode} onChange={setInteractiveMode} label="Interaktiv rejim" desc="Savollarni bittadan ko'rsatish" />
                                        </div>
                                        <div className="pt-2 bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                                            <label className="block text-xs font-bold text-blue-600 mb-2 uppercase flex items-center gap-1">✈️ Telegram Bildirishnoma (Chat ID)</label>
                                            <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Misol uchun: -100123... (ixtiyoriy)" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 font-medium text-zinc-900 text-sm" />
                                            <p className="text-[11px] text-blue-500/80 mt-2 font-medium leading-relaxed">Agar ushbu test natijalari yakunlanganda telegram kanal yoki botingizga bormoqchi bo'lsa, chat id ni yozing!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-5 border-t border-zinc-100 bg-white/50 backdrop-blur-md flex justify-end shrink-0 z-20">
                                <button onClick={handleSave} disabled={parsing} className="px-10 py-4 w-full sm:w-auto rounded-2xl bg-[#004B49] text-white font-black text-xl hover:bg-[#003B39] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl hover:-translate-y-1">
                                    {parsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Saqlash va Tasdiqlash <CheckCircle2 className="w-6 h-6" /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Test Deletion Modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return
                    setIsDeleting(true)
                    const { error } = await supabase.from('tests').delete().eq('id', deleteTarget.id)
                    if (!error) {
                        setDeleteTarget(null)
                        fetchFolderData()
                    } else {
                        alert("Xatolik: " + error.message)
                    }
                    setIsDeleting(false)
                }}
                isLoading={isDeleting}
                title="Testni O'chirish!"
                message={`Haqiqatan ham "${deleteTarget?.title}" nomli ushbu testni o'chirasizmi? Uning ichidagi BARCHA bog'langan natijalar, savollar o'chib ketadi!`}
                confirmText="Ha, o'chib ketsin"
            />

            {/* Telegram Quiz Modal */}
            <AnimatePresence>
                {quizTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if (!sendingQuiz) { setQuizTarget(null); setQuizSuccess(null); } }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[24px] w-full max-w-lg relative z-10 shadow-2xl flex flex-col overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-blue-500" /> Telegramga Haqiqiy Viktorina
                                </h2>
                                <button onClick={() => { if (!sendingQuiz) { setQuizTarget(null); setQuizSuccess(null); } }} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            {quizSuccess ? (
                                <div className="p-10 flex flex-col items-center justify-center text-center">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    </motion.div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">Muvaffaqiyatli jo'natildi!</h3>
                                    <p className="text-slate-500 font-medium mb-8 text-[15px]">
                                        {quizSuccess.count} ta savol kanalingizga quiz shaklida yetkazildi.
                                    </p>

                                    {quizSuccess.skipped > 0 && (
                                        <div className="bg-amber-50 rounded-2xl p-5 mb-8 border border-amber-100 flex items-start text-left gap-4 w-full">
                                            <AlertCircle className="w-7 h-7 text-amber-500 shrink-0" />
                                            <div>
                                                <h4 className="text-[15px] font-bold text-amber-800 mb-1">Diqqat</h4>
                                                <p className="text-sm font-medium text-amber-600 leading-relaxed">{quizSuccess.skipped} ta savol variantlarda xato yoki to'g'ri javob belgilanmagani sababli o'tkazib yuborildi.</p>
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={() => { setQuizSuccess(null); setQuizTarget(null); }} className="px-8 py-3.5 bg-slate-900 text-white rounded-[14px] font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto hover:-translate-y-0.5 duration-200">
                                        Ajoyib, yopish
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 overflow-y-auto">
                                        <div className="bg-[#F0F7FF] rounded-[16px] p-5 mb-6 border border-blue-100">
                                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-[15px]">
                                                <Info className="w-5 h-5 text-blue-500" /> Botingizni qanday ulanadi?
                                            </h4>
                                            <ol className="list-decimal list-outside ml-4 space-y-2.5 text-[14px] text-blue-900/80 font-medium leading-relaxed">
                                                <li>Telegramdan <b className="text-blue-700">@BotFather</b> ni qidiring, <b>/newbot</b> buyrug'ini yozib yangi botingizga nom bering.</li>
                                                <li>Bot senga <b>Token</b> raqamini jo'natadi (Masalan: <i>123...:AAF...</i>). Uni nusxalab oling va pastdagi birinchi qatorga joylang.</li>
                                                <li>Yangi ochilgan botni test tashlanadigan guruhingiz yoki kanalingizga <b className="text-blue-700">Admin</b> qilib qo'shing.</li>
                                                <li>O'sha kanal/guruhning manzilini (Masalan: <b>@kanalim</b>) pastdagi ikkinchi qatorga yozing. Bo'ldi! 🎉</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[15px] font-semibold text-slate-700 mb-2">Bot Tokeni (BotFather olingan)</label>
                                                <input type="text" value={tgBotToken} onChange={e => setTgBotToken(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 transition-all shadow-sm" placeholder="8575858589:AA..." />
                                            </div>
                                            <div>
                                                <label className="block text-[15px] font-semibold text-slate-700 mb-2">Kanal yoki Guruh manzili / ID si</label>
                                                <input type="text" value={tgChatId} onChange={e => setTgChatId(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 transition-all shadow-sm" placeholder="@testlar_kanalim" />
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Sozlamalarni yashirish</button>
                                            </div>
                                        </div>

                                        {sendingQuiz && (
                                            <div className="mt-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                                                <p className="text-blue-700 font-bold text-lg">{sentQuizCount} / {quizTarget.questions?.length || 0}</p>
                                                <p className="text-blue-500/80 text-sm font-medium mt-1">Savollar telegramga yuborilmoqda...</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3 rounded-b-[24px]">
                                        <button onClick={() => setQuizTarget(null)} disabled={sendingQuiz} className="px-6 py-2.5 rounded-[12px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 hover:shadow-sm">Bekor qilish</button>
                                        <button onClick={async () => {
                                            if (!tgBotToken || !tgChatId) return alert("Iltimos, Token va Kanal manzilini kiriting.");
                                            if (!quizTarget.questions || quizTarget.questions.length === 0) return alert("Ushbu testda hecham savollar yo'q.");

                                            localStorage.setItem('tg_bot_token', tgBotToken.trim());
                                            localStorage.setItem('tg_chat_id', tgChatId.trim());

                                            setSendingQuiz(true);
                                            setSentQuizCount(0);
                                            let s = 0;
                                            let skipped = 0;

                                            for (let i = 0; i < quizTarget.questions.length; i++) {
                                                const q = quizTarget.questions[i];
                                                // 1. Matni bor varianlarni ajratib olib 100 belgiga qisqartirish (Telegram limit)
                                                const validOpts = q.options.filter((o: any) => o.text && String(o.text).trim() !== "");
                                                const optionsListText = validOpts.map((o: any) => String(o.text).substring(0, 100));

                                                // 2. Telegram poll kamida 2 ta variant talab qiladi
                                                if (optionsListText.length < 2) {
                                                    skipped++;
                                                    continue;
                                                }

                                                // 3. To'g'ri javobni (A, B) bo'sh joylarsiz, katta harfda solishtirish
                                                const correctAns = String(q.correctAnswer || '').trim().toUpperCase();
                                                const correctIdx = validOpts.findIndex((o: any) => String(o.label || '').trim().toUpperCase() === correctAns);

                                                // Telegram quiz xatolik bermasligi uchun aniq bitta to'g'ri javob kerak
                                                if (correctIdx === -1) {
                                                    skipped++;
                                                    continue;
                                                }

                                                // 4. Savol matnini maksimal 300 belgiga qisqartirish
                                                let qText = `${i + 1}. ${String(q.question || "Savol").trim()}`.substring(0, 300);

                                                // Tarmoqdagi uzilishlar uchun 3 martagacha qayta urinib ko'rish mexanizmi
                                                let success = false;
                                                for (let attempt = 1; attempt <= 3; attempt++) {
                                                    try {
                                                        const res = await fetch(`https://api.telegram.org/bot${tgBotToken.trim()}/sendPoll`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                chat_id: tgChatId.trim(),
                                                                question: qText,
                                                                options: optionsListText,
                                                                type: "quiz",
                                                                correct_option_id: correctIdx,
                                                                is_anonymous: true
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            success = true;
                                                            s++;
                                                            setSentQuizCount(s);
                                                            break; // Muvaffaqiyatli jo'natildi
                                                        } else {
                                                            const errText = await res.text();
                                                            console.error(`Telegram Error Q${i + 1} (Attempt ${attempt}):`, errText);
                                                            if (res.status === 429) {
                                                                await new Promise(r => setTimeout(r, 8000)); // Limitga tushsa 8s kutish
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.error(`Network Error Q${i + 1} (Attempt ${attempt}):`, e);
                                                    }
                                                    // Xato bo'lsa qayta urinishdan oldin biroz kutish
                                                    if (!success) await new Promise(r => setTimeout(r, 2000));
                                                }

                                                if (!success) skipped++;

                                                // Telegram Group Limit: Max 20 msgs per minute.
                                                // 60 seconds / 20 messages = 3 seconds tanaffus qat'iy talab etiladi!
                                                await new Promise(r => setTimeout(r, 3200));
                                            }
                                            setSendingQuiz(false);

                                            setQuizSuccess({ count: s, skipped });
                                        }} disabled={sendingQuiz || !tgBotToken || !tgChatId} className="px-8 py-2.5 rounded-[12px] bg-[#3B82F6] text-white font-bold hover:bg-[#2563EB] shadow-md shadow-[#3B82F6]/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                                            {sendingQuiz ? 'Yuborilmoqda...' : 'Yuborish'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden Print Wrapper */}
            <div style={{ display: 'none' }}>
                <PrintTest ref={printRef} tests={printingTests} folderName={folder.name} />
            </div>
        </motion.div>
    )
}
