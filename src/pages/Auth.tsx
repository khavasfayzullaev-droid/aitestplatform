import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const isLogin = location.pathname === '/login'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                navigate('/dashboard')
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                })
                if (error) throw error

                // Ensure user is created in public.users (handled by trigger ideally or insert manually)
                if (data.user) {
                    await supabase.from('users').upsert({
                        id: data.user.id,
                        full_name: fullName,
                        email: email
                    })
                    navigate('/dashboard')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#F4F7F6]">
            {/* Premium Glassmorphism Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#31C48D]/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#004B49]/10 blur-[150px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] rounded-[32px] p-8 md:p-10">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#004B49] text-white shadow-lg mb-4">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">
                            {isLogin ? "Tizimga kirish" : "Ro'yxatdan o'tish"}
                        </h2>
                        <p className="text-[15px] font-medium text-zinc-500">
                            {isLogin ? "Ustozlar paneliga xush kelibsiz" : "Yangi ustoz hisobini yarating"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1.5 ml-1">FIshingiz</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-white/50 border border-zinc-200 focus:bg-white focus:border-[#004B49]/40 focus:ring-4 focus:ring-[#004B49]/10 outline-none transition-all placeholder:text-zinc-400 font-medium text-[15px]"
                                    placeholder="Ism va familiya"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-1.5 ml-1">Email manzil</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full h-12 px-4 rounded-xl bg-white/50 border border-zinc-200 focus:bg-white focus:border-[#004B49]/40 focus:ring-4 focus:ring-[#004B49]/10 outline-none transition-all placeholder:text-zinc-400 font-medium text-[15px]"
                                placeholder="ustoz@gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-1.5 ml-1">Parol</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full h-12 px-4 rounded-xl bg-white/50 border border-zinc-200 focus:bg-white focus:border-[#004B49]/40 focus:ring-4 focus:ring-[#004B49]/10 outline-none transition-all placeholder:text-zinc-400 font-medium text-[15px]"
                                placeholder="Kamida 6 ta belgi"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-[#004B49] text-white font-bold tracking-wide shadow-md hover:bg-[#003B39] hover:shadow-lg transition-all disabled:opacity-50 mt-2"
                        >
                            {loading ? "Yuklanmoqda..." : isLogin ? "KIRISH" : "YARATISH"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-zinc-500 font-medium text-[15px]">
                            {isLogin ? "Hisobingiz yo'qmi?" : "Akkountingiz bormi?"} <br />
                            <Link
                                to={isLogin ? '/register' : '/login'}
                                className="text-[#004B49] hover:underline hover:text-[#003B39] font-bold"
                            >
                                {isLogin ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
                            </Link>
                        </p>
                    </div>

                </div>
            </motion.div>
        </div>
    )
}
