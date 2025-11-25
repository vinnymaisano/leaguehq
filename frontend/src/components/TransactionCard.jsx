import "../css/Transaction.css"

export default function TransactionCard({txn, teams, roster_map, draft}) {
    
    function ordinalSuffix(num) {
        let suffix = "th";
        
        if (num % 100 < 11 || num % 100 > 13) {
            switch (num % 10) {
            case 1:
                suffix = "st";
                break;
            case 2:
                suffix = "nd";
                break;
            case 3:
                suffix = "rd";
                break;
            }
        }
        
        return num + suffix;
    }

    let txn_type
    switch (txn.type) {
        case "extension":
        case "trade":
            txn_type = "trade-extension"
            break
        case "free_agent":
        case "commissioner":
            txn_type = "free_agent"
            break
        case "waiver":
            txn_type = "waiver"
            break
        case "draft_import":
        case "draft_delete":
        case "create_contract":
        case "delete_contract":
        case "edit_contract":
            txn_type = "generic_txn"
            break
    }

    let options = {
        year: "numeric",
        month: "numeric",   // "August"
        day: "numeric",  // 18
        hour: "2-digit",
        minute: "2-digit",
        hour12: true    // 24-hour format; remove this for AM/PM
    }
    // formatted timestamp for the transaction
    let utcDate = txn.txn_time
    let date = new Date(utcDate)
    
    let message = ""
    let type = ""

    if (txn.type === "free_agent" || txn.type === "commissioner") {
        type = "Free agency";

        const roster_id = txn.adds?.[0]?.roster_id || txn.drops?.[0]?.roster_id;
        const team = teams.find(t => t.roster_id === Number(roster_id));
        const team_name = team ? team.name : "Unknown Team";

        const addedPlayers = (txn.adds || []).map(
            add => `${add.player?.position || ""} ${add.player?.full_name || "Unknown Player"}`
        );

        const droppedPlayers = (txn.drops || []).map(
            drop => `${drop.player?.position || ""} ${drop.player?.full_name || "Unknown Player"}`
        );

        message = `${team_name} `;
        if (addedPlayers.length) {
            message += `added ${addedPlayers.join(", ")} from free agency for $1`;
        }
        if (addedPlayers.length && droppedPlayers.length) message += `, `;
        if (droppedPlayers.length) {
            message += `released ${droppedPlayers.join(", ")}`;
        }

    } else if (txn.type === "extension") {
        type = "Contract extension"
        const roster_id = Object.keys(roster_map).find(key => roster_map[key].includes(txn.players[0]._id))
        const team_name = teams.find(t => t.roster_id === Number(roster_id))?.name  
        const player = txn.players[0]      
        message = `${team_name} signs ${player?.position} ${player?.full_name} to a ${txn.contract_length}-year, $${txn.contract_length * txn.salary} contract extension ($${txn.salary} / year) through the ${txn.contract_start_year + txn.contract_length-1} season`
    } else if (txn.type === "waiver") {
        type = "Waiver claim"

        // handle players that may not be in the DB
        let add = txn.adds[0].player
        if (!add) {
            add = {
                position: "",
                full_name: "Unknown Player"
            }
        }
        let drop = null
        if (txn.drops.length > 0) {
            drop = txn.drops[0].player || {
                position: "",
                full_name: "Unknown Player"
            }
        }

        const roster_id = txn.adds[0].roster_id
        const team_name = teams.find(t => t.roster_id === Number(roster_id))?.name || "Unknown Team"

        message = `${team_name} claimed ${add.position} ${add.full_name} off waivers for $${txn.salary}`
        // if (txn.drops.length > 0) message += `, released ${txn.drops[0].player?.position} ${txn.drops[0].player?.full_name}`
        if (drop) message += `, released ${drop.position} ${drop.full_name}`
    } else if (txn.type === "edit_contract") {
        type = "Contract edited"
        const player = txn.players[0]
        message = `${player?.position} ${player?.full_name}: `
        const changes = []
        if (txn.changes.new_salary !== txn.changes.old_salary) {
            changes.push(`Salary changed from $${txn.changes.old_salary} to $${txn.changes.new_salary}`)
        }
        if (txn.changes.new_start_year != txn.changes.old_start_year) {
            changes.push(`Contract start year changed from ${txn.changes.old_start_year} to ${txn.changes.new_start_year}`)
        }
        if (txn.changes.new_end_year != txn.changes.old_end_year) {
            changes.push(`Contract end year changed from ${txn.changes.old_end_year} to ${txn.changes.new_end_year}`)
        }
        message += changes.join(". ")
    } else if (txn.type === "trade") {
        const roster_ids = [
        ...new Set([
            ...txn.adds.map(p => Number(p.roster_id)),
            ...txn.drops.map(p => Number(p.roster_id)),
            ...txn.draft_picks.map(p => Number(p.owner_id))
            ])
        ];
        const team_names = roster_ids.map(id => teams.find(t => t.roster_id === id)?.name)
        type = `Trade: ${team_names.join(", ")}`
        
        for (const id of roster_ids) {
            const team_name = teams.find(t => t.roster_id === id)?.name
            message += `${team_name} receives `

            const adds = txn.adds.filter(a => a.roster_id == id) // players
            const picks = txn.draft_picks.filter(p => p.owner_id === Number(id)) // draft picks

            const items = []

            for (let i=0; i < adds.length; i++) {
                items.push(`${adds[i].player?.position} ${adds[i].player?.full_name}`)
            }

            for (let i=0; i < picks.length; i++) {
                const pick = picks[i]
                const desc = `${i==0 || i == picks.length-1 ? "a" : ""} ${pick.season} ${ordinalSuffix(pick.round)} round pick`
                items.push(desc)
            }

            for (let i=0; i < items.length; i++) {
                message += items[i]
                if (i < items.length-2) {
                    message += ", "
                }
                if (i == items.length -2) {
                    message += " and "
                }
            }
            message += ". "
        }
    } else if (txn.type === "create_contract") {
        type = "Contract created"
        message = `Contract for ${txn.players[0].position} ${txn.players[0].full_name} created by a commissioner: $${txn.salary} / year from ${txn.contract_start_year} to ${txn.contract_start_year+txn.contract_length-1}`
    } else if (txn.type === "delete_contract") {
        type = "Contract deleted"
        message = `Contract for ${txn.players[0].position} ${txn.players[0].full_name} was deleted by a commissioner`
    } else if (txn.type === "draft_import") {
        type = "Draft imported"
        message = `Commissioner imported a ${draft.season} ${draft.veteran_draft ? "veteran" : ""} ${draft.type} ${draft.rookie_draft ? "rookie" : ""} draft`
    } else if (txn.type === "draft_delete") {
        type = "Draft deleted"
        message = `Commissioner deleted a ${draft.season} ${draft.veteran_draft ? "veteran" : ""} ${draft.type} ${draft.rookie_draft ? "rookie" : ""} draft`
    }



    return (
        <div className="transaction">
            <span className={`txn-type ${txn_type}`}>{type}</span>
            <div className="txn-message">{message}</div>
            <div className="date">{date.toLocaleString(undefined, options)}</div>
        </div>
    )
}