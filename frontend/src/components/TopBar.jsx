import { useLeague } from "../contexts/LeagueContext"
import Card from "./Card"

export default function TopBar() {
    const {league, leagueYear} = useLeague()

    return (
        <Card padding={"5px"} height={"100%"}>
            <div className="topbar-content">
                <span className="info-bold">{league?.name}</span> <span className="info-secondary">{leagueYear} season</span>
            </div>
        </Card>
    )
}