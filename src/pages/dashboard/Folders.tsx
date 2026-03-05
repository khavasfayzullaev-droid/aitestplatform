import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderPlus, Folder, X, Loader2, Trash2, Edit2, HelpCircle, CheckCircle2, ChevronRight, FileText, Link2, Printer, Send, ImagePlus, Music } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'

export default function Folders() {
    const navigate = useNavigate()
    const [folders, setFolders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [creating, setCreating] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [editTarget, setEditTarget] = useState<{ id: string, name: string } | null>(null)
    const [editFolderName, setEditFolderName] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [isGuideOpen, setIsGuideOpen] = useState(false)

    const fetchFolders = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setFolders(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchFolders()
    }, [])

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFolderName.trim()) return
        setCreating(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('folders')
            .insert([{ name: newFolderName, user_id: user.id }])

        if (!error) {
            setNewFolderName('')
            setIsModalOpen(false)
            fetchFolders()
        } else {
            alert("Xatolik: " + error.message)
        }
        setCreating(false)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        const { error } = await supabase.from('folders').delete().eq('id', deleteTarget.id)
        if (!error) {
            setDeleteTarget(null)
            fetchFolders()
        } else {
            alert("Xatolik: O'chirish ruxsati yo'q yeki baza bilan muammo: " + error.message)
        }
        setIsDeleting(false)
    }

    const handleDeleteFolder = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation()
        setDeleteTarget({ id, name })
    }

    const handleEditFolderSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editTarget || !editFolderName.trim()) return
        setIsEditing(true)

        const { error } = await supabase
            .from('folders')
            .update({ name: editFolderName })
            .eq('id', editTarget.id)

        if (!error) {
            setEditTarget(null)
            fetchFolders()
        } else {
            alert("Xatolik: Nomini o'zgartirish muvaffaqiyatsiz bo'ldi: " + error.message)
        }
        setIsEditing(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full relative">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Papkalar va Testlar 📁</h1>
                    <p className="text-zinc-500 font-medium mt-2 text-lg">Barcha materiallarni tartibli o'z saflariga ajrating</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsGuideOpen(true)} className="px-5 py-3.5 bg-amber-50 text-amber-700 flex gap-2 items-center rounded-2xl font-bold hover:bg-amber-100 transition-colors border border-amber-200">
                        <HelpCircle className="w-5 h-5" /> Qo'llanma
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3.5 bg-[#004B49] text-white flex items-center gap-2 rounded-2xl font-bold shadow-xl shadow-[#004B49]/20 hover:bg-[#003B39] transition-all hover:-translate-y-0.5"
                    >
                        <FolderPlus className="w-5 h-5" />
                        Yangi Papka
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="w-full h-[50vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#004B49]" />
                </div>
            ) : folders.length === 0 ? (
                <div className="w-full h-[50vh] bg-white rounded-[40px] border border-zinc-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)] flex items-center justify-center flex-col p-10 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6">
                        <span className="text-4xl">📂</span>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">Papkalar hozircha bo'sh</h3>
                    <p className="text-zinc-500 font-medium max-w-sm">Tepadagi "Yangi Papka" tugmasini bosib, birinchi darsligingizni quring.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {folders.map(folder => (
                        <motion.div
                            whileHover={{ y: -4 }}
                            key={folder.id}
                            onClick={() => navigate(`/dashboard/folders/${folder.id}`)}
                            className="bg-white p-6 rounded-3xl border border-zinc-100 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#004B49]/5 transition-all group relative"
                        >
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditTarget({ id: folder.id, name: folder.name });
                                        setEditFolderName(folder.name);
                                    }}
                                    className="p-2 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Papkani tahrirlash"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                                    className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Papkani o'chirish"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="w-14 h-14 bg-[#F4F7F6] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#004B49] transition-colors duration-300">
                                <Folder className="w-7 h-7 text-[#004B49] group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 truncate" title={folder.name}>{folder.name}</h3>
                            <p className="text-xs text-zinc-400 font-medium mt-1">Yaratildi: {new Date(folder.created_at).toLocaleDateString()}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Folder Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-zinc-900">Yangi papka</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateFolder}>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Papka nomi</label>
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Masalan: Ona tili 10-sinf"
                                        autoFocus
                                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-[#004B49] focus:ring-4 focus:ring-[#004B49]/10 transition-all font-medium text-lg"
                                    />
                                </div>

                                <button
                                    disabled={creating || !newFolderName.trim()}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-[#004B49] text-white font-bold text-lg hover:bg-[#003B39] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yaratish"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rename Folder Modal */}
            <AnimatePresence>
                {editTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setEditTarget(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-zinc-900">Papkani tahrirlash</h2>
                                <button onClick={() => setEditTarget(null)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditFolderSave}>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Yangi nom</label>
                                    <input
                                        type="text"
                                        value={editFolderName}
                                        onChange={(e) => setEditFolderName(e.target.value)}
                                        autoFocus
                                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-lg"
                                    />
                                </div>

                                <button
                                    disabled={isEditing || !editFolderName.trim()}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saqlash"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Papkani o'chirish!"
                message={`Haqiqatan ham "${deleteTarget?.name}" papkasini va uning ichidagi BARCHA testlarni o'chirib yubormoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi!`}
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
                                    Platformadan Foydalanish
                                </h2>
                                <button onClick={() => setIsGuideOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* 1-qadam */}
                                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 rounded-2xl border border-teal-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                                        <h3 className="font-black text-teal-900 text-lg">Papka yarating</h3>
                                    </div>
                                    <p className="text-teal-700/70 font-medium leading-relaxed pl-11">
                                        <strong>"Yangi Papka"</strong> tugmasini bosing va papka nomini kiriting (masalan: "Ona tili 10-sinf" yoki "Ingliz tili"). Papkalar testlaringizni tartiblash uchun ishlatiladi.
                                    </p>
                                </div>

                                {/* 2-qadam */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                                        <h3 className="font-black text-indigo-900 text-lg">Papkaga kiring va test yarating</h3>
                                    </div>
                                    <p className="text-indigo-700/70 font-medium leading-relaxed pl-11 mb-3">
                                        Papkani bosing va ichida <strong>"Yangi Test"</strong> tugmasini bosing. Test yaratishning 2 ta usuli bor:
                                    </p>
                                    <div className="pl-11 space-y-3">
                                        <div className="bg-white p-4 rounded-xl border border-indigo-100">
                                            <p className="font-bold text-indigo-800 mb-1">🪄 Avtomatik rejim</p>
                                            <p className="text-indigo-600/70 text-sm font-medium">Savollar matnini to'liq yopishtirasiz — tizim avtomatik savollar va javoblarni ajratib beradi. Eng tez usul!</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-indigo-100">
                                            <p className="font-bold text-indigo-800 mb-1">✍️ Qo'lda rejim</p>
                                            <p className="text-indigo-600/70 text-sm font-medium">Har bir savolni alohida kiriting, variantlarni yozing va to'g'ri javobni belgilang.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3-qadam */}
                                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                                        <h3 className="font-black text-blue-900 text-lg">Rasm va audio qo'shing</h3>
                                    </div>
                                    <p className="text-blue-700/70 font-medium leading-relaxed pl-11 mb-3">
                                        Qo'lda rejimda har bir savolga qo'shimcha material biriktira olasiz:
                                    </p>
                                    <div className="pl-11 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <ImagePlus className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-blue-800">Rasm</span>
                                            <ChevronRight className="w-3 h-3 text-blue-300" />
                                            <span className="text-blue-600">Savolga tegishli rasm yuklang</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Music className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-blue-800">Audio</span>
                                            <ChevronRight className="w-3 h-3 text-blue-300" />
                                            <span className="text-blue-600">Tinglash uchun MP3 fayl yuklang</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4-qadam */}
                                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 rounded-2xl border border-violet-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                                        <h3 className="font-black text-violet-900 text-lg">Sozlamalarni belgilang</h3>
                                    </div>
                                    <p className="text-violet-700/70 font-medium leading-relaxed pl-11 mb-3">
                                        Test yaratishda o'ng tomondagi sozlamalar panelida quyidagilarni sozlashingiz mumkin:
                                    </p>
                                    <div className="pl-11 space-y-1.5">
                                        <p className="text-violet-600 text-sm font-medium">⏱ <strong>Vaqt chegarasi</strong> — daqiqada (bo'sh bo'lsa cheksiz)</p>
                                        <p className="text-violet-600 text-sm font-medium">📅 <strong>Boshlanish va tugash vaqti</strong> — test qachon ochilishi</p>
                                        <p className="text-violet-600 text-sm font-medium">📊 <strong>Natijalarni ko'rsatish</strong> — o'quvchiga to'g'ri/xato ko'rsatish</p>
                                        <p className="text-violet-600 text-sm font-medium">🔄 <strong>Interaktiv rejim</strong> — savollarni bittadan ko'rsatish</p>
                                    </div>
                                </div>

                                {/* 5-qadam */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-sm">5</div>
                                        <h3 className="font-black text-emerald-900 text-lg">O'quvchilarga havola yuboring</h3>
                                    </div>
                                    <p className="text-emerald-700/70 font-medium leading-relaxed pl-11">
                                        Test yaratilgach, kartochkada <strong>"Havolani nusxalash"</strong> tugmasi paydo bo'ladi. Uni bosing va havolani o'quvchilarga messenja orqali yuboring. O'quvchi havolani ochib, ism-familiyasini kiritib test topshiradi.
                                    </p>
                                </div>

                                {/* 6-qadam */}
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-sm">6</div>
                                        <h3 className="font-black text-amber-900 text-lg">Natijalarni ko'ring</h3>
                                    </div>
                                    <p className="text-amber-700/70 font-medium leading-relaxed pl-11">
                                        Har bir test kartochkasida <strong>"Natijalar"</strong> tugmasi bor. Uni bosib o'quvchilarning ballari, to'g'ri/xato javoblari va topshirish vaqtlarini ko'rasiz.
                                    </p>
                                </div>

                                {/* Qo'shimcha imkoniyatlar */}
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                                    <h4 className="font-black text-zinc-700 text-sm uppercase mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-zinc-500" /> Qo'shimcha Imkoniyatlar
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center gap-3">
                                            <Printer className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-700 text-sm">Chop etish</p>
                                                <p className="text-zinc-400 text-xs font-medium">Testni qog'ozda chiqarish</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center gap-3">
                                            <Send className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-700 text-sm">Telegramga yuborish</p>
                                                <p className="text-zinc-400 text-xs font-medium">Viktorina sifatida kanalga</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-700 text-sm">Tahrirlash</p>
                                                <p className="text-zinc-400 text-xs font-medium">Test savollarini o'zgartirish</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center gap-3">
                                            <Link2 className="w-5 h-5 text-zinc-400" />
                                            <div>
                                                <p className="font-bold text-zinc-700 text-sm">Havola</p>
                                                <p className="text-zinc-400 text-xs font-medium">Har bir test uchun alohida</p>
                                            </div>
                                        </div>
                                    </div>
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
