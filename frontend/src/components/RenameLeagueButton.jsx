import { useState } from "react"
import { createPortal } from "react-dom"
import axios from "axios"
import HeaderButton from "./HeaderButton"
import Spinner from "./Spinner"
import "../css/ConfirmationDialog.css"

// Small "Rename" button + dialog for giving a league a custom, league-wide name.
// The Sleeper name is shown as reference and never changed. Permission is gated by
// the parent (only rendered for owners/commissioners).
export default function RenameLeagueButton({ league, onRenamed }) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(league.custom_name || "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    function open_dialog(e) {
        // stop the click from triggering a parent <Link> navigation
        e.preventDefault()
        e.stopPropagation()
        setValue(league.custom_name || "")
        setError("")
        setOpen(true)
    }

    function close_dialog(e) {
        e?.stopPropagation?.()
        setOpen(false)
    }

    async function save(e) {
        e?.stopPropagation?.()
        try {
            setLoading(true)
            const res = await axios.put(
                `/api/leagues/${league._id}/rename`,
                { custom_name: value },
                { withCredentials: true }
            )
            onRenamed?.(res.data.custom_name)
            setOpen(false)
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <HeaderButton onClick={open_dialog}>Rename</HeaderButton>

            {open && createPortal(
                <div className="modal-overlay" onClick={close_dialog}>
                    <div className="confirm" onClick={e => e.stopPropagation()}>
                        <div className="subtitle">Rename league</div>
                        <div className="text-muted">Sleeper league: {league.name}</div>

                        <div className="dialog-input-container">
                            <input
                                type="text"
                                className="text-input"
                                style={{ width: "100%" }}
                                placeholder={league.name}
                                value={value}
                                maxLength={60}
                                onChange={e => setValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="text-muted">Leave blank to use the Sleeper name.</div>

                        {error && <div className="error">{error}</div>}

                        <div className="confirm-cancel">
                            {loading ? (
                                <Spinner />
                            ) : (
                                <>
                                    <HeaderButton onClick={close_dialog}>Cancel</HeaderButton>
                                    <HeaderButton background={true} onClick={save}>Save</HeaderButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
