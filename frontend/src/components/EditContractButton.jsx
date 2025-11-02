import { FaEdit } from "react-icons/fa"
import { useState } from "react"
import EditContractDialog from "./EditContractDialog"
import axios from "axios"
import { useParams } from "react-router-dom"

export default function EditContractButton({contracts, name, player_id}) {
    const [showDialog, setShowDialog] = useState(false)
    const {league_id} = useParams()

    async function edit_contracts(new_contracts) {
        if (contracts.length > 0) {
            try {
                const res = await axios.post(
                    `/api/${league_id}/contracts/edit`,
                    {new_contracts},
                    {withCredentials: true}
                )
                setShowDialog(false)
                // console.log("changes:", res.data.changes)
                if (res.data.changes) window.location.reload()
            } catch (err) {
                console.error("Error updating contracts: ", err.response.data.message)
            }
        }
    }

    async function create_contract(new_contract) {
        const timestamp = new Date()
        try {
            const res = await axios.post(
                "/api/contracts/create",
                {
                    ...new_contract,
                    txn_time: timestamp,
                    import_time: timestamp,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }
            )
            setShowDialog(false)
            window.location.reload()
        } catch (err) {
            console.error("Error creating contract: ", err.response.data.message)
        }
    }

    async function delete_contract(contract_id) {
        try {
            const res = await axios.delete(`/api/contracts/delete/${contract_id}`)
            setShowDialog(false)
            window.location.reload()
        } catch (err) {
            console.error("Error deleting contracts:", err.response?.data?.message || err.message)
        }
    }

    return (
        <>
        <div onClick={() => setShowDialog(true)}>
            <FaEdit className="extend-button"/>
        </div>

        <EditContractDialog 
            isOpen={showDialog}
            onCancel={() => setShowDialog(false)}
            onConfirm={contracts.length === 0 ? create_contract : edit_contracts}
            onDelete={delete_contract}
            title={`Edit ${name} contracts`}
            name={name}
            contracts={contracts}
            player_id={player_id}
        />
        </>
    )
}