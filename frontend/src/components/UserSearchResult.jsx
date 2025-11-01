import { useLeague } from "../contexts/LeagueContext";
import Card from "./Card"
import HeaderButton from "./HeaderButton";
import Spinner   from "./Spinner";
import axios from "axios";
import { useState } from "react";

export default function UserSearchResult({user}) {
    const {league} = useLeague()
    const [loading, setLoading] = useState(false)

    async function add_user() {
        try {
            setLoading(true)
            const res = await axios.post(
                `/api/leagues/${league._id}/users`,
                {user_id: user._id}
            )
            window.location.reload()
        } catch (err) {
            console.error("Error adding user to league: ", err.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card width={"100%"}>
            <div className="space-between">
                <div className="username">
                    {user.username}
                </div>
                <div>
                    {loading ? (
                        <Spinner/>
                    ) : !league.users.includes(user._id) ? (
                        <HeaderButton onClick={add_user} background={false}>Add</HeaderButton>
                    ) : (
                        <div>Already in this league</div>
                    )}
                </div>
            </div>
        </Card>
    )
}