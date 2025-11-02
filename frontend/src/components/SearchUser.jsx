import HeaderButton from "./HeaderButton"
import Spinner from "./Spinner"
import Card from "./Card"
import { useState } from "react"
import axios from "axios"
import {useLeague} from "../contexts/LeagueContext"
import UserSearchResult from "./UserSearchResult"

export default function SearchUser() {
    const {league} = useLeague()
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [results, setResults] = useState([])
    const [query, setQuery] = useState("")

    // need api route to invite a user
    async function search() {
        // console.log("searching", query)
        // avoid calling the api if no text entered
        if (!query) {
            setResults([])
            return
        }

        setDone(false)

        try {
            setLoading(true)
            const res = await axios.get(`/api/users/search?username=${query}&limit=10`)
            setResults(res.data.results)
        } catch (err) {
            console.error("Error searching users: ", err.response.data.message)
        } finally {
            setLoading(false)
            // only set to true if there was an actual query
            if (query) {
                setDone(true)
            } else {
                setDone(false)
            }
        }
        setLoading(false)
    }

    async function check_submit(e) {
        if (e.key === "Enter") {
            await search()
        }
    }

    return (
        <>
        <div className="form-container">
            <div className="input-container">
                <div className="label">Username</div>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={check_submit}  className="text-input" />
            </div>

            <div style={{width: "350px"}} className="input-container">
                <HeaderButton onClick={search}>Search</HeaderButton>
            </div>
        </div>

        <div className="search-results">
            {loading && query && (
                <>
                <Spinner />
                <div className="loading">
                    Searching...
                </div>
                </>
            )}

            {!loading && done && results.length === 0 && (
                <div>No users found.</div>
            )}

            {done && results.map((user) => (
                <UserSearchResult key={user._id} user={user}></UserSearchResult>
            ))}

        </div>
        </>
    )
}