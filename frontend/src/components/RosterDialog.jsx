import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import "../css/RosterDialog.css"
import { createPortal } from "react-dom"
import Roster from "./Roster"

export default function RosterDialog({isOpen, teamName, onDone, roster, rosterID, max_year, selectedPlayerIDs, setSelectedPlayerIDs}) {
    if (!isOpen) return null
    
    return createPortal(
        <div className="modal-overlay" onClick={onDone}>
            <div className="window" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{teamName}</div>
                <div>
                    <Roster 
                        loadingRosters={false}
                        selected_roster={roster}
                        selectedRosterID={rosterID}
                        max_year={max_year}
                        inDialog={true}
                        selectedPlayerIDs={selectedPlayerIDs}
                        setSelectedPlayerIDs={setSelectedPlayerIDs}
                    />
                </div>
                <div className="confirm-cancel">
                    <HeaderButton onClick={onDone} background={true}>Done</HeaderButton>
                </div>
            </div>
        </div>,
        document.body
    )

}