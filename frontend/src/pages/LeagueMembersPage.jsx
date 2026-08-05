import Card from "../components/Card"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"
import LeagueMember from "../components/LeagueMember"
import HeaderButton from "../components/HeaderButton"
import Spinner from "../components/Spinner"
import SearchUser from "../components/SearchUser"
import { useLeague } from "../contexts/LeagueContext"
import { useAuth } from "../contexts/AuthContext"

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
            setCommissioners(prev => prev.filter(id => id !== user_id))
        } else {
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
            <Card gap={"var(--space-4)"}>
                <div className="members-intro">
                    <span className="subtitle">League members</span>
                    <div className="text-muted">
                        Assigning a member to a team allows them to extend their players' contracts.
                        Commissioners can change league settings and extend or edit any contract.
                    </div>
                </div>

                <div className="table-card">
                    <div className="table-card-head table-head-title">Members</div>
                    <div className="league-member-grid league-member-heading">
                        <span>Username</span>
                        <span style={{textAlign: "center"}}>Team</span>
                        <span style={{textAlign: "center"}}>Commissioner</span>
                        <span></span>
                    </div>

                    {loading || loadingLeague ? (
                        <div className="table-empty">
                            <Spinner />
                        </div>
                    ) : (
                        users && users.map(u => (
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
                        ))
                    )}
                </div>

                {!(loading || loadingLeague) && (
                    <div className="save-container">
                        {saveLoading ? (
                            <Spinner />
                        ) : (
                            <HeaderButton background={true} onClick={save_changes}>Save changes</HeaderButton>
                        )}
                        <div className="error">{saveError}</div>
                    </div>
                )}

                <div className="table-card">
                    <div className="table-card-head table-head-title">Invite member</div>
                    <div className="invite-body">
                        <div className="text-muted invite-hint">
                            Search for a user by their username to add them to the league.
                        </div>
                        <SearchUser />
                    </div>
                </div>
            </Card>
        </div>
    )
}