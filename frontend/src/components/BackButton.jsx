import { Link } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";

export default function BackButton({to}) {
    return (
        <Link to={to} className="back-button">
            <LuChevronLeft className="back-button-icon"/>
            <span>Back</span>
        </Link>
    )
}