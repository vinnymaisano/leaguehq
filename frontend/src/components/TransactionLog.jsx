import axios from "axios"
import "../css/Transaction.css"
import { useEffect, useRef, useState } from "react"
import TransactionCard from "./TransactionCard"
import Spinner from "./Spinner"
import { useParams } from "react-router-dom"

export default function TransactionLog({year}) {
    const {league_id} = useParams()
    const [transactions, setTransactions] = useState([])
    const [hasNext, setHasNext] = useState(true)
    const [cursor, setCursor] = useState("")
    const [teamInfo, setTeamInfo] = useState(null)
    const [rosterMap, setRosterMap] = useState(null)
    const [drafts, setDrafts] = useState(null)

    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const logContainerRef = useRef(null)

    // fetch transactions
    useEffect(() => {
        if (!league_id) return
        // setTransactions([])
        // setCursor("")
        // setHasNext(true)

        fetch_rosters()
        fetch_transactions()
        fetch_drafts()
    }, [])

    async function fetch_rosters() {
        try {
            const url = `/api/leagues/${league_id}/rosters`
            const res = await axios.get(url)

            setTeamInfo(res.data.team_info)

            const player_id_map = Object.fromEntries(
                Object.entries(res.data.roster_player_map).map(([key, players]) => [
                    key,
                    players.map(p => p._id)
                ])
            )
            setRosterMap(player_id_map)
        
        } catch (err) {
            console.error(err.message)
        }
    }

    async function fetch_transactions() {
        if (!hasNext || loading) {
            return
        }

        try {
            setLoading(true)
            const txns_url = `/api/leagues/${league_id}/transactions`
            const txns_res = await axios.get(txns_url, {params: {cursor, limit: 10, year}})

            const newTxns = txns_res.data.transactions
            setTransactions(prev => [...prev, ...newTxns])
            setHasNext(txns_res.data.hasNext)
            setCursor(txns_res.data.nextCursor)

        } catch (err) {
            console.error("Error fetching transactions:", err?.response?.data?.message || err.message)
            setErrorMessage(err?.response?.data?.message || "Error fetching transactions")
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    async function fetch_drafts() {
        try {
            setLoading(true)
            const url = `/api/leagues/${league_id}/drafts`
            const res = await axios.get(url)
            setDrafts(res.data)
        } catch (err) {
            console.error("Error fetching drafts:", err.message)
        } finally {
            setLoading(false)
        }
    }

    // initial: full-page spinner
    if (
        loading && (
        !transactions.length ||
        drafts === null ||
        teamInfo === null ||
        rosterMap === null)
    ) {
        return (
            <div className="spinner-container">
                <Spinner />
            </div>
        )
    }

    if (!loading && errorMessage) {
        return (
            <div className="log-container">Error fetching transactions</div>
        )
    }


    return (
        <div className="log-container" ref={logContainerRef}>

            <div className="txns-scroll">
            {transactions.length && drafts && teamInfo && rosterMap && transactions.map(t => {
                if (t.type === "draft_import" || t.type === "draft_delete") {
                    return <TransactionCard txn={t} teams={teamInfo} roster_map={rosterMap} draft={drafts.find(d => d.draft_id === t.draft_id)}/>
                }
                return <TransactionCard txn={t} teams={teamInfo} roster_map={rosterMap} />
            })}

            <div className="scroll-gap">
                {loading ? (
                    <Spinner />
                ) : hasNext ? (
                    <div className="white-button" onClick={fetch_transactions}>
                        <div>Load more</div>
                    </div>
                ) : (
                    <div>No more transactions.</div>
                )}
            </div>
            </div>

        </div>
    )
}