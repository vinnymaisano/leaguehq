import Card from "./Card"
import HeaderButton from "./HeaderButton"
import Spinner from "./Spinner"
import axios from "axios"
import { useState } from "react"
import { useParams } from "react-router-dom"
import ConfirmationDialog from "./ConfirmationDialog"
import ImportDialog from "./ImportDialog"

export default function DraftCard({draft, subbed}) {
    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
    const complete = draft.status === "complete"
    const color = complete ? "rgb(0, 125, 0)" : "rgb(150, 0, 0)" 
    const {league_id} = useParams()
    const [loading, setLoading] = useState(false)
    const [imported, setImported] = useState(draft.imported)

    const [showImport, setShowImport] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [overwrite, setOverwrite] = useState(false)
    const action = imported ? delete_draft : import_draft

    async function import_draft() {
        try {
            setLoading(true)
            const url = `/api/${league_id}/drafts/${draft.draft_id}/import`
            // console.log(url)
            const res = await axios.get(url, {params: {overwrite}, withCredentials: true})
            alert(res.data.message)
            setImported(true)
        } catch (err) {
            alert(err.response?.data?.message || err.message)
            console.error("Error importing draft: ", err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    async function delete_draft() {
        try {
            setLoading(true)
            const res = await axios.delete(`/api/${league_id}/drafts/${draft.draft_id}/delete`)
            alert(res.data.message)
            setImported(false)
        } catch (err) {
            console.error("Error deleting draft: ", err)
        } finally {
            setLoading(false)
        }

    }


    function handle_import() {
        setShowImport(false)
        action()
    }

    function handle_delete() {
        setShowDelete(false)
        action()
    }

    return (
        <>
        <div className="draft-card">
        <Card width={"100%"}>
            <div className="league-name">
                {draft.rookie_draft ? (
                    `${draft.season} rookie draft` 
                ) : (
                    `${draft.season} ${draft.veteran_draft ? "veteran" : ""} ${draft.type} draft`
                )}
            </div>
            <div>Sleeper Draft ID: {draft.draft_id}</div>
            {draft.start_time && <div>Started: {new Date(draft.start_time).toLocaleString()}</div>}
            {draft.rookie_draft && <div>Draft type: {capitalize(draft.type)}</div>}
            {draft.budget != -1 && <div>Draft budget: ${draft.budget}</div>}
            <div>Draft status: <span style={{color}}>{capitalize(draft.status.replace("_", "-"))}</span></div>
            <div className="bottom-container">
                <span>{imported ? (<span><span className={`sub-status active-sub`}></span> Imported</span>) : (<span><span className="sub-status inactive-sub"></span> Not imported</span>)}</span>
                <span>
                    {!subbed ? (
                        <div></div>
                    ) : (
                        loading ? (
                        <div className="spinner-container">
                            <Spinner/>
                        </div>
                        )
                    : (complete && ( imported ? (
                        <HeaderButton
                            background={false}
                            onClick={() => setShowDelete(true)}
                        >
                            {"Delete"}
                        </HeaderButton> ) : (
                            
                        <HeaderButton
                            background={true}
                            onClick={() => setShowImport(true)}
                        >
                            {"Import"}
                        </HeaderButton>
                        )
                        ))
                    )}
                    {/* {loading ? (
                        <div className="spinner-container">
                            <Spinner/>
                        </div>
                        )
                    : (complete && ( imported ? (
                        <HeaderButton
                            background={false}
                            onClick={() => setShowDelete(true)}
                        >
                            {"Delete"}
                        </HeaderButton> ) : (
                            
                        <HeaderButton
                            background={true}
                            onClick={() => setShowImport(true)}
                        >
                            {"Import"}
                        </HeaderButton>
                        )
                        ))
                    } */}
                    
                </span>
            </div>
        </Card>
        </div>

        <ImportDialog
            isOpen={showImport}
            title={"Import contracts"}
            message={"Import the contracts from this draft?"}
            onConfirm={handle_import}
            onCancel={() => setShowImport(false)}
            overwrite={overwrite}
            setOverwrite={setOverwrite}
        />

        <ConfirmationDialog
            isOpen={showDelete}
            title={"Delete contracts"}
            message={"Delete the contracts from this draft? Any extensions of these contracts will also be deleted."}
            onConfirm={handle_delete}
            onCancel={() => setShowDelete(false)}
        />
    </>
    )
}