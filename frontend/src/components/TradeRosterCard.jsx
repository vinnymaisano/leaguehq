import Card from "./Card"
import RosterDialog from "./RosterDialog"
import RosterHeading from "./RosterHeading"
import { LuPlus } from "react-icons/lu"
import { useState } from "react"
import Roster from "./Roster"
import { get_salary_array } from "../utils/utils"
import { useLeague } from "../contexts/LeagueContext"

export default function TradeRosterCard({teams, rosterID, setRosterID, otherRosterID, playerMap, selectedPlayerIDs, setSelectedPlayerIDs, incomingPlayerIDs}) {
    const {league} = useLeague()
    
    const [showDialog, setShowDialog] = useState(false)
    // const [selectedPlayerIDs, setSelectedPlayerIDs] = useState([])

    // const team_name = teams.find(team => team.roster_id === rosterID).
    const current_team = teams.find(team => team.roster_id === rosterID)
    const selected_roster = playerMap[rosterID]

    const outgoing_players = selected_roster.filter(p => selectedPlayerIDs.includes(p._id))
    const incoming_players = playerMap[otherRosterID]?.filter(p => incomingPlayerIDs.includes(p._id))
    
    const current_year = new Date().getFullYear()
    const max_year = Math.max(
        current_year - 1,
        ...selected_roster.flatMap(p => p.contracts?.map(c => c.end_year) || []),
        ...outgoing_players.flatMap(p => p.contracts?.map(c => c.end_year) || []),
        ...incoming_players.flatMap(p => p.contracts?.map(c => c.end_year) || [])
    )

    // map year to cap used that year
    const cap = new Map()
    const netChange = new Map()

    function updateSalaryMap(map, players, sign = 1) {
        players.forEach(player => {
            const salary_array = get_salary_array(player.contracts)
            salary_array.forEach((sal, idx) => {
                if (sal != null) {
                    const year = current_year + idx
                    const salary = Number(sal)
                    map.set(year, (map.get(year) || 0) + sign * salary)
                }
            })
        })
    }

    // Existing cap
    updateSalaryMap(cap, selected_roster, 1)

    // Net change: -outgoing + incoming
    updateSalaryMap(netChange, outgoing_players, -1)
    updateSalaryMap(netChange, incoming_players, 1)

    function handle_set_roster_id(id) {
        setSelectedPlayerIDs([])
        setRosterID(id)
    }

    return (
        <>
        <Card height={"100%"} portion={1} minWidth={0} gap={"var(--space-4)"}>
                <div className="table-card trade-table">
                    <div className="roster-table-scroll">
                        <div className="roster-inner">
                            <RosterHeading
                                teams={teams.filter(t => t.roster_id != otherRosterID)}
                                selectedRosterID={rosterID}
                                setSelectedRosterID={handle_set_roster_id}
                                max_year={max_year}
                            />

                            <Roster
                                selected_roster={selected_roster}
                                can_edit={false}
                                max_year={max_year}
                                inDialog={false}
                                selectedPlayerIDs={selectedPlayerIDs}
                                setSelectedPlayerIDs={setSelectedPlayerIDs}
                            />
                        </div>
                    </div>
                </div>

                <button type="button" onClick={() => setShowDialog(true)} className="add-player-button">
                    <LuPlus/>
                    <span>Select Players</span>
                </button>

                <div className="cap-table">
                        <div className="cap-table-row cap-table-head">
                            <span>Year</span>
                            <span>Current</span>
                            <span>After</span>
                            <span>Change</span>
                        </div>
                        {Array.from({length: max_year-current_year+2}, (_, i)=> {
                            const year = current_year+i
                            const used = cap.get(year) || 0
                            const net = netChange.get(year) || 0
                            const final = used + net

                            const currentCapSpace = league.salary_cap - used
                            const afterCapSpace = league.salary_cap - final
                            return (
                                <div key={year} className="cap-table-row">
                                    <span className="cap-table-year">{year}</span>
                                    <span className={currentCapSpace < 0 ? "net-negative" : ""}>{currentCapSpace < 0 ? "-" : ""}${Math.abs(currentCapSpace)}</span>
                                    <span className={afterCapSpace < 0 ? "net-negative" : ""}>{afterCapSpace < 0 ? "-" : ""}${Math.abs(afterCapSpace)}</span>
                                    <span className={net <= 0 ? "net-positive" : "net-negative"}>{net <= 0 ? "+" : "-"}${Math.abs(net)}</span>
                                </div>
                            )
                            }
                        )}
                    </div>
            </Card>

            <RosterDialog 
                roster={selected_roster}
                isOpen={showDialog}
                max_year={max_year}
                teamName={current_team.name}
                onDone={() => setShowDialog(false)}
                selectedPlayerIDs={selectedPlayerIDs}
                setSelectedPlayerIDs={setSelectedPlayerIDs}
            />
        </>
    )
}

// render roster component in a dialog box