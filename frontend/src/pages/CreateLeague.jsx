import axios from "axios"
import { useState } from "react"
import SearchResult from '../components/SearchResult'
import Spinner from '../components/Spinner'
import "../css/CreateLeague.css"
import HeaderButton from "../components/HeaderButton"
import { useAuth } from "../contexts/AuthContext"

export default function CreateLeague() {
    const {isVerified, loadingAuth} = useAuth()
    const [formData, setFormData] = useState({
        username: "",
        league_id: "",
    })

    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    // call the api to get all of the leagues
    async function submit_form(e) {
        if (!formData.username && !formData.league_id) return
        setLoading(true)
        setDone(false)
        try {    
            const leagues = await axios.post(
                "/api/leagues/search", formData
            )
            // console.log(leagues.data)
            setResults(leagues.data)
        } catch (err) {
            console.error("Error fetching leagues: ", err.message)
            setResults([])
        } finally {
            setLoading(false)
            if (formData.username || formData.league_id) {
                setDone(true)
            } else {
                // if nothing submitted, don't display error message
                setDone(false)
            }
        }
    }

    function change_form_data(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    function check_enter_press(e) {
        if (e.key === "Enter") {
            submit_form()
        }
    }

    if (loadingAuth) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }
    if (!isVerified) {
        return (
            <>
                <div className="subtitle">Create league</div>
                <div>You must verify your account before creating a league.</div>
            </>
        )
    }
    return (
        <>
        <div className="subtitle">Create league</div>
            <div className="form-container">
                    
                    <div className="input-container">
                        <div className="label">Sleeper username</div>
                        <input type="text" className="text-input" name="username" value={formData.username} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>
                    <div className="input-container">or</div>
                    <div className="input-container">
                        <div className="label">Sleeper league ID</div>
                        <input type="text" className="text-input" name="league_id" value={formData.league_id} onChange={change_form_data} onKeyDown={(e) => check_enter_press(e)}></input>
                    </div>

                    <div className="input-container">
                        <HeaderButton onClick={submit_form}>Search</HeaderButton>
                    </div>


                    <div className="search-results">
                        {loading && (
                            <>
                                <Spinner />
                            <div className="loading">
                                Searching...
                            </div>
                            </>
                        )}

                        {!loading && done && results.length === 0 && (
                            <div className="no-results">No leagues found. Please make sure:
                                <div className="list-container">
                                    <ul className="bulleted-list">
                                        <li>Your Sleeper username or Sleeper league ID was entered correctly</li>
                                        <li>Your league is a dynasty league</li>
                                        {/* <li>Your league's draft type is set to auction</li> */}
                                        <li>Your league's waiver type is set to FAAB</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        {results.map((league) => {
                            return (
                                <SearchResult 
                                    key={league.league_id}
                                    league={league}
                                    name={league.name}
                                    season={(league.season)}
                                    sleeper_league_id={league.league_id}
                                    auction={league.auction}
                                    budget={league.auction_budget}
                                    button_text={"Import"}
                                    to={`/home/import/${league.league_id}`}
                                />
                            )
                        })}
                    </div>
            </div>
        </>
    )
}