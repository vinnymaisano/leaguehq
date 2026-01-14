import "../css/Standings.css"
import { useEffect, useState } from "react"
import {useLeague} from "../contexts/LeagueContext"
import Spinner from "./Spinner"
import Team from "./Team"
import axios from "axios"
import Card from "./Card"

export default function Standings({selectedYear, changeYear}) {
    const {league} = useLeague()
    const [standings, setStandings] = useState(null)
    const [years, setYears] = useState([])
    // const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [divisions, setDivisions] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    function change_year(year) {
        // setSelectedYear(year)
        changeYear(year)
        setDivisions(standings[year])
    }

    useEffect(() => {
        if (!league) return
        async function get_standings() {
            try {
                setLoading(true)
                const url = `/api/leagues/${league._id}/standings`
                const {data} = await axios.get(url)
                setStandings(data.standings_map)
                const years_arr = Object.keys(data.standings_map).reverse()
                setYears(years_arr)
                // setSelectedYear(years_arr[0])
                setDivisions(data.standings_map[years_arr[0]])
            } catch (err) {
                console.error("Error getting league standings:", err.response.data.message)
                setErrorMessage(err.response.data.message)
            } finally {
                setLoading(false)
            }
        }
        get_standings()
    }, [league])

    if (loading) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    if (!loading && errorMessage) {
        return (
            <div className="log-container">Error fetching league standings</div>
        )
    }

    return (
        <>
            <div className="standings">
                <div>
                    <select value={selectedYear} onChange={(e) => change_year(e.target.value)} className="standings-year">
                        {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="scroll standings">
                {divisions && divisions.map(d => (
                    <div key={d.division_number} className="division">
                        
                            {d.division_name && <span className="division-name">{d.division_name}</span>}
                            
                            {d.teams.map((t, i) => (
                                <Team key={t.roster_id} team={t} rank={i+1}/>
                            ))}
                    </div>
                ))}
                </div>
            </div>
        </>
    )
}