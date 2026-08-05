import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import "../css/ExtendContract.css"
import ExtendContractDialog from "./ExtendContractDialog";
import SubscriptionRequiredDialog from "./SubscriptionRequiredDialog";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function ExtendButton({current_salary, start_year, name, current_contract, subscribed}) {
    // toggle whether the dialog is showing
    const {league_id} = useParams()
    const [showDialog, setShowDialog] = useState(false)
    const [showSubMessage, setShowSubMessage] = useState(false)

    async function handle_confirm(length) {
        if (!current_contract) {
            alert("Error: player does not have a contract to extend.")
            setShowDialog(false)
            return
        }
        try {
            const url = `/api/leagues/${league_id}/contracts/extend/${current_contract._id}`
            const res = await axios.post(
                url,
                {length},
                {withCredentials: true}
            )
            window.location.reload()
        } catch (err) {
            const msg = `Error creating contract: ${err.response?.data?.message || err.message}`
            alert(msg)
            console.error(msg)
        } finally {
            setShowDialog(false)
        }
    }

    return (
        <>
            <div onClick={() => subscribed ? setShowDialog(true) : setShowSubMessage(true)}>
                <LuPlus className="extend-button"/>
            </div>

            <SubscriptionRequiredDialog
                isOpen={showSubMessage}
                onClose={() => setShowSubMessage(false)}
                action="Extending a contract"
            />

            <ExtendContractDialog
                isOpen={showDialog}
                onConfirm={handle_confirm}
                onCancel={() => setShowDialog(false)}
                title={"Extend contract"}  
                name={name}
                start_year={start_year}
                current_salary={current_salary}
            />
        </>
    )
}