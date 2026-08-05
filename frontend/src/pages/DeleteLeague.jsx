import axios from "axios"
import Row from "../components/Row"
import Card from "../components/Card"
import Spinner from "../components/Spinner"
import HeaderButton from "../components/HeaderButton"
import ConfirmationDialog from "../components/ConfirmationDialog"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useState } from "react"

export default function DeleteLeague() {
    const {league_id} = useParams()
    const {user, loadingAuth} = useAuth()
    const [showDialog, setShowDialog] = useState(false)
    const navigate = useNavigate()

    async function delete_league(password) {
        try {
            const url = `/api/leagues/${league_id}/delete`
            await axios.delete(url, {
                data: {password},
                withCredentials: true
            })
            navigate("/home")
            alert("League deleted.")
        } catch (err) {
            const msg = `Error deleting league: ${err.response?.data.message || err.message}`
            console.error(msg)
            alert(msg)
        }
    }

    return (
        <>
        <div className="mainpanel">
            <Row height={"100%"}>
                <Card gap={"var(--space-4)"}>
                    <Card table>
                        <div className="table-card-head table-head-title">Delete league</div>
                        <div className="table-body">
                            <div className="content-gap">
                                <div>
                                    <span className="note">NOTE:</span> Deleting this league will not cancel your subscription.
                                    Since subscriptions are tied to your Sleeper league, you can create a new league
                                    connected to the same Sleeper league and your subscription will still apply.
                                </div>
                                {loadingAuth || !user ? (
                                    <div className="spinner-container">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <div className="header-button-container">
                                        <HeaderButton onClick={() => navigate(`/league/${league_id}/settings`)}>Cancel</HeaderButton>
                                        <HeaderButton onClick={() => setShowDialog(true)} background={true}>Delete league</HeaderButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </Card>
            </Row>
        </div>

        <ConfirmationDialog 
            isOpen={showDialog}
            title={"Delete league"}
            message={"Please confirm that you want to delete this league."}
            confirmText={"Delete league"}
            requirePassword={true}
            onConfirm={delete_league}
            onCancel={() => setShowDialog(false)}
        />
        </>
    )
}