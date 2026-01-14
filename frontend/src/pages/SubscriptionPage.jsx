import axios from "axios"
import { Link, useParams } from "react-router-dom"
import Row from "../components/Row"
import Card from "../components/Card"
import SubCard from "../components/SubCard"
import { FaAngleLeft } from "react-icons/fa"
import { useLeague } from "../contexts/LeagueContext"
import Spinner from "../components/Spinner"
import { useEffect, useState } from "react"
import "../css/SubscriptionPage.css"
import BackButton from "../components/BackButton"

export default function SubscriptionPage() {
    const {league_id} = useParams()
    const {league, leagueYear, loadingLeague, subStatus, subHistory} = useLeague()
    const [currentSeason, setCurrentSeason] = useState(0)
    const [loading, setLoading] = useState(false)
    const new_year = new Date().getFullYear() > leagueYear

    const date_format = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }

    const formatDateTime = (date) => {
        const d = new Date(date)
        const dateStr = d.toLocaleDateString("en-US")
        const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
        return `${dateStr} at ${timeStr}`
    }

    useEffect(() => {
        async function get_nfl_state() {
            try {
                setLoading(true)
                const url = "https://api.sleeper.app/v1/state/nfl"
                const res = await axios.get(url)
                setCurrentSeason(parseInt(res.data.season))
            } catch (err) {
                console.error("Error getting current NFL state from Sleeper: ", err.message)
            } finally {
                setLoading(false)
            }
        }
        get_nfl_state()
    }, [league])

    if (loading || loadingLeague) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    // year of the most latest subscription purchased
    const latestSubscription = subHistory?.length ? subHistory[0].season : -1
    const now = new Date()

    let status = ""
    // subscribed for this season
    if (subStatus && latestSubscription >= currentSeason) {
        status = "Active"
    }
    // not subscribed, free trial expired 
    else if (!subStatus && now > new Date(league.free_trial_end)) {
        status = "Inactive"
    } 
    // not subscribed, free trial still active
    else {
        status = "Free trial"
    }
    // for styling
    const statusClasses = {
        "Active": "active-sub",
        "Free trial": "free-trial",
        "Inactive": "inactive-sub"
    }
    const status_classname = statusClasses[status]

    if (loading) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="mainpanel">
            <Row center={true} height={"100%"}>
                <Card width={"750px"} height={"100%"}>
                    <div className="content-gap">
                        <div>
                            <div className="header-backbutton">
                                <BackButton to={`/league/${league_id}/settings`} />
                                <span className="subtitle">Subscription</span>
                            </div>
                        </div>
                            
                        <Card>
                            <div className="league-name sub-status-container">Subscription status: <span className={`sub-status ${status_classname}`}></span>{status}</div>
                            {status == "Active" && `${latestSubscription} season subscription end date: ${(new Date(latestSubscription+1, 2, 1)).toLocaleString("en-US", date_format)}`}
                            {status == "Free trial" && `Free trial expiration: ${formatDateTime(new Date(league.free_trial_end))}`}
                        </Card>
                        
                        <div className="text-gap">
                            {(subHistory?.length === 0 || latestSubscription < currentSeason) && (
                                <Link to={`/league/${league_id}/settings/purchase-subscription`}>
                                <div className="subscribe-button-container">
                                    <div className="subscribe-button">Subscribe for {currentSeason} season</div>
                                </div>
                                </Link>
                            )}

                            <div className="subtitle">Subscription history</div>
                            <div>Subscriptions are purchased by Sleeper league ID. Sleeper gives a new league ID for each year of a dynasty league.</div>
                            
                            {subHistory?.length ? (
                                <div className="content-gap">
                                    {subHistory.map(sub => (
                                        <SubCard key={sub.sleeper_league_id} sub={sub}></SubCard>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <div>No subscription history for this Sleeper league.</div>
                                </Card>
                            )}

                        </div>
                    </div>
                </Card>
            </Row>
        </div>
    )
}