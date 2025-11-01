import {useState} from "react"
import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import { createPortal } from "react-dom"
import Spinner from "./Spinner"

export default function AddLeagueDialog({isOpen, title, onConfirm, onCancel, confirmText, year}) {
    if (!isOpen) return null
    const [leagueID, setLeagueID] = useState("")
    const [loading, setLoading] = useState(false)
    const password = ""

    const handleConfirm = () => {
        setLoading(true)
        if (!leagueID) {
            alert("Please enter your League's ID")
            return
        }
        onConfirm(leagueID)
        setLoading(false)
    }

    function handle_change(input) {
        if (/^\d*$/.test(input) && input.length <= 19) {
            setLeagueID(input)
        }
    }
    
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{title}</div>
                <div>Enter your Sleeper league's ID for the {year} season.</div>
                <div><span className="bold">In a browser:</span> when viewing your league, the league ID is the number in the URL</div>
                <div><span className="bold">On mobile:</span> your league ID can be found at the bottom of Settings→General</div>
     
                <div style={{width: "100%"}} className="dialog-input-container">
                    <input
                    style={{width: "100%"}}
                    type="text"
                    placeholder="Sleeper league ID"
                    onChange={e => handle_change(e.target.value)}
                    className="text-input"
                    value={leagueID}
                    />
                </div>
                
                <div className="confirm-cancel">
                    {!loading ? (
                        <>
                        <HeaderButton onClick={onCancel}>Cancel</HeaderButton>
                        <HeaderButton onClick={handleConfirm} background={true}>{confirmText ? confirmText : "Confirm"}</HeaderButton>
                        </>
                    ) : (
                        <Spinner />
                    )}
                </div>
            </div>
        </div>,
        document.body
    )

}