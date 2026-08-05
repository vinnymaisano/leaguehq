import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Card from "../components/Card"
import HeaderButton from "../components/HeaderButton"
import ConfirmationDialog from "../components/ConfirmationDialog"
import { useAuth } from "../contexts/AuthContext"
import Spinner from "../components/Spinner"

export default function DeleteAccount() {
    const navigate = useNavigate()
    const [showDialog, setShowDialog] = useState(false)
    const {user, refresh_user, loadingAuth} = useAuth()

    async function delete_account(password) {
        try {
            const url = "/auth/me"
            const res = await axios.delete(url, {
                data: {password},
                withCredentials: true
            })
            refresh_user()
            navigate("/")
            alert("Your account has been deleted.")
        } catch (err) {
            const msg = `Error deleting account: ${err.response?.data.message || err.message}`
            console.error(msg)
            alert(msg)
        }
    }

    return (
        <>
            <Card table maxWidth={"560px"}>
                <div className="table-card-head table-head-title">Delete account</div>
                <div className="table-body">
                    <div className="content-gap">
                        <div>Are your sure you want to permanently delete your account?</div>

                        {loadingAuth || !user ? (
                            <div className="spinner-container">
                                <Spinner />
                            </div>
                        ) : (
                            <div className="header-button-container">
                                <HeaderButton onClick={() => navigate("/home/account")}>Cancel</HeaderButton>
                                <HeaderButton onClick={() => setShowDialog(true)} background={true}>Delete account</HeaderButton>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <ConfirmationDialog
                isOpen={showDialog}
                title={"Delete account"}
                message={"Please confirm that you want to delete your LeagueHQ account."}
                confirmText={"Delete account"}
                requirePassword={true}
                onConfirm={delete_account}
                onCancel={() => setShowDialog(false)}
            />
        </>
    )
}