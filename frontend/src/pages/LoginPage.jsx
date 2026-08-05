import { useState } from "react"
import Row from '../components/Row'
import Card from '../components/Card'
import Spinner from '../components/Spinner'
import { useNavigate, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import '../css/LoginPage.css'
import HeaderButton from "../components/HeaderButton"

export default function LoginPage() {
    const {user, login, refresh_user} = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    })
    const [errorMessage, setErrorMessage] = useState("")
    const navigate = useNavigate()
    const location = useLocation()

    // get the page that redirected the user to the login page
    const from = location.state?.from || "/home"

    // already logged in - go to homepage
    if (user) {
        return <Navigate to="/home" replace />
    }

    function change_form_data(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    async function submit_form(e) {
        setLoading(true)

        if (!formData.username) {
            // alert("No username or email provided")
            setErrorMessage("No username or email provided")
            setLoading(false)
            return
        }
        if (formData.password.length === 0) {
            // alert("No password provided")
            setErrorMessage("No password provided")
            setLoading(false)
            return
        }

        const res = await login(formData)

        if (res.success) {
            setErrorMessage("")
            await refresh_user()
            navigate(from)
        } else {
            setErrorMessage(res.error)
            console.error("Login failed: ", res.error)
        }
        setLoading(false)
    }
    
    function check_enter_press(e) {
        if (e.key === "Enter") {
            submit_form()
        }
    }

    return (
        <Row height={"100%"} center={true}>
            <Card table maxWidth={"420px"}>
                <div className="table-card-head table-head-title">Login</div>

                <div className="login-body">
                <div className="form-container">
                        
                    <div className="input-container">
                        <div className="label">Username or email</div>
                        <input type="text" className="text-input" name="username" value={formData.username} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>
                    
                    <div className="input-container">
                        <div className="label">Password</div>
                        <input type="password" name="password" value={formData.password} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="error">{errorMessage}</div>
                    <div className="submit-container">
                        <HeaderButton onClick={submit_form}>Log In</HeaderButton>
                        {loading ? (
                            <Spinner size={"40px"}></Spinner>
                        ) : (
                            <div><span onClick={() => navigate("/forgot-password")}className="link">Forgot password</span></div>
                        )}
                    </div>

                </div>
                </div>

            </Card>
        </Row>
    )
}