import axios from "axios"
import {differenceInDays, parseISO } from 'date-fns'
import Card from "../components/Card"
import Row from "../components/Row"
import MainPanel from "../components/MainPanel"
import ContractHeading from "../components/ContractHeading"
import RosterSpot from "../components/RosterSpot"
import Spinner from "../components/Spinner"
import { useState, useEffect, useMemo } from "react"
import { useLeague } from "../contexts/LeagueContext"
import { useParams } from "react-router-dom"

export default function ContractsPage() {
    const {league_id} = useParams()
    const {league, subStatus, subPurchased, leagueYear, isOwner, isCommish, subHistory} = useLeague()

    const [position, setPosition] = useState("all")
    const [players, setPlayers] = useState([])
    const [filteredPlayers, setFilteredPlayers] = useState([])
    const [loading, setLoading] = useState(true)

    const [query, setQuery] = useState("")

    // can only extend contracts if a subscription has been purchased

    useEffect(() => {
        const saved_query = sessionStorage.getItem("query")
        const saved_position = sessionStorage.getItem("position")
        if (saved_query) setQuery(saved_query)
        if (saved_position) setPosition(saved_position)

    }, [])

    function change_query(new_query) {
        setQuery(new_query)
        sessionStorage.setItem("query", new_query)
    }

    function set_position(new_pos) {
        setPosition(new_pos)
        sessionStorage.setItem("position", new_pos)
    }

    const current_year = new Date().getFullYear()
    // derive max year
    const max_year = Math.max(
        current_year-1,
        ...players.flatMap(p =>
            p.contracts?.map(c => c.end_year) || []
        )
    )
    function get_salary_array(contracts) {
        if (!contracts || contracts.length === 0) return [];
        
        const current_year = new Date().getFullYear()
        const max_end_year = Math.max(...contracts.map(c => c.end_year))
        const num_years = max_end_year - current_year + 1

        const out = Array(num_years).fill(null)

        for (const contract of contracts) {
            const start_year = parseInt(contract.start_year)
            const end_year = parseInt(contract.end_year)
            const salary = contract.salary

            for (let y=Math.max(current_year, start_year); y <=end_year; y++) {
                const index = y - current_year
                out[index] = salary
            }
        }

        return out
    }

    function compute_age(birth_date) {
        if (!birth_date) return "?";
        
        birth_date = parseISO(birth_date)
        const today = new Date()
        const days_diff = differenceInDays(today, birth_date)
        const age_years = days_diff / 365.25
        return age_years.toFixed(1)
    }

    function latest_sleeper_league() {
        const years = Object.keys(league.sleeper_league_ids).map(year => Number(year));
        const most_recent_year = years.length ? Math.max(...years) : null;
        const sleeper_league_id = league.sleeper_league_ids[String(most_recent_year)]
        return sleeper_league_id
    }

    // get all rostered players in a league
    useEffect(() => {
        const get_player_data = async() => {
            if (!league) return
            try {
                const sleeper_league_id = latest_sleeper_league()
                if (!sleeper_league_id) return
                setLoading(true)
                // call sleeper api to get rosters (list of player ids for each team)
                const roster_res = await axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/rosters`)
                // flatten out into one giant list of player ids
                const all_player_ids = roster_res.data.flatMap(team => team.players || [])
                // get names, teams, positions, contract info for all of these payers
                const response = await axios.post(
                    `/api/leagues/${league_id}/player-info`,
                    all_player_ids
                )
                // sort by salary
                const sorted_players = response.data.sort((a,b)=> {
                    const asal = a.contracts?.[0]?.salary || 0;
                    const bsal = b.contracts?.[0]?.salary || 0;
                    return bsal - asal || compute_age(a.birth_date) - compute_age(b.birth_date)
                    
                })
                setPlayers(sorted_players)
            } catch (error) {
                console.error("Error fetching league data: ", error)
            } finally {
                setLoading(false)
            }
        }
        get_player_data()
    }, [league])

    // when players is loaded, construct map of position to players
    const playerMap = useMemo(() => {
        const map = { QB: [], RB: [], WR: [], TE: [], FA: [] }
        for (const player of players) {
            if (map[player.position]) {
                map[player.position].push(player)
            }
            if (player.contracts.length === 0) {
                continue
            }
            if (player.contracts[player.contracts.length-1].end_year === current_year) {
                map["FA"].push(player)
            }
        }
        return map
    }, [players])    

    // when position is changed or players loaded in, set the players that are actually displayed
    useEffect(()=> {
        if (position === "all") {
            setFilteredPlayers(players)
        } else {
            setFilteredPlayers(playerMap[position])
        }   
    }, [position, players, playerMap])

    // if (loading) {
    //     return (
    //         <div className="spinner-container">
    //             <Spinner />
    //         </div>
    //     )
    // }

    // escape characters that have special meaning in regex
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /**
     * Creates a case-insensitive regex after sanitizing the user query.
     * @param {string} query - The user's input string.
     * @returns {RegExp} The compiled search regex.
     */
    const createSanitizedRegex = (query) => {
        // 1. Sanitize the query: remove all periods ('.') and apostrophes ('')
        const sanitizedQuery = query.replace(/['.]/g, ''); 
        
        // 2. Escape the sanitized string for regex special characters
        const escapedQuery = escapeRegExp(sanitizedQuery);
        
        // 3. Create the regex (case-insensitive flag 'i')
        return new RegExp(escapedQuery, "i");
    };

    const searchRegex = createSanitizedRegex(query)
    const sanitizePlayerName = (name) => name.replace(/['.]/g, '');

    return (
        <MainPanel>
            <Row height={"100%"} center={true}>
                <Card height={"100%"} maxWidth={"1080px"}>
                    <div className="space-between">
                        <div className="subtitle">Contracts</div>

                        <div className="searchbar">
                            <input value={query} onChange={(e) => change_query(e.target.value)} className="search-player" type="text" placeholder="Search"/>
                        </div>
                    </div>

                    <div className="table-card">
                        <ContractHeading position={position} setPosition={set_position} max_year={max_year}/>

                        <div className="scroll">
                        {!loading && filteredPlayers.length === 0 && (
                            <div className="table-empty">No contracts found.</div>
                        )}

                        {position == "FA" && (
                            <div className="table-empty">These players must be either extended (if eligible) or dropped after this season.</div>
                        )}

                            <div className="roster-scroll">
                                {filteredPlayers && filteredPlayers.map(player => {

                                    if (searchRegex.test(sanitizePlayerName(player.full_name))) {
                                        return (
                                            <RosterSpot
                                                key={player._id}
                                                player_id={player._id}
                                                position={player.position}
                                                team={player.team}
                                                name={player.full_name}
                                                age={compute_age(player.birth_date)}
                                                salary={get_salary_array(player.contracts)}
                                                num_years={max_year - (new Date().getFullYear())+1}
                                                extension={player.contracts.length > 0 && player.contracts[player.contracts.length-1].extension_eligible}
                                                subscription={subStatus}
                                                subscribed={subPurchased}
                                                can_edit={isOwner || isCommish}
                                                contract_type={player.contracts.length > 0 && player.contracts[player.contracts.length-1].contract_type}
                                                contracts={player.contracts}

                                            />
                                        )
                                    }

                                })}
                            </div>

                        </div>
                    </div>
                    {loading && (
                        <div className="spinner-container">
                            <Spinner />
                        </div>
                    )}
                </Card>
            </Row>
        </MainPanel>
    )
}