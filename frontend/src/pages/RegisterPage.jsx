import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import Row from '../components/Row'
import Card from '../components/Card'
import axios from "axios"
import HeaderButton from "../components/HeaderButton"
import { useNavigate } from "react-router-dom"
import '../css/LoginPage.css'
import Spinner from "../components/Spinner"
// import { useAuth } from "../contexts/AuthContext"

export default function RegisterPage() {
    const {user, login, register, refresh_user} = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        verify_password: ""
    })

    const [errorMessage, setErrorMessage] = useState("")

    const navigate = useNavigate()
    if (user) {
        navigate("/home")    
    }

    function change_form_data(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    async function submit_form() {
        setLoading(true)
        if (formData.password !== formData.verify_password) {
            setErrorMessage("Passwords do not match")
            return
        }

        // create account
        const res = await register(formData)

        if (res.success) {
            setErrorMessage("")
            alert(`Account created. An email has been sent to ${formData.email} to verify your account.`)
            navigate("/home/account")
        } else {
            setErrorMessage(res.error)
            console.error("Register failed: ", res.error)
        } 
        setLoading(false)
    }

    function check_enter_press(e) {
        if (e.key === "Enter") {
            submit_form()
        }
    }

    return (
        <Row height={"100%"}>
            <Card width={"600px"} height={""} padding={"30px"}>
                <div className="title">Create account</div>
                <div className="form-container">
                    
                    <div className="input-container">
                        <div className="label">Username</div>
                        <input type="text" className="text-input"  name="username" value={formData.username} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="input-container">
                        <div className="label">Email</div>
                        <input type="text" className="text-input"  name="email" value={formData.email} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="input-container">
                        <div className="label">Password</div>
                        <input type="password" name="password" value={formData.password} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="input-container">
                        <div className="label">Confirm password</div>
                        <input type="password" name="verify_password" value={formData.verify_password} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="error">{errorMessage ? `${errorMessage}` : ""}</div>
                    
                    <div className="submit-container">
                        {!loading ? (
                            <HeaderButton background={true} onClick={submit_form}>Create</HeaderButton>
                        ) : (
                            <Spinner />
                        )}
                    </div>
                    
                </div>
            </Card>
        </Row>
    )
}