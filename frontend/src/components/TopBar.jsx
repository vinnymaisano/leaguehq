import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useLocation } from "react-router-dom"
import { useLeague } from "../contexts/LeagueContext"
import { useAuth } from "../contexts/AuthContext"
import HeaderButton from "./HeaderButton"
import ThemeToggle from "./ThemeToggle"
import { league_display_name } from "../utils/utils"

export default function TopBar() {
    const { league_id } = useParams()
    const { league, leagueYear } = useLeague()
    const { user } = useAuth()
    const location = useLocation()
    const [teamName, setTeamName] = useState("")

    useEffect(() => {
        if (!league || !user) return

        async function get_team_name() {
            try {
                const url = `/api/leagues/${league_id}/rosters`
                const { data: { team_info, teams } } = await axios.get(url)
                const roster_id = teams[user._id] ?? -1
                const team = team_info.find(team => team.roster_id === roster_id)
                setTeamName(team ? team.name : "")
            } catch (err) {
                console.error("Error getting team name:", err?.response?.data || err.message)
                setTeamName("")
            }
        }
        get_team_name()
    }, [league, user])

    return (
        <div className="topbar-content">
            <div className="topbar-title">
                <span className="info-bold">{league_display_name(league)}</span>
                <span className="info-secondary">
                    {leagueYear != -1 ? `${leagueYear} season` : ""}
                </span>
            </div>

            <div className="topbar-user">
                <ThemeToggle />
                {user?.username ? (
                    <>
                        <span className="info-bold">{user.username}</span>
                        {teamName && <span className="info-secondary">{teamName}</span>}
                    </>
                ) : (
                    <HeaderButton to={`/login`} background={true} state={{ from: location.pathname }}>
                        Login
                    </HeaderButton>
                )}
            </div>
        </div>
    )
}
