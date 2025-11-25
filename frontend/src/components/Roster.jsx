import RosterSpot from "./RosterSpot"
import {differenceInDays, parseISO } from 'date-fns'
import { get_salary_array } from "../utils/utils"
import { useLeague } from "../contexts/LeagueContext"

export default function Roster({selected_roster, can_edit, max_year, inDialog, selectedPlayerIDs, setSelectedPlayerIDs}) {
    const {subStatus} = useLeague()

    function compute_age(birth_date) {
        if (!birth_date) return "?";
        
        birth_date = parseISO(birth_date)
        const today = new Date()
        const days_diff = differenceInDays(today, birth_date)
        const age_years = days_diff / 365.25
        return age_years.toFixed(1)
    }

    function handle_select(playerID) {
        setSelectedPlayerIDs(prev => 
            prev.includes(playerID) 
                ? prev.filter(id => id !== playerID) 
                : [...prev, playerID]
        )
    }

    const classname = `scroll ${inDialog ? "dialog" : ""} roster-scroll`

    const visible_roster = !inDialog ? selected_roster.filter(player => selectedPlayerIDs.includes(player._id)) : selected_roster

    return (
        <div className={classname}>
        {visible_roster?.filter(player=> player.position==="QB")
        .map(player => (
            <RosterSpot
                key={player._id}
                position={player.position}
                team={player.team}
                name={player.full_name}
                age={compute_age(player.birth_date)}
                salary={get_salary_array(player.contracts)}
                num_years={max_year - (new Date().getFullYear())+1}
                extension={player.contracts.length > 0 && player.contracts[player.contracts.length-1].extension_eligible}
                subscription={subStatus}
                can_extend={can_edit && subStatus}
                contract_type={player.contracts.length > 0 && player.contracts[player.contracts.length-1].contract_type}
                contracts={player.contracts}
                isSelected={inDialog ? selectedPlayerIDs.includes(player._id) : false}
                onSelect={inDialog ? () => handle_select(player._id) : undefined}
                inDialog={inDialog}
            />
        ))}
        {visible_roster?.filter(player=> player.position==="RB")
        .map(player => (
            <RosterSpot
                key={player._id}
                position={player.position}
                team={player.team}
                name={player.full_name}
                age={compute_age(player.birth_date)}
                salary={get_salary_array(player.contracts)}
                num_years={max_year - (new Date().getFullYear())+1}
                extension={player.contracts.length > 0 && player.contracts[player.contracts.length-1].extension_eligible}
                subscription={subStatus}
                can_extend={can_edit && subStatus}
                contract_type={player.contracts.length > 0 && player.contracts[player.contracts.length-1].contract_type}
                contracts={player.contracts}
                isSelected={inDialog ? selectedPlayerIDs.includes(player._id) : false}
                onSelect={inDialog ? () => handle_select(player._id) : undefined}
                inDialog={inDialog}
            />
        ))}
        {visible_roster?.filter(player=> player.position==="WR")
        .map(player => (
            <RosterSpot
                key={player._id}
                position={player.position}
                team={player.team}
                name={player.full_name}
                age={compute_age(player.birth_date)}
                salary={get_salary_array(player.contracts)}
                num_years={max_year - (new Date().getFullYear())+1}
                extension={player.contracts.length > 0 && player.contracts[player.contracts.length-1].extension_eligible}
                subscription={subStatus}
                can_extend={can_edit && subStatus}
                contract_type={player.contracts.length > 0 && player.contracts[player.contracts.length-1].contract_type}
                contracts={player.contracts}
                isSelected={inDialog ? selectedPlayerIDs.includes(player._id) : false}
                onSelect={inDialog ? () => handle_select(player._id) : undefined}
                inDialog={inDialog}
            />
            
        ))}
        {visible_roster?.filter(player=> player.position==="TE")
        .map(player => (
            <RosterSpot
                key={player._id}
                position={player.position}
                team={player.team}
                name={player.full_name}
                age={compute_age(player.birth_date)}
                salary={get_salary_array(player.contracts)}
                num_years={max_year - (new Date().getFullYear())+1}
                extension={player.contracts.length > 0 && player.contracts[player.contracts.length-1].extension_eligible}
                subscription={subStatus}
                can_extend={can_edit && subStatus}
                contract_type={player.contracts.length > 0 && player.contracts[player.contracts.length-1].contract_type}
                contracts={player.contracts}
                isSelected={inDialog ? selectedPlayerIDs.includes(player._id) : false}
                onSelect={inDialog ? () => handle_select(player._id) : undefined}
                inDialog={inDialog}
            />
        ))}
        </div>
    )
}