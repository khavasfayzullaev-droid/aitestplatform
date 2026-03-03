import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderOpen, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DashboardLayout() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navItems = [
        { name: 'Asosiy', path: '/dashboard', icon: <LayoutGrid className="w-5 h-5" /> },
        { name: 'Papkalar va Testlar', path: '/dashboard/folders', icon: <FolderOpen className="w-5 h-5" /> },
    ]

    return (
        <div className="flex h-screen bg-[#FBFBFA] font-sans">
            {/* Sidebar */}
            <aside className="w-[280px] bg-white border-r border-zinc-100 flex flex-col items-start py-8">
                <div className="px-8 mb-10 w-full">
                    <div className="text-3xl font-black tracking-tighter text-zinc-900">
                        AI Test<span className="text-[#31C48D]">.</span>
                    </div>
                </div>

                <nav className="flex-1 w-full px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${isActive
                                    ? 'bg-[#004B49] text-white shadow-lg shadow-[#004B49]/20'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                }`
                            }
                        >
                            {item.icon}
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 w-full mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Tizimdan chiqish
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto p-10 pt-16">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
