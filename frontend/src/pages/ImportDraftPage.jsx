import { useParams } from "react-router-dom"
import Row from "../components/Row"
import Card from "../components/Card"
import DraftCard from "../components/DraftCard"
import { useLeague } from '../contexts/LeagueContext'
import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa"
import Spinner from "../components/Spinner"
import "../css/ImportDraftPage.css"
import BackButton from "../components/BackButton"

export default function ImportDraftPage() {
    const {league, loadingLeague, subStatus} = useLeague()
    const {league_id} = useParams()
    
    const [drafts, setDrafts] = useState([])

    useEffect(()=> {
        if (!league) return
        async function get_drafts() {
            try {
                const response = await axios.get(`/api/${league_id}/drafts`)
                setDrafts(response.data)
            } catch (err) {
            }
        }
        get_drafts()
    }, [league])

    return (
        <div className="mainpanel">
            <Row center={true} height={"100%"}>
                <Card width={"750px"} height={"100%"}>
                    {loadingLeague && (
                        <div className="spinner-container">
                            <Spinner />
                        </div>
                    )
                    }
                    <div className="header-backbutton">
                        <BackButton to={`/league/${league_id}/settings`} />
                        <span className="subtitle">Import contracts</span>
                    </div>
         
                    <div className="league-name">{league? `Drafts from ${league.name}`: ""}</div>
                    <div className="draft-container">
                        {drafts.length > 0 && drafts.map(draft => (
                            <DraftCard key={draft.draft_id} draft={draft} subbed={subStatus}/>
                            )
                        )}
                    </div>
                    
                </Card>
            </Row>
        </div>
    )
}