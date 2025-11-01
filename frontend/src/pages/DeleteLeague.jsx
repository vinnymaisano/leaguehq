import axios from "axios"
import Row from "../components/Row"
import Card from "../components/Card"
import Spinner from "../components/Spinner"
import HeaderButton from "../components/HeaderButton"
import ConfirmationDialog from "../components/ConfirmationDialog"
import { Link, useNavigate, useParams } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa"
import { useAuth } from "../contexts/AuthContext"
import { useState } from "react"
import BackButton from "../components/BackButton"

export default function DeleteLeague() {
    const {league_id} = useParams()
    const {user, loadingAuth} = useAuth()
    const [showDialog, setShowDialog] = useState(false)
    const navigate = useNavigate()

    async function delete_league(password) {
        try {
            const url = `/api/${league_id}/delete`
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
            <Row center={true} height={"100%"}>
                <Card width={"750px"}>
                    <div className="content-gap">

                        <div className="header-backbutton">
                            <BackButton to={`/league/${league_id}/settings`} />
                            <span className="subtitle">Delete league</span>
                        </div>

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