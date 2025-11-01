import {useState} from "react"
import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import { createPortal } from "react-dom"

export default function ImportDialog({isOpen, title, message, overwrite, setOverwrite, onConfirm, onCancel}) {
    if (!isOpen) return null
    function close() {
        return
    }
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{title}</div>
                <div>{message}</div>
                <div>
                    <label>
                    <input style={{marginRight: "5px"}} value={overwrite} onChange={e => setOverwrite(e.target.checked)} type="checkbox"></input>
                    <span>Overwrite existing contracts</span>
                    </label>
                </div>
                <div className="confirm-cancel">
                    <HeaderButton onClick={onCancel}>Cancel</HeaderButton>
                    <HeaderButton onClick={onConfirm} background={true}>Confirm</HeaderButton>
                </div>
            </div>
        </div>,
        document.body
    )

}