import { Link } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { league_display_name } from "../utils/utils"
import RenameLeagueButton from "./RenameLeagueButton"

const STATUS_MAP = {
    active: { className: "active-sub", label: "Active" },
    trial: { className: "free-trial", label: "Free trial" },
    inactive: { className: "inactive-sub", label: "Inactive" },
}

export default function LeagueCard({league}) {
    const { user } = useAuth()
    const [customName, setCustomName] = useState(league.custom_name || "")

    const created = league.createdAt
        ? new Date(league.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : null
    const status = STATUS_MAP[league.subscription_status] || STATUS_MAP.inactive

    const league_with_name = { ...league, custom_name: customName }
    const is_commish = !!user && (
        league.owner?._id === user._id ||
        league.commissioners?.some(id => String(id) === String(user._id))
    )

    return (
        <Link to={`/league/${league._id}`} className="table-row table-row-link league-row">
            <div className="league-row-main">
                <div className="league-name">{league_display_name(league_with_name)}</div>
                <div className="league-meta">Owner: {league.owner.username} · Salary cap: ${league.salary_cap}</div>
                <div className="league-meta">Sleeper: {league.name}</div>
                {created && <div className="league-meta">Created {created}</div>}
                <div className="league-meta">LeagueHQ ID: {league._id}</div>
                <div className="league-meta">Sleeper League ID: {league.sleeper_league_ids[String(new Date().getFullYear())]}</div>
            </div>

            <div className="league-card-side">
                <div className="league-sub-status" title={`Subscription: ${status.label}`}>
                    <span className={`sub-status ${status.className}`}></span>
                    <span className="league-sub-label">{status.label}</span>
                </div>
                {is_commish && (
                    <RenameLeagueButton
                        league={league_with_name}
                        onRenamed={(name) => setCustomName(name)}
                    />
                )}
            </div>
        </Link>
    )
}
