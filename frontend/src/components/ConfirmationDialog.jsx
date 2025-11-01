import {useState} from "react"
import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import { createPortal } from "react-dom"
import Spinner from "./Spinner"

export default function ConfirmationDialog({isOpen, title, message, onConfirm, onCancel, confirmText, requirePassword}) {
    if (!isOpen) return null
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleConfirm = () => {
        setLoading(true)
        if (requirePassword && !password) {
            alert("Please enter your password to continue.")
            setLoading(false)
            return
        }
        if (requirePassword) {
            onConfirm(password)
        } else {
            onConfirm()
        }
        setLoading(false)
    }

    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{title}</div>
                <div>{message}</div>
                {requirePassword && (
                    <div style={{width: "100%"}} className="dialog-input-container">
                        <input
                        type="password"
                        placeholder="Enter password"
                        onChange={e => setPassword(e.target.value)}
                        className="dialog-password"
                        value={password}
                        />
                    </div>
                )}
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