import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import "../css/ExtendContract.css"
import ExtendContractDialog from "./ExtendContractDialog";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function ExtendButton({current_salary, start_year, name, current_contract}) {
    // toggle whether the dialog is showing
    const {league_id} = useParams()
    const [showDialog, setShowDialog] = useState(false)

    async function handle_confirm(length) {
        // console.log("Handling confirm with length", length)
        // console.log("Contract being extended: ", current_contract)
        if (!current_contract) {
            alert("Error: player does not have a contract to extend.")
            setShowDialog(false)
            return
        }
        try {
            const url = `/api/${league_id}/contracts/extend/${current_contract._id}`
            console.log(url)
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
            <div onClick={() => setShowDialog(true)}>
                <FaPlus className="extend-button"/>
            </div>

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