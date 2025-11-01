export default function Team({team, rank}) {
    return (
        <div className="team">
            <div className="name-record">
                <div className="name-rank">
                    <span className="rank">{rank}</span>
                    <span>{team.team_name}</span>
                </div>
                
                <span>{team.wins}-{team.losses}</span>
            </div>


            <div className="points">
                <span>PPG: {Number((team.points_for / (team.num_matchups))).toFixed(2) || 0}</span>
                <span>PF: {team.points_for}</span>
                <span>PA: {team.points_against}</span>
            </div>
        </div>
    )
}