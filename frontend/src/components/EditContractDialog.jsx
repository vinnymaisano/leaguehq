import {useState} from "react"
import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import { createPortal } from "react-dom"
import { useLeague } from "../contexts/LeagueContext"
import Card from "./Card"
import Spinner from "./Spinner"
import "../css/EditContract.css"
import ConfirmationDialog from "./ConfirmationDialog"

export default function EditContractDialog({isOpen, name, title, player_id, onConfirm, onCancel, onDelete, contracts}) {
    // console.log(contracts)
    if (!isOpen) return null
    // console.log(contracts)
    const {league} = useLeague()
    const [loading, setLoading] = useState(false)
    const [editedContracts, setEditedContracts] = useState(()=>
        contracts.map(contract => ({...contract}))
    )
    const [newContract, setNewContract] = useState({
        contract_type: "created",
        draft_id: "0",
        start_year: new Date().getFullYear(),
        end_year: new Date().getFullYear(),
        salary: 1,
        player_id,
        extension_eligible: true,
        league_id: league._id
    })

    const [contractToDelete, setContractToDelete] = useState(null)
    
    function edit_contract_length(index, new_length) {
        setEditedContracts(prev => {
            const updated = [...prev]
            const contract = {...updated[index]}
            contract.end_year = contract.start_year + Number(new_length) - 1
            updated[index] = contract
            if (updated.length > index+1) {
                const next_contract = {...updated[index+1]}
                const next_length = next_contract.end_year - next_contract.start_year + 1
                next_contract.start_year = contract.end_year + 1
                next_contract.end_year = next_contract.start_year + next_length - 1
                updated[index+1] = next_contract
            }
            return updated
        })
    }

    function edit_contract_salary(index, new_salary) {
        if (isNaN(new_salary.slice(1))) return
        const salary = Number(new_salary.slice(1))

        setEditedContracts(prev => {
            const updated = [...prev]
            const contract = {...updated[index]}
            contract.salary = salary
            updated[index] = contract
            return updated
        })
    }

    function edit_new_contract(e) {
        setNewContract(prev => {
            if (e.target.name === "extension_eligible") {
                // console.log({
                //     ...prev,
                //     extension_eligible: Boolean(parseInt(e.target.value))
                // })
                return {
                    ...prev,
                    extension_eligible: Boolean(parseInt(e.target.value))
                }
            }
            if (e.target.name === "length") {
                // console.log({
                //     ...prev,
                //     end_year: parseInt(prev.start_year) + parseInt(e.target.value) - 1
                // })
                return {
                    ...prev,
                    end_year: parseInt(prev.start_year) + parseInt(e.target.value) - 1
                }
            }
            // console.log({
            //     ...prev,
            //     [e.target.name]: e.target.value
            // })
            return {
                ...prev,
                [e.target.name]: e.target.value
            }
        })
    }

    async function check_submit(e) {
        if (e.key === "Enter") {
            setLoading(true)
            await onConfirm(contracts.length === 0 ? newContract : editedContracts);
            setLoading(false)
        }
    }

    function capitalize(input) {
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
    }

    return createPortal(
    <>
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{contracts.length !== 0 ? title : "Create new contract"}</div>
                    {editedContracts && editedContracts.map((contract, i)=> (
                        <div key={i}>
                        <div>
                            <div>{contract.contract_type !== "created" ? capitalize(contract.contract_type) : "Manually created"} contract</div>
                            <div>Created: {new Date(contract.createdAt).toLocaleString()}</div>
                        </div>
                        
                        <div className="extension-form-container">
                            <div className="input-container">
                                <div className="label">Contract length</div>
                                <select
                                    onChange={e => edit_contract_length(i, e.target.value)}
                                    value={contract.end_year - contract.start_year + 1}
                                    name="length" id="length" className="dropdown">
                                    <option value={1}>1 year</option>
                                    <option value={2}>2 years</option>
                                    <option value={3}>3 years</option>
                                    <option value={4}>4 years</option>
                                </select>
                            </div>

                            <div className="salary-years">
                                <div>
                                    <div className="contract-label">Salary</div>
                                    <input value={`$${contract.salary}`} onChange={e => edit_contract_salary(i, e.target.value)} onKeyDown={(e) => check_submit(e)} type="text" className="contract-info"></input>
                                </div>

                                <div>
                                    <div className="contract-label">Start year</div>
                                    <input value={contract.start_year} type="text" className="contract-info" disabled></input>
                                </div>

                                <div>
                                    <div className="contract-label">End year</div>
                                    <input value={contract.end_year} type="text" className="contract-info" disabled></input>
                                </div>
                            
                            </div>


                            <div style={{width: "100%"}}>
                                <span onClick={() => setContractToDelete(i)} className="link">Delete contract</span>
                            </div>
                        </div>
                    </div>
                    )
                )}

                {contracts.length === 0 && (
                    <>
                    <div>{name}</div>
                        <div className="extension-form-container">
                            <div className="input-container">
                                <div className="label">Contract length</div>
                                <select 
                                    onChange={e => edit_new_contract(e)}
                                    value={newContract.end_year - newContract.start_year + 1}
                                    name="length" id="length" className="dropdown">
                                    <option value={1}>1 year</option>
                                    <option value={2}>2 years</option>
                                    <option value={3}>3 years</option>
                                    <option value={4}>4 years</option>
                                </select>
                            </div>

                            <div className="salary-years">
                                <div>
                                    <div className="contract-label">Salary</div>
                                    <input value={newContract.salary} onChange={e => edit_new_contract(e)} name="salary" type="number" className="contract-info"></input>
                                </div>

                                <div>
                                    <div className="contract-label">Start year</div>
                                    <input value={newContract.start_year} onChange={e => edit_new_contract(e)} name="start_year" type="text" className="contract-info" disabled></input>
                                </div>

                                <div>
                                    <div className="contract-label">End year</div>
                                    <input value={newContract.end_year} onChange={e => edit_new_contract(e)} name="end_year" type="text" className="contract-info" disabled></input>
                                </div>
                            </div>

                            <div className="salary-years">
                                <div>
                                    <div className="contract-label">Eligible for extension</div>                                
                                    <select                                
                                        onChange={e => edit_new_contract(e)}
                                        value={newContract.extension_eligible ? 1 : 0 }
                                        name="extension_eligible" className="contract-info">
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div>
                    {!loading ? (
                        <div className="confirm-cancel">
                            <HeaderButton onClick={onCancel}>Cancel</HeaderButton>
                            <HeaderButton
                              onClick={async () => {
                                setLoading(true);
                                await onConfirm(contracts.length === 0 ? newContract : editedContracts);
                                setLoading(false);
                            }}
                            background={true}>
                                {contracts.length === 0 ? "Create" : "Save"}
                            </HeaderButton>
                        </div>
                    ) : (
                        <Spinner />
                    )}

                </div>
            </div>
        </div>
        
        {contractToDelete !== null && (
            <ConfirmationDialog
                isOpen={true}
                title="Delete contract?"
                message="Are you sure you want to delete this contract? If this contract has been extended, its extension will also be deleted."
                onConfirm={() => {
                    onDelete(contracts[contractToDelete]._id)
                    setContractToDelete(null)
                }}
                onCancel={() => setContractToDelete(null)}
            />
        )}

    </>,
        document.body
    )

}