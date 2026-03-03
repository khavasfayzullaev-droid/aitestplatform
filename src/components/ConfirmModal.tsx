import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xaa, o'chirilsin",
    cancelText = "Bekor qilish",
    isLoading = false
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
                        onClick={isLoading ? undefined : onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-[400px] relative z-10 shadow-2xl flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center text-red-500 mb-6">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 mb-2">{title}</h2>
                        <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
                            {message}
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                disabled={isLoading}
                                onClick={onClose}
                                className="flex-1 py-4 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 font-bold rounded-2xl transition-colors outline-none"
                            >
                                {cancelText}
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={onConfirm}
                                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50 outline-none"
                            >
                                {isLoading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
