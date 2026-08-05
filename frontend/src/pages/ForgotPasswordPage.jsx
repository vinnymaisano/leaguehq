import Row from "../components/Row"
import Card from "../components/Card"
import Spinner from "../components/Spinner"
import HeaderButton from "../components/HeaderButton"
import { useState } from "react"
import axios from "axios"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")

    async function submit() {
        try {
            setLoading(true)
            if (! /^\S+@\S+\.\S+$/.test(email)) {
                alert("Invalid email format.")
                return
            }
            const res = await axios.post("/auth/forgot-password",
                {email}
            )
            alert(`An email has been sent to ${email} with a link to reset your password. The link will expire in an hour.`)
        } catch (err) {
            alert(`Error: ${err.response.data.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Row height={"100%"} center={true}>
            <Card table maxWidth={"420px"}>
                <div className="table-card-head table-head-title">Reset password</div>
                <div className="login-body">
                <div className="form-container">
                    <div className="input-container">
                        <div className="label">Enter email:</div>
                        <input type="text" className="text-input" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                    </div>
                    <div className="submit-container">
                        <HeaderButton onClick={submit}>Reset</HeaderButton>
                        {loading && (
                            <Spinner size={"40px"}></Spinner>
                        )}
                    </div>
                </div>
                </div>
            </Card>
        </Row>
    )
}
     