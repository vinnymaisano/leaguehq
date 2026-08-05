import { useParams } from "react-router-dom"
import Card from "../components/Card"
import DraftCard from "../components/DraftCard"
import { useLeague } from '../contexts/LeagueContext'
import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import Spinner from "../components/Spinner"
import "../css/ImportDraftPage.css"

export default function ImportDraftPage() {
    const {league, loadingLeague, subStatus} = useLeague()
    const {league_id} = useParams()
    
    const [drafts, setDrafts] = useState([])

    useEffect(()=> {
        if (!league) return
        async function get_drafts() {
            try {
                const response = await axios.get(`/api/leagues/${league_id}/drafts`)
                setDrafts(response.data)
            } catch (err) {
            }
        }
        get_drafts()
    }, [league])

    return (
        <div className="mainpanel">
            <Card gap={"var(--space-4)"}>
                <span className="subtitle">Import contracts</span>
                {loadingLeague ? (
                    <div className="spinner-container">
                        <Spinner />
                    </div>
                ) : (
                    <>
                        <div className="league-name">{league? `Drafts from ${league.name}`: ""}</div>
                        {!subStatus && <div>Subscription required to import or delete a draft</div>}
                        <div className="draft-container">
                            {drafts.length > 0 && drafts.map(draft => (
                                <DraftCard key={draft.draft_id} draft={draft} subbed={subStatus}/>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}