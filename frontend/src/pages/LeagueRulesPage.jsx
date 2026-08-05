import Row from "../components/Row"
import Card from "../components/Card"
import HeaderButton from "../components/HeaderButton"
import Spinner from "../components/Spinner"
import ConfirmationDialog from "../components/ConfirmationDialog"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import axios from "axios"
import { useLeague } from "../contexts/LeagueContext"
import { league_display_name } from "../utils/utils"
import RenameLeagueButton from "../components/RenameLeagueButton"

export default function LeagueRulesPage() {
    const {league_id} = useParams()
    const {league, setLeague, leagueYear, isOwner, isCommish} = useLeague()
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

        setFormData({
            ...formData,
            [name]: value.charAt(0) === "$" ? Number(value.slice(1)): Number(value)
        })
    }

    function change_salary_data(e) {
        const {name, value} = e.target
        if (isNaN(value.slice(1))) {
            return
        }

        const round = parseInt(name[5])
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
                `/api/leagues/${league_id}/update-settings`,
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
        }
    }

    function reset_defaults() {
        setFormData(defaults)
    }

    async function update_num_rounds() {
        try {
            const res = await axios.put(`/api/leagues/${league_id}/update-rounds`,
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
            <Row height={""}>
                <Card gap={"var(--space-4)"}>
                    <span className="subtitle">League settings</span>
                    <div className="settings-name-row">
                                <div>
                                    <div className="league-name">{league_display_name(league)}</div>
                                    <div className="text-muted">Sleeper: {league?.name}</div>
                                </div>
                                {(isOwner || isCommish) && (
                                    <RenameLeagueButton
                                        league={league}
                                        onRenamed={(name) => setLeague({ ...league, custom_name: name })}
                                    />
                                )}
                            </div>
                            <div className="form-container settings-form">
                                <div className="setting-field">
                                    <div className="setting-field-head">Salary cap</div>
                                    <div className="setting-field-desc">Salary cap for your league. Default value is the budget for your league's initial auction draft.</div>
                                    <input className="text-input" type="text" name="salary_cap" value={`$${formData.salary_cap}`} onChange={change_form_data}></input>
                                </div>

                                <div className="setting-field">
                                    <div className="setting-field-head">Auction contract length</div>
                                    <div className="setting-field-desc">Length of contracts for players drafted via the auction draft. Recommended: 3 years.</div>
                                    <select name="auction_contract_length" value={formData.auction_contract_length} onChange={change_form_data} className="dropdown">
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
                                    </select>
                                </div>

                                <div className="setting-field">
                                    <div className="setting-field-head">Rookie contract length</div>
                                    <div className="setting-field-desc">Length of rookie contracts. Recommended: 3 years.</div>
                                    <select name="rookie_contract_length" value={formData.rookie_contract_length} onChange={change_form_data} className="dropdown">
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
                                    </select>
                                </div>

                                <div className="setting-field">
                                    <div className="setting-field-head">Max contract extension length</div>
                                    <div className="setting-field-desc">Max number of years a contract can be extended. Recommended: 3 years.</div>
                                    <select name="max_extension_length" value={formData.max_extension_length} onChange={change_form_data} className="dropdown">
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
                                    </select>
                                </div>

                                <div className="setting-field">
                                    <div className="setting-field-head">Extension yearly salary increase</div>
                                    <div className="setting-field-desc">Each additional contract year adds this amount to the player's current salary. For example, if this value is $10, a player with a $30 salary extended 2 years becomes $50. Recommended: ${defaults.extension_price_hike}.</div>
                                    <input type="text"  className="text-input" name="extension_price_hike" value={`$${formData.extension_price_hike}`} onChange={change_form_data}></input>
                                </div>

                                {numRounds && formData.rookie_salaries &&
                                    Array.from({ length: numRounds }, (_, i) => (
                                        <div key={i} className="setting-field">
                                            <div className="setting-field-head">Round {i+1} rookie salary</div>
                                            <div className="setting-field-desc">Salary for a player drafted in round {i+1} of rookie drafts. Recommended: ${defaults.rookie_salaries[i+1]}.</div>
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