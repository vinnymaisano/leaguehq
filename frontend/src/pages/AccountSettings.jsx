import HeaderButton from "../components/HeaderButton"
import Card from "../components/Card"
import {useAuth} from "../contexts/AuthContext"
import { useState, useEffect } from "react"
import "../css/AccountPage.css"
import axios from "axios"
import Spinner from "../components/Spinner"
import { useNavigate } from "react-router-dom"

export default function AccountSettingsPage() {
    const {user, loadingAuth, refresh_user} = useAuth()
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    // <div><span onClick={() => navigate("/forgot-password")}className="link">Forgot password</span></div>

    useEffect(() => {
        if (!user) return
        setEmail(user.email)
        setUsername(user.username)
    }, [loadingAuth])

    async function save() {
        if (
            email === user.email &&
            username === user.username &&
            newPassword === "" &&
            confirmPassword === ""
        ) {
            alert("No changes to save.")
            return
        }
        
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.")
            return
        }
        if (newPassword.length > 0 && newPassword.length < 8) {
            alert("Password must be at least 8 characters.")
            return
        }
        if (newPassword && ! /[0-9]/.test(newPassword)) {
            alert("Password must contain a number.")
            return
        }
        if (newPassword && ! /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            alert("Password must contain a special character.")
            return
        }
        if (! /^\S+@\S+\.\S+$/.test(email)) {
            alert("Invalid email format.")
            return
        }

        try {
            setLoading(true)
            const res = await axios.put("/auth/edit", 
                {
                    username,
                    email,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                },
                {withCredentials: true}
            )
            refresh_user()
            if (res.data.email_changed) {
                alert(`Your email has been changed. An link has been sent to ${email} to verify your account.`)
                window.location.reload()
            }
            if (res.data.username_changed) {
                alert(`Username changed to ${username}`)
                window.location.reload()
            }
            if (res.data.password_changed) {
                alert("Password changed.")
                window.location.reload()
            }

        } catch (err) {
            alert(err.response.data.message)
            console.error("Error editing user info: ", err.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    async function verify() {
        try {
            setLoading(true)
            await axios.post("/auth/resend-verification",
                {email: user.email}
            )
            alert("Verification email sent.")
        } catch (err) {
            console.error("Could not re-send verification email:", err.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card table maxWidth={"560px"}>
        <div className="table-card-head table-head-title">Account</div>
        <div className="table-body">
                <div className="form-container">
                    <div className="input-container">
                        <div className="label">
                            Email address
                        </div>
                        <input type="text" className="text-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                        {!user.is_verified && <div>Not verified - <span onClick={verify} className="link">resend verification email</span></div>}
                    </div>
                    <div className="input-container">
                        <div className="label">
                            Username
                        </div>
                        <input type="text" className="text-input" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>

                    <div className="input-container">
                        <div className="label">
                            New password
                        </div>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="text-input" />
                    </div>

                    <div className="input-container">
                        <div className="label">
                            Confirm new password
                        </div>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="text-input" />
                    </div>

                    <div className="error"></div>

                    <div className="submit-container">
                        {!loading ? (
                            <>
                            <HeaderButton onClick={save} background={true}>Save</HeaderButton>
                            <span onClick={() => navigate("/home/delete-account")} className="link">Delete account</span>
                            </>
                        ) : (
                            <Spinner />
                        )}
                    </div>

                </div>
        </div>
    </Card>
    )
}