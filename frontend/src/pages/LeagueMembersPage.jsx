import Row from "../components/Row"
import Card from "../components/Card"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa"
import axios from "axios"
import LeagueMember from "../components/LeagueMember"
import HeaderButton from "../components/HeaderButton"
import Spinner from "../components/Spinner"
import SearchUser from "../components/SearchUser"
import { useLeague } from "../contexts/LeagueContext"
import { useAuth } from "../contexts/AuthContext"
import BackButton from "../components/BackButton"

export default function LeagueMembersPage() {
    const {league_id} = useParams()
    const {league, loadingLeague} = useLeague()
    const {isOwner} = useLeague()
    const {user} = useAuth()
    const [teamInfo, setTeamInfo] = useState(null)
    const [users, setUsers] = useState(null)
    const [assignments, setAssignments] = useState({})
    const [commissioners, setCommissioners] = useState([])
    const [loading, setLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveError, setSaveError] = useState(null)

    useEffect(() => {
        if (!league) return
        async function fetch_data() {
            try {
                setLoading(true)
                const [teamRes, userRes] = await Promise.all([
                    axios.get(`/api/leagues/${league._id}/rosters`),
                    axios.get(`/api/leagues/${league._id}/users`)
                ])
                setTeamInfo(teamRes.data.team_info)
                setAssignments(teamRes.data.teams)
                setUsers(userRes.data)
                setCommissioners(league.commissioners)
                // console.log(league.commissioners)
            } catch (err) {
                console.error("Error fetching team data: ", err.message)
            } finally {
                setLoading(false)
            }
        }
        fetch_data()
    }, [league])

    // change a user's team asignments
    function change_team(user_id, roster_id) {
        const assignment = (roster_id === "") ? null : parseInt(roster_id)
        setAssignments(prev => ({
            ...prev,
            [user_id]: assignment || null
        }))
    }

    function update_commissioners(user_id) {
        if (commissioners.includes(user_id)) {
            // console.log(commissioners.filter(id => id !== user_id))
            setCommissioners(prev => prev.filter(id => id !== user_id))
        } else {
            // console.log([...commissioners, user_id])
            setCommissioners(prev => [...prev, user_id])
        }
    }

    // commit changes in team assignments
    async function save_changes() {
        try {
            setSaveLoading(true)
            const res = await axios.put(
                `/api/leagues/${league_id}/edit-members`,
                {assignments, commissioners}
            )
            setSaveError("")
            alert("League members updated.")
        } catch (err) {
            console.error("Failed to save team assignments: ", err.response.data.message)
            setSaveError(err.response.data.message)
        } finally {
            setSaveLoading(false)
        }
    }
    
    return (
        <div className="mainpanel">
            <Row center={true} height={"100%"}>
                <Card width={"750px"} height={"100%"}>
                    <div className="header-backbutton">
                        <BackButton to={`/league/${league_id}/settings`} />
                        <span className="subtitle">League members</span>
                    </div>

                    <div>Assigning a user to a team allows them to extend their players' contracts</div>

                    <div className="league-member-grid league-member-heading">
                        <span>Username</span>
                        <span style={{paddingLeft: "100px"}}>Team</span>
                        <span>Commissioner</span>
                    </div>


                    <div className="content-gap">

                    {loading || loadingLeague ? (
                        <div className="spinner-container">
                            <Spinner />
                        </div>
                    ) : (    
                        <>
                        <div className="settings-container">
                        {users && users.map(u => (
                            <LeagueMember 
                                key={u._id}
                                can_delete={isOwner && u._id != user._id}
                                user_id={u._id}
                                username={u.username}
                                teams={teamInfo}
                                selected_roster_id={assignments[u._id]}
                                can_edit_commish={isOwner}
                                on_change_team={(e)=> change_team(u._id, e.target.value)}
                                on_change_commish={(e)=> update_commissioners(u._id)}
                                owner={league.owner == u._id}
                                commish={league.owner !== u._id && commissioners.includes(String(u._id))}
                            />
                        ))}

                        </div>
                        <div className="save-container">
                            {saveLoading ? (
                                <Spinner />
                            ) : (
                                <HeaderButton background={true} onClick={save_changes}>Save</HeaderButton>
                            )}
                            <div className="error">{saveError}</div>
                        </div>
                        </>
                    )}
                </div>
                </Card>
                <Card width={"500px"} height={"100%"}>
                    <div className="header-backbutton">
                        <span className="subtitle">Invite member</span>
                    </div>
                    <SearchUser />
                </Card>
            </Row>
        </div>
    )
}