import axios from "axios"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Card from "../components/Card"
import SubCard from "../components/SubCard"
import Spinner from "../components/Spinner"

export default function AccountPurchases() {
    const {user, loadingAuth} = useAuth()
    const [loading, setLoading] = useState(true)
    const [purchases, setPurchases] = useState([])

    useEffect(() => {
        if (loadingAuth) return
        async function get_account_purchases() {
            try {
                setLoading(true)
                const url = `/api/users/sub-history?user_id=${user._id}`
                const res = await axios.get(url)
                setPurchases(res.data.sub_history)
            } catch (err) {
                console.error("Error getting purchases history:", err.response?.data?.message || err.message)
            } finally {
                setLoading(false)
            }
        }
        get_account_purchases()
    }, [user])

    return (
        <Card table maxWidth={"720px"}>
            <div className="table-card-head table-head-title">Purchases</div>
            {loading ? (
                <div className="table-empty">
                    <Spinner />
                </div>
            ) : purchases.length === 0 ? (
                <div className="table-empty">No purchase history.</div>
            ) : (
                purchases.map(p => (
                    <SubCard key={p._id} sub={p}/>
                ))
            )}
        </Card>
    )
}