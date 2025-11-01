import Card from '../components/Card'
import { useLocation, useSearchParams } from 'react-router-dom'

export default function VerifyEmailPage() {
    const {search} = useLocation()
    const status = new URLSearchParams(search).get("status")

    let title, message
    if (status === "success") {
        title = "Account verified"
        message = "Your email has been verified."
    } else if (status === "missing") {
        title = "Invalid link"
        message = "This link is invalid."
    } else if (status === "invalid") {
        title = "Invalid or expired link"
        message = "This link is either invalid or expired."
    } else {
        title = "Error"
        message = "Server error. Please try again."
    }

    return (
        <Card width={"600px"} height={""}>
            <div className="subtitle">{title}</div>
            <div>{message}</div>
        </Card>
    
    )
}