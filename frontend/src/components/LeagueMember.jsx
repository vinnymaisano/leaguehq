import Card from "./Card"
import Spinner from "./Spinner"
import "../css/LeagueMember.css"
import { FaRegTimesCircle } from "react-icons/fa"
import axios from "axios"
import { useParams } from "react-router-dom"
import { useState } from "react"
import ConfirmationDialog from "./ConfirmationDialog"
import { useLeague } from "../contexts/LeagueContext"

export default function LeagueMember({can_delete, user_id, username, teams, on_change_team, on_change_commish, selected_roster_id, can_edit_commish, owner, commish}) {
    const {league_id} = useParams()
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    async function remove_user() {
        try {
            setLoading(true)
            const res = await axios.delete(`/api/leagues/${league_id}/users/${user_id}`)
            window.location.reload()
        } catch (err) {
            setLoading(false)
            console.error("Error deleting player: ", err.response.data.message)
        }
    }

    async function handle_confirm() {
        setShowDialog(false)
        remove_user()
    }

    return (
        <Card width={"100%"}>
            <div className="league-member-grid">

                <span className="username-container">{username}</span>

                <div className="team-dropdown-container">
                    {owner && <span className="league-role">Owner</span>}

                        <select 
                            className="team-dropdown"
                            value={selected_roster_id || ""}
                            onChange={on_change_team}
                        >
                            <option value="">Unassigned</option>
                            {teams && teams.map(team => (
                                <option key={team.roster_id} value={team.roster_id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                </div>

                <div className="commish-toggle">
                    {!owner &&  <input checked={commish} onChange={on_change_commish} type="checkbox" disabled={!can_edit_commish}></input>}
                </div>

                <div className="delete-button-container">
                {!loading ? (
                    can_delete ? (
                        <FaRegTimesCircle onClick={() => setShowDialog(true)} className="delete-button" />
                    ) : (
                        <></>
                    )) : (
                        <div style={{marginLeft: "10px"}}>
                            <Spinner size={"17px"} thickness={"2px"} />
                        </div>
                    )}
                </div>

                <ConfirmationDialog 
                    isOpen={showDialog}
                    onConfirm={handle_confirm}
                    onCancel={() => setShowDialog(false)}
                    title={"Remove member"}
                    message={`Are you sure you want to remove ${username}?`}
                />
            </div>
        </Card>
    )
}