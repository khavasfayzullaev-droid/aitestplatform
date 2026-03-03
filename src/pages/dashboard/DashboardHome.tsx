import { motion } from 'framer-motion'
import { FileText, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
    const stats = [
        { title: "Jami Testlar", value: "0", icon: <FileText className="w-7 h-7 text-[#004B49]" /> },
        { title: "Faol O'quvchilar", value: "0", icon: <Users className="w-7 h-7 text-[#31C48D]" /> },
        { title: "O'rtacha Natija", value: "0%", icon: <TrendingUp className="w-7 h-7 text-blue-500" /> }
    ]

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Xush kelibsiz! 👋</h1>
                <p className="text-zinc-500 font-medium mt-2 text-lg">Platformadagi bugungi ko'rsatkichlaringiz oyna qilib qo'yildi.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-6 hover:-translate-y-1 transition-transform">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-zinc-500 font-medium mb-1">{stat.title}</p>
                            <h3 className="text-4xl font-black text-zinc-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State Action */}
            <div className="mt-12 bg-white p-12 rounded-[40px] border border-zinc-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)] text-center">
                <div className="w-24 h-24 bg-[#004B49]/5 rounded-full mx-auto flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-[#004B49]" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-3">Hali hech qanday test qo'shilmagan.</h2>
                <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8 text-lg">
                    Ishni boshlash uchun papka yarating va testlaringizni joylang. Qolgan barcha ishni aqlli tizimimiz soniyalarda bajaradi.
                </p>
                <Link to="/dashboard/folders" className="px-8 py-4 bg-[#004B49] text-white rounded-2xl font-bold text-lg hover:bg-[#003B39] transition-all shadow-xl shadow-[#004B49]/20">
                    Papkalar bo'limiga o'tish
                </Link>
            </div>
        </motion.div>
    )
}
