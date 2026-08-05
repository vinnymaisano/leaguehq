import {Link} from "react-router-dom"
import '../css/Logo.css'

export default function Logo() {
    return (
        <Link to={"/"} className="logo-link">
            <span className="logo">League HQ</span>
        </Link>
    )
}