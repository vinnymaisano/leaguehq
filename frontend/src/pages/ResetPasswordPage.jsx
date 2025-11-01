import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { useState } from "react"
import Row from "../components/Row"
import Card from "../components/Card"
import Spinner from "../components/Spinner"
import HeaderButton from "../components/HeaderButton"

export default function ResetPasswordPage() {
    const {reset_token} = useParams()
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function change_password() {
        try {
            setLoading(true)

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

            const res = await axios.post(`/auth/reset-password/${reset_token}`,
                {
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }
            )
            alert("Password reset. Redirecting to login page...")
            navigate("/login")
        } catch (err) {
            setErrorMessage(err.response.data.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <Row height={"100%"}>
            <Card width={"600px"} height={""} padding={"30px"}>
                <div className="title">Reset password</div>  
                <div className="form-container">
                    
                    <div className="input-container">
                        <div className="label">New password:</div>
                        <input type="password" className="text-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}></input>
                    </div>

                    <div className="input-container">
                        <div className="label">Confirm new password:</div>
                        <input type="password" className="text-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></input>
                    </div>


                    <div className="error">{errorMessage ? `${errorMessage}` : ""}</div>    
                    
                    <div className="submit-container">
                        <HeaderButton background={true} onClick={change_password}>Submit</HeaderButton>
                        {loading && (
                            <Spinner size={"40px"}></Spinner>
                        )}
                    </div>

                </div>
            </Card>
        </Row>
    )
}