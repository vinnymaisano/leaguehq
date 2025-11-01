import Row from "../components/Row"
import Card from "../components/Card"
import HeaderButton from "../components/HeaderButton"
import Spinner from "../components/Spinner"
import ConfirmationDialog from "../components/ConfirmationDialog"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa"
import InputInfo from "../components/InputInfo"
import axios from "axios"
import { useLeague } from "../contexts/LeagueContext"
import BackButton from "../components/BackButton"

export default function LeagueRulesPage() {
    const {league_id} = useParams()
    const {league, setLeague, leagueYear} = useLeague()
    const [formData, setFormData] = useState(null)
    const [defaults, setDefaults] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")

    const [showResetDialog, setShowResetDialog] = useState(false)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showSyncDialog, setShowSyncDialog] = useState(false)

    // function for rookie salaries
    function compute_salary(round) {
        if (!league) return 0
        return Math.ceil((league.salary_cap * 0.018) * (1/3) ** (round-1))
    }

    // get the number of rounds in this leagues' draft
    const [numRounds, setNumRounds] = useState()
    useEffect(() => {
        if (!league) return
        setNumRounds(Math.max(...Object.keys(league.rookie_salaries)))
    }, [league])

    async function get_num_rounds() {
        if (!league) return
        try {
            const sleeper_league_id = league.sleeper_league_ids[new Date().getFullYear().toString()]
            const response = await axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}`)
            setNumRounds(response.data.settings?.draft_rounds)
        } catch (err) {
            console.error("Error getting league settings", err.message)
        }
    }

    // fill in form data on page load
    useEffect(()=> {
        if (!numRounds) return
        if (!league) return
        // compute rookie salaries
        const rookie_salaries = {}
        for (let i = 1; i <= numRounds; i++) {
            rookie_salaries[i] = league.rookie_salaries[i] || compute_salary(i)
        }

        // set values in the input boxes
        setFormData({
            ...league,
            rookie_salaries
        })

        // compute rookie salaries
        const default_rookie_salaries = {}
        for (let i = 1; i <= numRounds; i++) {
            // console.log("round", i, "$", compute_salary(i)) 
            default_rookie_salaries[i] = compute_salary(i)
        }
        setDefaults({
            _id: league_id,
            salary_cap: league.salary_cap,
            rookie_contract_length: 3,
            auction_contract_length: 3,
            max_extension_length: 3,
            extension_price_hike: Math.max(1, Math.floor(0.02 * league.salary_cap)),
            rookie_salaries: default_rookie_salaries
        })
    }, [numRounds])

    function change_form_data(e) {
        const {name, value} = e.target
        if (isNaN(value.slice(1))) return

        // console.log({
        //     ...formData,
        //     [name]: value.charAt(0) === "$" ? Number(value.slice(1)): Number(value)
        // })
        setFormData({
            ...formData,
            [name]: value.charAt(0) === "$" ? Number(value.slice(1)): Number(value)
        })
    }

    function change_salary_data(e) {
        const {name, value} = e.target
        // console.log(name, value)
        if (isNaN(value.slice(1))) {
            return
        }

        const round = parseInt(name[5])
        // console.log({
        //     ...formData,
        //     rookie_salaries: {
        //         ...formData.rookie_salaries,
        //         [round]: Number(value.slice(1))
        //     }
        // })
        setFormData(prev => ({
            ...prev,
            rookie_salaries: {
                ...prev.rookie_salaries,
                [round]: Number(value.slice(1))
            }
        }))
    }

    async function save_changes() {
        try {
            const response = await axios.put(
                `/api/${league_id}/update-settings`,
                {formData},
                {withCredentials: true}
            )
            alert("League settings saved.")
            setErrorMessage("")
            setLeague(formData)
        } catch (err) {
            const msg = err.response.data.message || err.message
            alert("Error updating settings:", msg)
            setErrorMessage(msg)
            console.error("Error updating settings:", msg)
            // if (err.response?.data?.error) {
            //     setErrorMessage(err.response.data.error);
            // } else {
            //     setErrorMessage("Unexpected error occurred: ", err.message);
            // }
        }
    }

    function reset_defaults() {
        setFormData(defaults)
    }

    async function update_num_rounds() {
        try {
            const res = await axios.put(`/api/${league_id}/update-rounds`,
                {},
                {withCredentials: true}
            )
            if (res.data.updated) {
                alert(`Number of draft rounds set to ${Object.keys(res.data.salary_map).length}`)
                window.location.reload()
            } else {
                alert("A change in the number of draft rounds was not detected on Sleeper. It may take a few minutes for changes made to Sleeper league settings to reflect.")
            }
        } catch (err) {
            alert(err.response.data.message || err.message)
            console.error("Error updating number of draft rounds:", err.response?.data?.message || err.message)
        }
    }

    if (!formData) return (
        <>
            <div className="spinner-container">
                <Spinner />
            </div>
            <div className="loading">
            Loading league settings...
            </div>
        </>
    )

    function handle_save() {
        save_changes()
        setShowSaveDialog(false)
    }

    function handle_sync() {
        update_num_rounds()
        setShowSyncDialog(false)
    }

    function handle_reset() {
        reset_defaults()
        setShowResetDialog(false)
    }

    return (
        <>
        <div className="mainpanel">
            <Row center={true} height={""}>
                <Card width={"750px"} height={"100%"}>
                    <div className="header-backbutton">
                        <BackButton to={`/league/${league_id}/settings`}/>
                        <span className="subtitle">League settings</span>
                    </div>

                    <div className="league-name">{league?.name}</div>
                            <div className="form-container">            
                                <div className="input-container">
                                    <div className="label">
                                        Salary cap
                                        <InputInfo description="Salary cap for your league. Default value is the budget for your league's initial auction draft.">?</InputInfo>
                                    </div>
                                    <input className="text-input" type="text" name="salary_cap" value={`$${formData.salary_cap}`} onChange={change_form_data}></input>
                                </div>
            
                                <div className="input-container">
                                    <div className="label">
                                        Auction contract length
                                        <InputInfo description="Length of contracts for players drafted via the auction draft. Recommended: 3 years">?</InputInfo>
                                    </div>
                                    <select name="auction_contract_length" value={formData.auction_contract_length} onChange={change_form_data} className="dropdown">
                                        <option value={1}>1 year</option>
                                        <option value={2}>2 years</option>
                                        <option value={3}>3 years</option>
                                        <option value={4}>4 years</option>
                                    </select>
                                </div>
            
                                <div className="input-container">
                                    <div className="label">
                                        Rookie contract length
                                        <InputInfo description="Length of rookie contracts. Recommended: 3 years">?</InputInfo>
                                    </div>
                                    <select name="rookie_contract_length" value={formData.rookie_contract_length} onChange={change_form_data} className="dropdown">
                                        <option value={1}>1 year</option>
                                        <option value={2}>2 years</option>
                                        <option value={3}>3 years</option>
                                        <option value={4}>4 years</option>
                                    </select>
                                </div>
            
                                <div className="input-container">
                                    <div className="label">
                                        Max contract extension length
                                        <InputInfo description="Max number of years a contract can be extended. Recommended: 3 years">?</InputInfo>
                                    </div>
                                    <select name="max_extension_length" value={formData.max_extension_length} onChange={change_form_data} className="dropdown">
                                        <option value={1}>1 year</option>
                                        <option value={2}>2 years</option>
                                        <option value={3}>3 years</option>
                                        <option value={4}>4 years</option>
                                    </select>
                                </div>
            
                                <div className="input-container">
                                    <div className="label">Extension yearly salary increase
                                        <InputInfo description={`Each additional contract year adds this amount to the player's current salary. For example, if this value is $10, then a player with a $30 salary extended 2 years becomes $50. Recommended: $${defaults.extension_price_hike}`}>?</InputInfo>
                                    </div>
                                    <input type="text"  className="text-input" name="extension_price_hike" value={`$${formData.extension_price_hike}`} onChange={change_form_data}></input>
                                </div>
            
                                {numRounds && formData.rookie_salaries &&
                                    Array.from({ length: numRounds }, (_, i) => (
                                        <div key={i} className="input-container">
                                            <div className="label">
                                                Round {i+1} rookie salary
                                                <InputInfo description={`Salary for player drafted in round ${i+1} of rookie drafts. Recommended: $${defaults.rookie_salaries[i+1]}`}>?</InputInfo>
                                            </div>
                                            <input type="text" className="text-input"  name={`round${i+1}`} value={`$${formData.rookie_salaries[i+1]}`} onChange={change_salary_data}></input>
                                        </div>
                                ))}
            
                                <div className="error">
                                    {errorMessage}
                                </div>
            
                                <div className="submit-container">
                                    <HeaderButton onClick={() => setShowSaveDialog(true)} background={true}>Save</HeaderButton>
                                    <HeaderButton onClick={() => setShowSyncDialog(true)} dynamicWidth={true}>Sync Draft Rounds</HeaderButton>
                                    <HeaderButton onClick={() => setShowResetDialog(true)}>Defaults</HeaderButton>
                                </div>

                        </div>
                </Card>
            </Row>
        </div>

        <ConfirmationDialog
            isOpen={showSaveDialog}
            title={"Save changes"}
            message={"Save changes to league rules?"}
            onConfirm={handle_save}
            onCancel={() => setShowSaveDialog(false)}
        />

        <ConfirmationDialog
            isOpen={showSyncDialog}
            title={"Sync draft rounds"}
            message={"Sync number of supplemental (rookie) draft rounds with Sleeper league settings?"}
            onConfirm={handle_sync}
            onCancel={() => setShowSyncDialog(false)}
        />

        <ConfirmationDialog
            isOpen={showResetDialog}
            title={"Reset to defaults"}
            message={"Reset settings to recommend values? Changes will not be saved until the save button is clicked."}
            onConfirm={handle_reset}
            onCancel={() => setShowResetDialog(false)}
        />


        
        </>
    )
}