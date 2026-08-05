import { useNavigate, useParams } from "react-router-dom"

export default function Team({team, rank}) {
    const {league_id} = useParams()
    const navigate = useNavigate()

    function view_roster() {
        // RostersPage reads this to pre-select the team's roster
        sessionStorage.setItem("selectedRosterID", team.roster_id)
        navigate(`/league/${league_id}/rosters`)
    }

    return (
        <div className="team" onClick={view_roster}>
            <div className="name-record">
                <div className="name-rank">
                    <span className="rank">{rank}</span>
                    <span>{team.team_name}</span>
                </div>
                
                <span>{team.wins}-{team.losses}</span>
            </div>


            <div className="points">
                <span>PPG: {team.num_matchups != null ? Number((team.points_for / (team.num_matchups))).toFixed(2) || 0 : 0}</span>
                <span>PF: {team.points_for}</span>
                <span>PA: {team.points_against}</span>
            </div>
        </div>
    )
}