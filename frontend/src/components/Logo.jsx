import {Link} from "react-router-dom"
import '../css/Logo.css'

export default function Logo() {
    return (
        <Link to={"/"}>
            <span className="logo">League HQ</span>
        </Link>
    )
}