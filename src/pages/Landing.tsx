import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Settings, Wand2, Lock, ShieldCheck, PieChart, ChevronRight, Sparkles } from 'lucide-react'

const features = [
    {
        icon: <Settings className="w-6 h-6 text-[#31C48D]" />,
        title: "1. Ortiqcha ovvoragarchiliksiz boshqaruv",
        desc: "Sizdan faqat testlarni tizimga yuklash talab etiladi. Qolgan barcha murakkab jarayonlarni — tahlil qilish va tizimni sozlashni — bizning aqlli mexanizmimiz o'z zimmasiga oladi. Siz vaqtingizni faqat ta'limga sarflaysiz."
    },
    {
        icon: <Wand2 className="w-6 h-6 text-[#004B49]" />,
        title: "2. \"Sehrli\" nusxa ko'chirish (Parser)",
        desc: "Testlarni birma-bir kiritib o'tirish shart emas. Shunchaki Telegram yoki Word’dagi tayyor test matnini nusxalab tashlang — tizim soniyalar ichida savol va variantlarni o'zi ajratib, joy-joyiga qo'yib beradi. Hech qanday qo'shimcha sozlamalarsiz!"
    },
    {
        icon: <Lock className="w-6 h-6 text-[#31C48D]" />,
        title: "3. Shaxsiy va xavfsiz hudud",
        desc: "Har bir ustoz uchun alohida, begonalardan himoyalangan platforma ajratiladi. Sizning testlaringiz, o'quvchilaringiz bazasi va barcha ma'lumotlaringiz faqat o'zingizga tegishli va to'liq xavfsiz bo'ladi."
    },
    {
        icon: <ShieldCheck className="w-6 h-6 text-[#004B49]" />,
        title: "4. Shaffoflik va nazorat (Anti-Cheat)",
        desc: "O'quvchilar javoblarni ko'rib qolishi yoki tizimni aldashi haqida qayg'urmang. Javoblar kodi puxta yashirilgan, ayni ism bilan qayta-qayta kirish taqiqlangan. Hammasi adolatli va ishonchli."
    },
    {
        icon: <PieChart className="w-6 h-6 text-[#31C48D]" />,
        title: "5. Tayyor tahlil va natijalar",
        desc: "O'quvchilarning natijalarini hisoblab o'tirmaysiz. Kuchli o'quvchilar reytingi, eng ko'p xato qilingan savollar ro'yxati va umumiy hisobotlar tayyor holda shakllanadi. Kerak bo'lsa, barchasini PDF shaklida yuklab olishingiz mumkin."
    },
    {
        icon: <Sparkles className="w-6 h-6 text-[#004B49]" />,
        title: "6. AI Test Avtogeneratsiyasi",
        desc: "Vaqtingiz mutlaqo yo'qmi? Shunchaki mavzuni yozing yoki kitob va matnlarni tizimga yuklang. Bizning sun'iylashtirilgan aqlli modul materialni mustaqil tahlil qilib, sifatli test savollarini avtomatik tuzib taqdim etadi."
    }
]

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#FBFBFA] selection:bg-[#004B49] selection:text-white font-sans overflow-x-hidden">

            {/* Navbar Minimalist */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFA]/80 backdrop-blur-xl border-b border-black/[0.04]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-xl font-black tracking-tighter text-zinc-900">
                        AI Test<span className="text-[#004B49]"> Platform</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                            Kirish
                        </Link>
                        <Link to="/register" className="text-sm px-4 py-2 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-800 transition-all">
                            Ro'yxatdan o'tish
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                {/* Ambient gradient */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-[#004B49]/10 to-[#31C48D]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 leading-[1.1] mb-6">
                            Testlaringizni qo'lda yozib <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#004B49] to-[#31C48D]">vaqt ketkazmang</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <p className="text-lg md:text-2xl text-zinc-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                            O'quvchilaringiz natijalarini bizning platformada oson kuzatib boring.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/register" className="h-14 px-8 inline-flex items-center justify-center gap-2 bg-[#004B49] text-white rounded-full font-bold text-lg hover:bg-[#003B39] hover:scale-[1.02] transition-all shadow-xl shadow-[#004B49]/20">
                            Boshlash
                        </Link>
                        <a href="#features" className="h-14 px-8 inline-flex items-center justify-center gap-2 bg-white text-zinc-900 rounded-full font-bold text-lg border border-zinc-200 hover:bg-zinc-50 transition-all group">
                            Batafsil <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="pt-24 pb-32 bg-white relative z-10 border-t border-zinc-100">
                <div className="max-w-7xl mx-auto px-6">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 mb-6">
                            O'qituvchilar uchun aqlli test platformasi
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-[#FBFBFA] p-8 md:p-10 rounded-[32px] border border-zinc-100/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all flex flex-col items-start"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/[0.03] mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-900 mb-3">{feature.title}</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed text-[17px]">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </section>

        </div>
    )
}
