import axios from "axios"
import "../css/TradeCenter.css"
import Row from "../components/Row"
import TradeRosterCard from "../components/TradeRosterCard"
import Spinner from "../components/Spinner"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useLeague } from "../contexts/LeagueContext"
import { useAuth } from "../contexts/AuthContext"

export default function TradeCenter() {
    const {league_id} = useParams()
    const {league, loadingLeague} = useLeague()
    const {user, loadingAuth} = useAuth()
    const [loadingRosters, setLoadingRosters] = useState(false)

    const [teams, setTeams] = useState(null)
    const [playersByRosterID, setPlayersByRosterID] = useState(null)

    const [selectedRosterID1, setSelectedRosterID1] = useState(1)
    const [selectedRosterID2, setSelectedRosterID2] = useState(2)

    // track players that have been added
    const [selectedPlayers1, setSelectedPlayers1] = useState([])
    const [selectedPlayers2, setSelectedPlayers2] = useState([])

    useEffect(() => {
        if (!loadingAuth && !loadingLeague && user && league) {
            const rosterID = league.teams[String(user._id)] || 1
            setSelectedRosterID1(rosterID)
            if (rosterID == 2) {
                setSelectedRosterID2(1)
            }
        }
    }, [loadingAuth, loadingLeague, user, league])


    // get all team, roster data
    useEffect(() => {
        async function get_team_data() {
            try {
                setLoadingRosters(true)
                const res = await axios.get(`/api/leagues/${league_id}/rosters`)
                setTeams(res.data.team_info)
                setPlayersByRosterID(res.data.roster_player_map)

            } catch (err) {
                console.error("Error fetching roster data: ", err.message)
            } finally {
                setLoadingRosters(false)
            }
        }
        get_team_data()
    }, [league_id])

    if (loadingRosters || !teams || !playersByRosterID) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="mainpanel">
            <Row height={"100%"} center={true}>
                <TradeRosterCard 
                    teams={teams} 
                    rosterID={selectedRosterID1} 
                    setRosterID={setSelectedRosterID1} 
                    otherRosterID={selectedRosterID2} 
                    playerMap={playersByRosterID} 
                    selectedPlayerIDs={selectedPlayers1} 
                    setSelectedPlayerIDs={setSelectedPlayers1}
                    incomingPlayerIDs={selectedPlayers2}
                />
                
                <TradeRosterCard
                    teams={teams} 
                    rosterID={selectedRosterID2}
                    setRosterID={setSelectedRosterID2} 
                    otherRosterID={selectedRosterID1} 
                    playerMap={playersByRosterID} 
                    selectedPlayerIDs={selectedPlayers2} 
                    setSelectedPlayerIDs={setSelectedPlayers2}
                    incomingPlayerIDs={selectedPlayers1}
                />
            </Row>
        </div>
    )
}