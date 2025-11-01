import "../css/HeaderTemplate.css"
import Logo from './Logo'
import Card from './Card'
import { Outlet } from "react-router-dom"
import HeaderButton from './HeaderButton'
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

    return (
        <div className="header-layout">
            <div className="header">
                <Card width={"100%"} height={"100%"}>
                    <div className="header-content">
                        <Logo />
                        <div className="header-button-container">
                            {user ? (
                                <>
                                    <div className="username">{user.username}</div>
                                    <HeaderButton onClick={handle_logout}>Logout</HeaderButton>
                                </>
                            ) : (
                                <div className="header-button-container">
                                    <HeaderButton background={true} to={"/register"}>Sign Up</HeaderButton>
                                    <HeaderButton to={"/login"}>Login</HeaderButton>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="content">
                <Outlet/>
            </div>

        </div>
    )
}