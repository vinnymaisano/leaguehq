import '../css/Roster.css'
import axios from 'axios'
import MainPanel from '../components/MainPanel'
import Row from '../components/Row'
import Card from '../components/Card'
import RosterHeading from '../components/RosterHeading'
import BudgetBar from '../components/BudgetBar'
import Spinner from '../components/Spinner'
import Roster from '../components/Roster'
import { useParams } from 'react-router-dom'
import {useState, useEffect} from 'react'
import { useLeague } from '../contexts/LeagueContext'
import { useAuth } from '../contexts/AuthContext'
import { get_salary_array } from '../utils/utils'

export default function RostersPage() {
    const {league_id} = useParams()
    const {league, isOwner, isCommish, subStatus, subPurchased, subHistory, loadingLeague} = useLeague()
    const {user, loadingAuth} = useAuth()
    const [loadingRosters, setLoadingRosters] = useState(false)
    const [teams, setTeams] = useState([])
    const [selectedRosterID, setSelectedRosterID] = useState("") // use this so that can view teams that dont have an owner yet
    const [playersByRosterID, setPlayersByRosterID] = useState({})

    // track whether the currently selected roster belongs to the user
    const user_roster_id = league?.teams?.[user?._id] || null
    const user_roster_selected = parseInt(selectedRosterID) === user_roster_id

    // store selected roster ID in local storage so that it persists after a contract is extended
    function handleSetSelectedRosterID(id) {
        sessionStorage.setItem("selectedRosterID", id)
        setSelectedRosterID(id)
    }
    
    useEffect(() => {
        async function get_team_data() {
            if (!league) return
            try {
                setLoadingRosters(true)
                const res = await axios.get(`/api/leagues/${league_id}/rosters`)
                // team names, roster IDs - for roster heading
                setTeams(res.data.team_info)
                // maps roster IDs to player info, contracts
                setPlayersByRosterID(res.data.roster_player_map)
                const storedRosterID = sessionStorage.getItem("selectedRosterID")

                if (!selectedRosterID && res.data.team_info.length > 0) {
                    if (storedRosterID && res.data.roster_player_map[storedRosterID]) {
                        handleSetSelectedRosterID(storedRosterID)
                    }
                    else if (user && league.teams[user._id] != null) {
                        handleSetSelectedRosterID(league.teams[user._id])
                    } else {
                        handleSetSelectedRosterID(1)
                    }
                }
            } catch (err) {
                console.error("Error fetching roster data: ", err.message)
            } finally {
                setLoadingRosters(false)
            }
        }
        get_team_data()
    }, [league_id, league])

    // player info, contracts for selected roster
    const selected_roster = playersByRosterID[selectedRosterID] || []
    
    // may change how year is determined
    const current_year = new Date().getFullYear()
    // derive max year
    const max_year = Math.max(
        current_year-1,
        ...selected_roster.flatMap(p =>
            p.contracts?.map(c => c.end_year) || []
        )
    )

    // map year to cap used that year
    const cap = new Map()

    // fill out cap
    selected_roster.forEach(player => {
        const salary_array = get_salary_array(player.contracts)
        
        salary_array.forEach((sal, idx) => {
            if (sal != null) {
                const salary = Number(sal)
                const year = current_year + idx
                cap.set(year, (cap.get(year) || 0) + salary)
            }
        })
    })

    if (loadingRosters || loadingAuth || loadingLeague) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    return (
        <MainPanel>
            <Row height={"100%"}>
                <Card height={"100%"} width={"70%"}>
                    <div className="table-card">
                        <div className="roster-table-scroll">
                            <div className="roster-inner">
                                <RosterHeading
                                    max_year={max_year}
                                    teams={teams}
                                    selectedRosterID={selectedRosterID}
                                    setSelectedRosterID={handleSetSelectedRosterID}>
                                </RosterHeading>

                                <Roster
                                    selected_roster={selected_roster}
                                    selectedPlayerIDs={selected_roster.map(player => player._id)}
                                    can_edit={user_roster_selected || isOwner || isCommish}
                                    max_year={max_year}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card height={"100%"} width={"30%"}>
                {league ? (
                    <div className="table-card">
                        <div className="table-card-head budget-head">Salary cap</div>
                        <div className="budgetbar-container">

                            {Array.from({length: max_year-current_year+2}, (_, i)=> {
                                const year = current_year+i
                                return (
                                    <BudgetBar
                                        key={year}
                                        year={year}
                                        used={cap.get(year) || 0}
                                        total={league.salary_cap}
                                    />
                                )
                                }
                            )}
                        </div>
                    </div>
                ) :  (
                    <div className="spinner-container">
                        <Spinner />
                        Loading salary cap info...
                    </div>
                )}
                </Card>
            </Row>
        </MainPanel>
        )
}