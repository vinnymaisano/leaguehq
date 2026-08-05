import "../css/HeaderTemplate.css"
import Logo from './Logo'
import { Outlet } from "react-router-dom"
import HeaderButton from './HeaderButton'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from "react-router-dom"

export default function HeaderTemplate() {
    const navigate = useNavigate()
    const {user, logout} = useAuth()
    async function handle_logout() {
        try {
            await logout()
            navigate("/")
        } catch (err) {
            console.error("Logout failed: ", err)
        }
    }

    // Uses the same .topbar shell as the league pages (Layout.jsx) for a consistent UI.
    return (
        <div className="header-layout">
            <div className="topbar">
                <Logo />
                <div className="topbar-content">
                    <div className="topbar-title"></div>
                    <div className="topbar-user">
                        <ThemeToggle />
                        {user ? (
                            <>
                                <span className="info-bold">{user.username}</span>
                                <HeaderButton onClick={handle_logout}>Logout</HeaderButton>
                            </>
                        ) : (
                            <>
                                <HeaderButton background={true} to={"/register"}>Sign Up</HeaderButton>
                                <HeaderButton to={"/login"}>Login</HeaderButton>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="content">
                <Outlet/>
            </div>

        </div>
    )
}