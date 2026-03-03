import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderPlus, Folder, X, Loader2, Trash2 } from 'lucide-react'
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

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full relative">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Papkalar va Testlar 📁</h1>
                    <p className="text-zinc-500 font-medium mt-2 text-lg">Barcha materiallarni tartibli o'z saflariga ajrating</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3.5 bg-[#004B49] text-white flex items-center gap-2 rounded-2xl font-bold shadow-xl shadow-[#004B49]/20 hover:bg-[#003B39] transition-all hover:-translate-y-0.5"
                >
                    <FolderPlus className="w-5 h-5" />
                    Yangi Papka
                </button>
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
                            <button
                                onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                                className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10"
                                title="Papkani o'chirish"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
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

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Papkani o'chirish!"
                message={`Haqiqatan ham "${deleteTarget?.name}" papkasini va uning ichidagi BARCHA testlarni o'chirib yubormoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi!`}
            />
        </motion.div>
    )
}
