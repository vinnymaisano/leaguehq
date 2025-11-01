import { useAuth } from "../contexts/AuthContext"
import { Navigate } from "react-router-dom"
import Spinner from "./Spinner"

export default function ProtectedRoute({children}) {
    const {user, loadingAuth} = useAuth()
    
    if (loadingAuth) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{from: location.pathname}} replace />
    }

    return children
}