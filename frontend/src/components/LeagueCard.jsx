import Card from "./Card"
import { Link } from "react-router-dom"
import HeaderButton from "./HeaderButton"
import {useAuth} from "../contexts/AuthContext"

export default function LeagueCard({league}) {

    return (
        <Card width={"100%"} height={""} changeOnHover={true} to={`/league/${league._id}`}>
            <div className="league-name">{league.name}</div>
            <div>Owner: {league.owner.username}</div>
            <div>LeagueHQ ID: {league._id}</div>
            <div>Sleeper League ID: {league.sleeper_league_ids[String(new Date().getFullYear())]}</div>
            <div className="bottom-container">
                <div>Budget: ${league.salary_cap}</div>
            </div>
        </Card>
    )
}

/*
    return (
        <Card width={"100%"} height={""} changeOnHover={true}>
            <div className="league-name">{league.name}</div>
            <div>Owner: {league.owner.username}</div>
            <div>LeagueHQ ID: {league._id}</div>
            <div>Sleeper League ID: {league.sleeper_league_ids[String(new Date().getFullYear())]}</div>
            <div className="bottom-container">
                <div>Budget: ${league.salary_cap}</div>
                <div className="league-buttons">
                    <span><HeaderButton to={`/league/${league._id}/settings`} background={false}>Settings</HeaderButton></span>
                    <span><HeaderButton to={`/league/${league._id}`} background={true}>View</HeaderButton></span>
                </div>
            </div>
        </Card>
    )
*/