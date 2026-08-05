import { get_salary_array } from "../utils/utils"

// Display-only "you give / you get" recap of the pending trade.
export default function TradeSummary({teams, playerMap, rosterID1, rosterID2, selectedPlayerIDs1, selectedPlayerIDs2}) {
    const team1 = teams.find(t => t.roster_id === rosterID1)
    const team2 = teams.find(t => t.roster_id === rosterID2)

    function outgoing(rosterID, selectedIDs) {
        return (playerMap[rosterID] || []).filter(p => selectedIDs.includes(p._id))
    }

    function this_year_salary(player) {
        const salary = get_salary_array(player.contracts)[0]
        return salary != null ? `$${salary}` : "—"
    }

    function renderSide(team, players) {
        return (
            <div className="trade-summary-side">
                <div className="trade-summary-heading">{team?.name || "Team"} sends</div>
                {players.length === 0 ? (
                    <div className="trade-summary-empty">No players selected.</div>
                ) : (
                    <div className="trade-summary-list">
                        {players.map(p => (
                            <div key={p._id} className="trade-summary-player">
                                <span className={`position ${p.position}`}>{p.position}</span>
                                <span className="trade-summary-name">{p.full_name}</span>
                                <span className="trade-summary-salary">{this_year_salary(p)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="trade-summary">
            <div className="trade-summary-title">Trade summary</div>
            {renderSide(team1, outgoing(rosterID1, selectedPlayerIDs1))}
            {renderSide(team2, outgoing(rosterID2, selectedPlayerIDs2))}
        </div>
    )
}
