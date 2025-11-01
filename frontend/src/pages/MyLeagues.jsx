import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import LeagueCard from "../components/LeagueCard"
import Spinner from "../components/Spinner"
import axios from "axios"

export default function MyLeagues() {
    const {user} = useAuth()
    const [leagues, setLeagues] = useState(null)
    const [loading, setLoading] = useState(true)

    // need backend route that takes League object id and gets name from sleeper API
    useEffect(()=> {
        async function fetch_leagues() {
            if (user.leagues.length > 0) {
                try {   
                    const response = await axios.post(
                        "/api/leagues",
                        {league_ids: user.leagues}
                    )
                    setLeagues(response.data.leagues)
                } catch (err) {
                    console.error("Error getting user's leagues: ", err.response.data.message)
                }
            }
            setLoading(false)
        }
        fetch_leagues()
    }, [])

    return (
        <>
            {/* <div className="subtitle">Welcome, {user.username}</div> */}
            <div className="subtitle">My leagues</div>
            <div className="search-results">
            {loading ? (
                <Spinner />
            ) : leagues && leagues.length > 0 ? (
                leagues.map((league) => (
                    <LeagueCard
                    key={league._id}
                    league={league}
                    button_text="View"
                    />
                ))
                ) : (
                <div>No leagues found.</div>
            )}

            </div>
        </>
    )
}