import Card from "./Card"
import HeaderButton from "./HeaderButton";

export default function SleeperLeague({league, index, can_purchase}) {
    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
    const first = index === 0
    // console.log(first, league.league_id, can_purchase)
    
    return (
        <Card>
            <div className="league-name">{league.name}</div>
            <div>Sleeper League ID: {league.league_id}</div>
            <div>Season: {league.season}</div>
            <div className="bottom-container">
                <div>Status: {capitalize(league.status.replace("_", "-"))}</div>
                <div>{can_purchase && <HeaderButton>Purchase</HeaderButton>}</div>
            </div>
        </Card>
    )
}