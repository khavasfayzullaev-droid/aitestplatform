import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function ProtectedRoute() {
    const [session, setSession] = useState<Session | null | undefined>(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (session === undefined) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F7F6]">
                <div className="w-8 h-8 border-4 border-[#004B49]/20 border-t-[#004B49] rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
