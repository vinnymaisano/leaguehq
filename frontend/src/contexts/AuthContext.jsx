import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loadingInitial, setLoadingInitial] = useState(true)
    const [loadingOperation, setLoadingOperation] = useState(false)

    const loadingAuth = loadingInitial || loadingOperation
    const isVerified = user?.is_verified

    // get current authenticated user
    async function refresh_user() {
        setLoadingInitial(true)
        try {
            const res = await axios.get("/auth/status", {
                withCredentials: true
            })
            setUser(res.data.user)
        } catch {
            setUser(null)
        } finally {
            setLoadingInitial(false)
        }
    }

    // refresh user on mount
    useEffect(() => {
        refresh_user()
    }, [])

    // login function
    async function login(formData) {
        try {
            setLoadingOperation(true)
            const res = await axios.post("/auth/login", formData, {
                withCredentials: true
            })
            console.log("response:", res.data)
            setUser(res.data.user)
            return { success: true }
        } catch (err) {
            const error = err.response?.data?.error || "An unexpected error occurred."
            return { success: false, error }
        } finally {
            setLoadingOperation(false)
        }
    }

    // register function
    async function register(formData) {
        try {
            setLoadingOperation(true)
            const res = await axios.post("/auth/register", formData, {
                withCredentials: true
            })
            setUser(res.data.user)
            return {success: true}
        } catch (err) {
            const error = err.response?.data?.error || "An unexpected error occurred."
            return {success: false, error}
        } finally {
            setLoadingOperation(false)
        }
    }

    async function logout() {
        try {
            setLoadingOperation(true)
            await axios.get("/auth/logout", {
                withCredentials: true
            })
            setUser(null)
        } catch (err) {
            console.error("Logout error:", err)
        } finally {
            setLoadingOperation(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, register, login, logout, loadingAuth, isVerified, refresh_user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
