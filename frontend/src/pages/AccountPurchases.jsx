import axios from "axios"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import SubCard from "../components/SubCard"

export default function AccountPurchases() {
    const {user, loadingAuth} = useAuth()
    const [purchases, setPurchases] = useState([])

    useEffect(() => {
        if (loadingAuth) return
        async function get_account_purchases() {
            try {
                const url = `/api/users/sub-history?user_id=${user._id}`
                const res = await axios.get(url)
                setPurchases(res.data.sub_history)
            } catch (err) {
                console.error("Error getting purchases history:", err.response?.data?.message || err.message)
            }
        }
        get_account_purchases()
    }, [user])

    return (
        <div className="content-gap">
            <div className="subtitle">Purchases</div>
            {purchases.length === 0 && <div>No purchase history.</div>}
            {purchases.map(p => (
                <SubCard sub={p}/>
            ))}
        </div>
    )
}