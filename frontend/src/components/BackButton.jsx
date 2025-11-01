import { Link } from "react-router-dom";
import { FaAngleLeft } from "react-icons/fa";

export default function BackButton({to}) {
    return (
        <div className="back-button">
            <Link to={to}>
                <FaAngleLeft className="nav-button"/>
            </Link>
        </div>
    )
}