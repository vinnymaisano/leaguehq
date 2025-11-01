import Card from "../components/Card"
import Row from "../components/Row"
import HeaderButton from "../components/HeaderButton"
import Spinner from "../components/Spinner"
import { Link, useParams } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa"
import { useAuth } from "../contexts/AuthContext"
import {useLeague} from "../contexts/LeagueContext"
import { useEffect, useState } from "react"
import SleeperLeague from "../components/SleeperLeague"
import axios from "axios"
import AddLeagueDialog from "../components/AddLeagueDialog"

export default function PurchaseSubscriptionPage() {
    const {league_id} = useParams()
    const {user, loadingAuth} = useAuth()
    const {league, loadingLeague, subStatus, subHistory} = useLeague()
    // const now = new Date(new Date().getFullYear()+1, 1, 1)
    const now = new Date()

    // After Nov 1st: warn user that subscription is only until the end of the current season
    // New league, has sleeper league id: can just purchase
    // Old league, doesnt have sleeper league id yet: need to get sleeper league id
    const [sleeperLeagues, setSleeperLeagues] = useState([])
    const [currentSeason, setCurrentSeason] = useState(null)
    const [seasonType, setSeasonType] = useState(null)

    const [showDialog, setShowDialog] = useState(false)

    useEffect(() => {
        async function get_state() {
            try {
                const url = "https://api.sleeper.app/v1/state/nfl"
                const res = await axios.get(url)
                setCurrentSeason(Number(res.data.league_season))
                setSeasonType(res.data.season_type)
            } catch (err) {
                console.error("Error getting NFL state from Sleeper:", err.message)
            }
        }
        get_state()
    }, [])

    useEffect(() => {
        if (!league) return
        async function get_sleeper_leagues() {
            try {
                const league_ids = Object.values(league.sleeper_league_ids)
                const responses = await Promise.all(
                    league_ids.map(id => axios.get(`https://api.sleeper.app/v1/league/${id}`))
                )
                const data = responses.map(res => res.data)
                setSleeperLeagues(data.reverse())
            } catch (err) {
                console.error("Error getting Sleeper leagues:", err.message)
            }
        }   
        get_sleeper_leagues()
    }, [league, loadingLeague])

    async function add_league(sleeper_league_id) {
        try {
            const url = `/api/add-sleeper-league`
            const res = await axios.post(url, {league_id, sleeper_league_id}, {withCredentials: true})
            window.location.reload()
        } catch (err) {
            alert(`Error: ${err.response.data.message}`)
        }
    }

    if (loadingLeague) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    return (
        <>
        <div className="mainpanel">
            <Row center={true} height={"100%"}>
                <Card width={"750px"}>
                    <div className="content-gap">

                        <div className="header-backbutton">
                            <BackButton to={`/league/${league_id}/settings`} />
                            <span className="subtitle">Purchase subscription</span>
                        </div>

                        <div>Sleeper gives a new league ID for each year of a dynasty league.</div>

                        {sleeperLeagues.length > 0 && parseInt(sleeperLeagues[0].season) < now.getFullYear() && (
                            <div onClick={() => setShowDialog(true)} className="subscribe-button-container">
                                <div className="subscribe-button">Renew for {now.getFullYear()} season</div>
                            </div>
                        )}

                        <div className="subtitle">League history</div>
                        {/* only leagues that dont have a subscription and are for this year can be purchased */}
                        {sleeperLeagues && sleeperLeagues.map((l, index) => (
                            <SleeperLeague league={l} index={index} can_purchase={!subHistory.map(sub => String(sub.sleeper_league_id)).includes(String(l.league_id)) && parseInt(l.season) === now.getFullYear()}/>
                        ))}

                    </div>
                </Card>
            </Row>
        </div>
        
        <AddLeagueDialog
            title={"Renew league"}
            year={now.getFullYear()}
            confirmText={"Add"}
            isOpen={showDialog}
            onConfirm={add_league}
            onCancel={() => setShowDialog(false)}
        />

    </>
    )
}