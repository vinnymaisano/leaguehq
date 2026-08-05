import { NavLink, Outlet, useParams } from "react-router-dom"
import { useLeague } from "../contexts/LeagueContext"
import { LuClipboardList, LuFileText, LuUsers, LuCalendar, LuTrash2 } from "react-icons/lu"
import "../css/SettingsLayout.css"

export default function SettingsLayout() {
    const { league_id } = useParams()
    const { isOwner } = useLeague()
    const base = `/league/${league_id}/settings`

    const items = [
        { to: `${base}/league-rules`, label: "League settings", icon: LuClipboardList },
        { to: `${base}/import-draft`, label: "Import contracts", icon: LuFileText },
        { to: `${base}/members`, label: "Members", icon: LuUsers },
    ]
    const ownerItems = [
        { to: `${base}/subscription`, label: "Subscription", icon: LuCalendar },
        { to: `${base}/delete-league`, label: "Delete league", icon: LuTrash2 },
    ]

    const renderLink = ({ to, label, icon: Icon }) => (
        <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `settings-nav-link ${isActive ? "active" : ""}`}
        >
            <Icon className="settings-nav-icon" />
            <span>{label}</span>
        </NavLink>
    )

    return (
        <div className="settings-shell">
            <aside className="settings-sidebar">
                <div className="settings-sidebar-title">Settings</div>
                <nav className="settings-nav">
                    {items.map(renderLink)}
                    {isOwner && (
                        <>
                            <div className="settings-nav-section">Owner</div>
                            {ownerItems.map(renderLink)}
                        </>
                    )}
                </nav>
            </aside>

            <div className="settings-main">
                <Outlet />
            </div>
        </div>
    )
}
