import { useLeague } from "../contexts/LeagueContext"
import { Navigate, useParams } from "react-router-dom"

export default function OwnerRoute({children}) {
    const {isOwner, loadingLeague} = useLeague()
    const {league_id} = useParams()
    
    if (loadingLeague) {
        return null
    }

    // redirect non-owners
    if (!isOwner) {
        return <Navigate to="/home" />
    }

    return children
}