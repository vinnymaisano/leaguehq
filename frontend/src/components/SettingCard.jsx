import "../css/SettingCard.css"
import { LuChevronRight } from "react-icons/lu";
import { Link } from "react-router-dom";

export default function SettingCard({children, icon: Icon, to}) {
    return (
        <Link to={to} className="table-row table-row-link setting-row">
            <div className="setting-row-main">
                {Icon && <Icon className="setting-icon"/>}
                <div className="setting-name">{children}</div>
            </div>
            <LuChevronRight className="setting-chevron"/>
        </Link>
    )
}