import '../css/LeagueSetup.css'
import { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate, Navigate} from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import InputInfo from '../components/InputInfo'
import axios from "axios"
import HeaderButton from '../components/HeaderButton'
import Spinner from "../components/Spinner"

export default function LeagueSetup() {
    const navigate = useNavigate()
    const {league_id} = useParams() // get league id from the route param

    const [loading, setLoading] = useState(false)

    // fill out the form data with default values
    const [formData, setFormData] = useState(null)
    const [defaults, setDefaults] = useState(null)

    // error message if form submission throws an error
    const [errorMessage, setErrorMessage] = useState("")
    const [fail, setFail] = useState(false)
    
    // get the state passed from the SearchResult component
    const location = useLocation()
    if (!location.state) return <Navigate to="/home" replace />;
    const {name, budget} = location.state

    // get the number of rounds in this leagues' draft
    const [numRounds, setNumRounds] = useState()
    useEffect(() => {
        async function get_settings(retries=3) {
            try {
                const response = await axios.get(`https://api.sleeper.app/v1/league/${league_id}`)
                setNumRounds(response.data.settings?.draft_rounds)
            } catch (err) {
                console.error("Error getting league settings", err.message)
                if (retries > 0) {
                    await new Promise((res) => setTimeout(res, 1000))
                    return get_settings(retries-1)
                } else {
                    console.error("Failed to get settings after 3 retries")
                    setFail(true)
                }
            }
        }
        get_settings()
    }, [])

    // fill in form data on page load
    useEffect(()=> {
        if (!numRounds) return

        // function for rookie salaries
        function compute_salary(round) {
            return Math.ceil((budget * 0.018) * (1/3) ** (round-1))
        }
    
        // compute rookie salaries
        const rookie_salaries = {}
        for (let i = 1; i <= numRounds; i++) {
            rookie_salaries[i] = compute_salary(i)
        }

        // set values in the input boxes
        setFormData({
            sleeper_league_id: league_id,
            salary_cap: budget,
            rookie_contract_length: 3,
            auction_contract_length: 3,
            max_extension_length: 3,
            extension_price_hike: Math.max(1, Math.floor(0.02 * budget)),
            rookie_salaries
        })
        // save defaults so they can be reset
        setDefaults({
            sleeper_league_id: league_id,
            salary_cap: budget,
            rookie_contract_length: 3,
            auction_contract_length: 3,
            max_extension_length: 3,
            extension_price_hike: Math.max(1, Math.floor(0.02 * budget)),
            rookie_salaries
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

    async function submit_form(e) {
        e.preventDefault()
        try {
            setLoading(true)
            // creates the league
            const response = await axios.post("/api/setup", formData, {
                withCredentials: true
            })
            setErrorMessage("")
            // no error thrown: league created successfully, can redirect
            const league_obj_id = response.data.league._id
            navigate(`/league/${league_obj_id}`)
        } catch (err) {
            console.error("Error submitting form: ", err)
            if (err.response?.data?.error) {
                setErrorMessage(err.response.data.error);
            } else {
                setErrorMessage("Unexpected error occurred: ", err.message);
            }
        } finally {
            setLoading(false)
        }
    }

    function reset_defaults() {
        setFormData(defaults)
    }

    if (fail) return (
        <div>Could not load league settings. Please try again</div>
    )
    
    if (!formData) return  (
        <>
            <div className="spinner-container">
                <Spinner />
            </div>
            <div className="loading">
            Loading league settings...
            </div>
        </>
    )

    return (
        <>
            <div className="subtitle">League setup</div>
            <div className="league-name">{name}</div>
            <div>Sleeper League ID: {league_id}</div>
            <div className="form-container">
                    <form onSubmit={submit_form}>
                    
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
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
                        </select>
                    </div>

                    <div className="input-container">
                        <div className="label">
                            Rookie contract length
                            <InputInfo description="Length of rookie contracts. Recommended: 3 years">?</InputInfo>
                        </div>
                        <select name="rookie_contract_length" value={formData.rookie_contract_length} onChange={change_form_data} className="dropdown">
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
                        </select>
                    </div>

                    <div className="input-container">
                        <div className="label">
                            Max contract extension length
                            <InputInfo description="Max number of years a contract can be extended. Recommended: 3 years">?</InputInfo>
                        </div>
                        <select name="max_extension_length" value={formData.max_extension_length} onChange={change_form_data} className="dropdown">
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y === 1 ? "1 year" : `${y} years`}</option>)}
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
                        {! loading ? (
                            <>
                            <input className="header-button with-background" type="submit" value="Create"></input>
                            <HeaderButton onClick={reset_defaults}>Reset</HeaderButton>
                            </>
                        ):(
                            <Spinner />
                        )}
                    </div>

                    </form>
            </div>    
        </>
   )
}