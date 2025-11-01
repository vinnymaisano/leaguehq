import Card from './Card'
import HeaderButton from './HeaderButton'
import '../css/SearchResult.css'

export default function SearchResult({to, name, season, league_id, sleeper_league_id, budget, auction, button_text}) {
    const can_create = season >= (new Date().getFullYear())
    return (
        <Card width={"100%"} height={""}>
            <div className="league-name">{name}</div>
            {league_id && <div>LeagueHQ ID: {league_id}</div>}
            {sleeper_league_id && (<div>Sleeper League ID: {sleeper_league_id}</div>)}
            <div>Season: {season}</div>
            <div className="bottom-container">
                <span style={{color: auction ? "" : "rgb(140, 0, 0)"}}>{auction ? `Auction budget: $${budget}` : `! - League does not have an auction draft`}</span>
                <span>{can_create ? (<HeaderButton state={{name, budget, league_id}} to={to} background={true}>{button_text}</HeaderButton>) : (<span className="error">League must be for current season</span>)}</span>
            </div>
        </Card>
    )
}