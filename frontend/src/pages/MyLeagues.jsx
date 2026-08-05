import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Card from "../components/Card"
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
        <Card table maxWidth={"720px"}>
            <div className="table-card-head table-head-title">My leagues</div>
            {loading ? (
                <div className="table-empty"><Spinner /></div>
            ) : leagues && leagues.length > 0 ? (
                leagues.map((league) => (
                    <LeagueCard
                    key={league._id}
                    league={league}
                    button_text="View"
                    />
                ))
                ) : (
                <div className="table-empty">No leagues found.</div>
            )}
        </Card>
    )
}