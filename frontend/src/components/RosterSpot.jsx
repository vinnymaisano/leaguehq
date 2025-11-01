import '../css/RosterSpot.css'
import { FaCheck, FaBan } from "react-icons/fa"
import ExtendButton from './ExtendButton';
import EditContractButton from './EditContractButton';
import { useLeague } from '../contexts/LeagueContext';

export default function RosterSpot({position, team, name, age, salary, num_years=0, subscription, extension, contract_type, contracts, can_extend, player_id, can_edit, isSelected, onSelect, inDialog}) {
    const {league} = useLeague()
    // information needed for extensions
    const price_hike = league.extension_price_hike
    const max_length = league.max_extension_length
    const extension_start_year = (contracts.length > 0) ? parseInt(contracts[contracts.length-1].end_year) + 1 : new Date().getFullYear()

    let alt_text;
    if (extension) {
        alt_text = "Player is eligible for a contract extension."
        if (contract_type === "rookie") {
            alt_text += " Player is on their rookie contract."
        } else if (contract_type === "auction") {
            alt_text += " Player was acquired via an auction draft."
        }
    } else {
        if (salary.length > 0) {
            alt_text = "Player is not eligible for a contract extension."
            if (contract_type === "extension") {
                alt_text += " Players cannot be re-signed twice."
            } else if (contract_type === "waiver") {
                alt_text += " Player was acquired via waivers."
            }
        } else {
            alt_text = "Player does not have a contract."
        }
    }

    const gridTemplateColumns = inDialog ? `40px 60px 200px 80px 100px` : `40px 60px 200px 80px 100px ${'80px '.repeat(num_years+1).trim()}`
    const grid_style = {
        display: 'grid',
        gridTemplateColumns,
        gap: '10px'
    };

    const classname = `roster_spot ${isSelected ? "selected" : ""} ${inDialog ? "selectable" : ""}`

    return (
        <div className={classname} style={grid_style} onClick={onSelect}>
            <span className={`position ${position}`}>{position}</span>
            <span className="team">{team}</span>
            <span className="name">{name}</span>
            <span className="stats">{age}</span>    
            <span style={{color: extension ? "rgb(0, 125, 0)" : "rgb(150, 0, 0)"}} className="stats contract" title={alt_text}>{extension ? <FaCheck/> : <FaBan/>}</span>     
            
            {!inDialog && Array.from({length: num_years}).map((_, i) => (
                <span key={i} className="stats">
                    {(salary[i] != null && salary[i] !== undefined) ? `$${salary[i]}` : ""}
                </span>
            ))}
            
            {extension && can_extend && 
                <span className="stats">
                    <ExtendButton
                        current_salary={contracts[contracts.length-1].salary}
                        start_year={extension_start_year}
                        name={name}
                        current_contract={contracts[contracts.length-1] || null}
                    />
                </span>
            }

            {can_edit && 
                <span className="stats">
                    <EditContractButton 
                        contracts={contracts}
                        name={name}
                        player_id={player_id}
                    />
                </span>
            }
        </div>
    )
}