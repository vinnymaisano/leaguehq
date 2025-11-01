import { Navigate, Outlet, useLocation, useParams } from "react-router-dom"
import { useLeague } from "../contexts/LeagueContext"
import Spinner from "./Spinner"

export default function RequireSubscription({children}) {
    const {league, loadingLeague, subStatus, subHistory} = useLeague()
    const {league_id} = useParams()
    const location = useLocation()

    // spinner while league data is loading
    if (loadingLeague) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    // always allow access to subscription routes (if logged in since these are protected routes)
    if (
        location.pathname.includes("settings")
        // location.pathname.includes("/settings/subscription") ||
        // location.pathname.includes("/settings/purchase-subscription")
    ) {
        return children
    }
    
    // free trial: allow free navigation
    if (subStatus && subHistory.length === 0) {
        return children
    }

    // subscription or free trial expired: redirect
    if (!subStatus) {
        return (
            <Navigate
                to={`/league/${league_id}/settings/subscription`}
                state={{from: location}}
                replace
            />
        )
    }

    // otherwise, render children
    return children
}