import {useState} from "react"
import HeaderButton from "./HeaderButton"
import "../css/ConfirmationDialog.css"
import { createPortal } from "react-dom"
import { useLeague } from "../contexts/LeagueContext"
import Card from "./Card"
import Spinner from "./Spinner"

export default function ExtendContractDialog({isOpen, title, name, onConfirm, onCancel, start_year, current_salary}) {
    if (!isOpen) return null
    const {league} = useLeague()
    const max_length = league.max_extension_length
    const price_hike = league.extension_price_hike
    const [salary, setSalary] = useState(current_salary + price_hike)
    const [length, setLength] = useState(1)
    const [loading, setLoading] = useState(false)

    function update_length(e) {
        const len = parseInt(e.target.value)
        setLength(len)
        setSalary(current_salary + len*price_hike)
    }

    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
                <div className="subtitle">{title}</div>
                <div>{name}</div>
                <div>Current salary: ${current_salary}</div>
                <div className="extension-form-container">
                    <div className="input-container">
                        <div className="label">Contract length</div>
                        <select onChange={update_length} name="length" id="length" className="dropdown">
                            {Array.from({length: max_length}, (_, i) => i+1).map((year)=> (
                                <option key={year} value={year}>
                                    {year} year{year > 1 ? "s" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="salary-years">
                        <div>
                            <div className="contract-label">Salary</div>
                            <input type="text" className="contract-info" value={`$${salary}`} disabled></input>
                        </div>

                        <div>
                            <div className="contract-label">Start year</div>
                            <input type="text" className="contract-info" value={start_year} disabled></input>
                        </div>

                        <div>
                            <div className="contract-label">End year</div>
                            <input type="text" className="contract-info" value={start_year + length - 1} disabled></input>
                        </div>
                      
                    </div>

                    </div>



                <div className="confirm-cancel">
                    {!loading ? (
                        <>
                            <HeaderButton onClick={onCancel}>Cancel</HeaderButton>
                            <HeaderButton onClick={() => {
                                setLoading(true)
                                onConfirm(length)
                                setLoading(false)
                            }} background={true}>
                                Extend
                            </HeaderButton>
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