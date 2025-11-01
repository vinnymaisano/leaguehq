import axios from 'axios'
axios.defaults.timeout = 5000
import Contract from '../models/Contracts.js'
import Player from '../models/Player.js'
import League from '../models/League.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Subscription from '../models/Subscription.js'
import mongoose from "mongoose"
import bcrypt from 'bcryptjs'
import dotenv from "dotenv"
import path from 'path'

dotenv.config()
// dotenv.config({path: path.resolve("./backend/.env")})

// TODO: handle number of rookie draft rounds being changed

function verify_commissioner(league, user) {
  const is_owner = String(league.owner) === String(user._id)
  const is_commish = league.commissioners.some( (commish_id) => String(commish_id) === String(user._id))
  return is_owner || is_commish
}

// get one league by ID
export async function fetch_league(league_id) {
    const league = await League.findById(league_id)
    if (!league) {
        const err = new Error("League not found")
        err.status_code = 404
        throw err
    }

    const current_year = new Date().getFullYear().toString()
    const current_league_id = league.sleeper_league_ids.get(current_year) ?? null

    let name
    if (current_league_id) {
        const sleeper_league = await axios.get(`https://api.sleeper.app/v1/league/${current_league_id}`)
        name = sleeper_league.data.name || "No name"
    }
    
    const league_obj = league.toObject()
    league_obj.name = name
    league_obj.sleeper_league_ids = Object.fromEntries(league.sleeper_league_ids)
    league_obj.rookie_salaries = Object.fromEntries(league.rookie_salaries)
    league_obj.teams = Object.fromEntries(league.teams)

    return league_obj
}

// get multiple leagues by ID
export async function fetch_multiple_leagues(league_ids) {    
    // const league = await League.findById(league_id)
    const leagues = await League.find({_id: {$in: league_ids}}).populate("owner", "username").lean()
    if (!leagues.length) {
        const err = new Error("No leagues found")
        err.status_code = 404
        throw err
    }
    const current_year = new Date().getFullYear().toString()

    await Promise.all(
        leagues.map(async (league) => {
            const sleeper_league_id = league.sleeper_league_ids[current_year]
            if (sleeper_league_id) {
                try {
                    const sleeperRes = await axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}`);
                    league.name = sleeperRes.data.name || "Unnamed league";
                } catch (err) {
                    console.warn(`Failed to fetch Sleeper league ${sleeper_league_id}:`, err.message);
                    league.name = "Unnamed league";
                }
            } else {
                league.name = "Unnamed league";
            }
        })
    )
    return leagues
}

export async function fetch_users(league_id) {
    // check for valid league ID
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err
    }
    // get the league object
    const league = await League.findById(league_id)

    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }

    // get the users in this league
    const users = await User.find({_id: {$in: league.users}}).select("username")
    
    // map user id to roster id
    const roster_map = {}
    
    for (const [user_id, roster_id] of league.teams) {
        roster_map[user_id] = roster_id
    }

    const result = users.map(user => ({
        _id: user._id,
        username: user.username,
        roster_id: roster_map[user._id.toString()] || null
    }))

    return result
}

export async function save_assignments(league_id, assignments, commissioners) {
    console.log(assignments)
    console.log(commissioners)
    // check for valid league id
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID")
        err.statusCode = 400
        throw err
    }

    // find league  
    const league = await League.findOne({_id: league_id})
    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }

    // check if commissioners is an array
    if (!Array.isArray(commissioners) || commissioners.length == 0) {
        const err = new Error("Invalid commissioners array")
        err.statusCode = 400
        throw err
    }

    // check for valid user ids
    if (!commissioners.every(id => mongoose.Types.ObjectId.isValid(id))) {
        const err = new Error("Commissioners list contains invalud user ID(s)")
        err.statusCode = 400
        throw err
    }

    // check that all commissioners are in this league
    const league_member_ids = league.users.map(id => id.toString())
    if (!commissioners.every(id => league_member_ids.includes(id))) {
        const err = new Error("User(s) not in the league")
        err.statusCode = 400
        throw err
    }

    // check that all commissioners are real users
    const found_users = await User.find({_id: {$in: commissioners}}).select("_id")
    if (found_users.length !== commissioners.length) {
        const err = new Error("One or more users do not exist")
        err.statusCode = 422
        throw err
    }

    // make sure the owner is always in the commissioners array
    if (!commissioners.includes(String(league.owner))) {
        const err = new Error("Owner must be a commissioner")
        err.statusCode = 400
        throw err
    }

    league.teams = new Map(Object.entries(assignments))
    league.commissioners = commissioners
    await league.save()
}


// const user_ids = league.users
// const users = await User.find({_id: {$in: user_ids}}).select("username -_id")
// return users
export async function safe_api_get(url, error_message) {
    try {
        const res = await axios.get(url)
        return res.data
    } catch (error) {
        const err = new Error(error_message)
        err.status_code = error.response?.status || 502 // 502 = Bad Gateway
        throw err
    }
}

export function most_recent_league_id(league) {
    const years = [...league.sleeper_league_ids.keys()].map(Number);
    const most_recent_year = years.length ? Math.max(...years) : null;
    const sleeper_league_id = league.sleeper_league_ids.get(String(most_recent_year))
    return sleeper_league_id
}

// use sleeper API to save contracts to DB
export async function import_contracts(league_id, user_id, draft_id, overwrite = true) {
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID")
        err.statusCode = 400
        throw err
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID")
        err.statusCode = 400
        throw err
    }

    // check if league exists
    const league = await League.findById(league_id)
    const user = await User.findById(user_id)
    if (!league) {
        const err = new Error("League does not exist")
        err.statusCod = 404
        throw err
    }
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 404
        throw err
    }

    // make sure user is a commissioner
    const is_commish = verify_commissioner(league, user)
    if (!is_commish) {
        const err = new Error("User is not the owner or a commissioner of this league.")
        err.statusCode = 403
        throw err
    }

    if (league.imported_drafts.some(d => d.draft_id === draft_id)) {
        const err = new Error("This draft has already been imported.");
        err.statusCode = 400;
        throw err;
    }


    // get all the drafts for this league
    const drafts = await safe_api_get(
        `http://localhost:5000/api/${league_id}/drafts`,
        "Failed to fetch draft info from DB"
    )

    // get the draft being imported
    const sleeper_draft = await safe_api_get(
        `https://api.sleeper.app/v1/draft/${draft_id}`,
        "Failed to get draft info from Sleeper"
    )
    if (!sleeper_draft) {
        const err = new Error("Draft does not exist")
        err.statusCode = 404
        throw err
    }

    // drafts contains the drafts for this league - verify that this draft belongs to this league
    const draft = drafts.find((draft)=> {
        return draft.draft_id === sleeper_draft.draft_id
    })

    if (!draft) {
        const err = new Error("Draft does not belong to this Sleeper league.")
        err.statusCode = 400
        throw err
    }

    // get timestamps
    const draft_time =  sleeper_draft.start_time || sleeper_draft.last_picked 
    const import_time = new Date()

    // check that draft is complete
    if (draft.status !== "complete") {
        const err = new Error("Draft has not been completed.")
        err.statusCode = 400
        throw err
    }

    // beginning year of contracts
    const start_year = draft.season

    // get the picks from this draft
    const picks = await safe_api_get(
        `https://api.sleeper.app/v1/draft/${draft_id}/picks`,
        "Failed to get picks from Sleeper"
    )

    // get sleeper league id for transaction docs
    // ensure most recent sleeper league id so that rosters are as recent as possible
    // const years = [...league.sleeper_league_ids.keys()].map(Number);
    // const most_recent_year = years.length ? Math.max(...years) : null;
    // const sleeper_league_id = league.sleeper_league_ids.get(String(most_recent_year))
    const sleeper_league_id = most_recent_league_id(league)

    // create a set of currently rostered players
    const rosters = await safe_api_get(
        `https://api.sleeper.app/v1/league/${sleeper_league_id}/rosters`,
        "Failed to get rosters from Sleeper"
    )
    const players = new Set(rosters.flatMap(team => team.players))

    let hasRookies = false;
    let hasVets = false;

    for (const pick of picks) {
        const years_exp = Number(pick.metadata.years_exp);

        if (years_exp === 0) {
            hasRookies = true;
        } else if (years_exp > 0) {
            hasVets = true;
        }
    }

    let draft_comp
    if (hasRookies && !hasVets) {
        draft_comp = "rookies-only"
    } else if (hasVets && !hasRookies) {
        draft_comp = "vets-only"
    } else if (hasRookies && hasVets) {
        draft_comp = "all"
    } else {
        draft_comp = "none"
    }

    let contract_docs = []
    // if auction: load contracts based on auction price
    // if linear/snake: use rookie salaries
    if (draft.type === "auction") {
        const length = Number(league.auction_contract_length)

        contract_docs = picks
            .filter(pick => players.has(pick.player_id))
            .map(pick => ({
                league_id: league_id,
                roster_id: parseInt(pick.roster_id),
                draft_id,
                player_id: pick.player_id,
                start_year: start_year,
                end_year: Number(start_year) + length - 1,
                salary: parseInt(pick.metadata.amount),
                extension_eligible: true,
                contract_type: "auction",
                txn_time: draft_time,
                import_time
            }))
        
        console.log(contract_docs.filter(doc => doc.player_id == "4663"))

    } else {
        const length = Number(league.rookie_contract_length)

        for (const pick of picks) {
            const years_exp = parseInt(pick.metadata.years_exp)
            if (years_exp > 0) {
                const err = new Error("Draft is neither rookies only or an auction")
                err.statusCode = 400
                throw err
            }
        }

        contract_docs = picks
            .filter(pick => players.has(pick.player_id))
            .map(pick => {
            const salary = league.rookie_salaries.get(pick.round.toString())

            if (!salary) {
                const err = new Error(`Missing rookie salary for round ${pick.round}. Make sure the number of rounds in your LeagueHQ settings match your Sleeper league's settings`)
                err.statusCode = 400
                throw err
            }

            return {
                league_id,
                roster_id: Number(pick.roster_id),
                draft_id,
                player_id: pick.player_id,
                start_year,
                end_year: Number(start_year) + length - 1,
                salary: Number(salary),
                extension_eligible: true,
                contract_type: "rookie",
                txn_time: draft_time,
                import_time
              }
        })
    }
    
    const session = await mongoose.startSession()
    try {
        session.startTransaction()
        const player_ids = picks.map(pick => pick.player_id)

        // delete any current contracts of players who are in this draft
        if (overwrite) {
            await Contract.deleteMany(
                {league_id, player_id: {$in: player_ids}},
                {session}
            )
        } else {
            // only insert contract if player doesn't have one already
            const existing = await Contract.find({
                league_id: league_id,
                player_id: {$in: player_ids}
            })
            const existing_player_ids = new Set(existing.map(contract => contract.player_id))
            contract_docs = contract_docs.filter(doc => !existing_player_ids.has(doc.player_id))
        }
        
        // insert contract documents
        await Contract.insertMany(contract_docs, {session, ordered: true})
        // add to league's list of imported drafts
        await League.updateOne({_id: league_id},
            {
                $push: {
                    imported_drafts: {
                        draft_id: draft.draft_id,
                        imported_at: new Date()
                    }
                }
            },
            {session}
        )
        const transaction = new Transaction({
            league_id,
            sleeper_league_id,
            txn_time: import_time,
            type: "draft_import",
            draft_id
        })
        await transaction.save({session})

        await session.commitTransaction()
        return contract_docs.length
    } catch (error) {
        await session.abortTransaction()
        const err = new Error(`DB error - failed to insert contracts: ${error.message}`)
        err.statusCode = 500
        throw err
    } finally {
        session.endSession()
    }
    
}

export async function delete_one_contract(contract_id) {
    if (!mongoose.Types.ObjectId.isValid(contract_id)) {
        const err = new Error("Invalid contract ID")
        err.statusCode = 400
        throw err
    }

    const session = await mongoose.startSession();
    session.startTransaction()
    try {
        const deleted_contract = await Contract.findByIdAndDelete(contract_id, {session})
        const time = new Date(deleted_contract.import_time)
        
        if (!deleted_contract) {
            const err = new Error("Contract does not exist.")
            err.statusCode = 404
            throw err
        }

        // find the league (needed for transaction)
        const league = await League.findById(deleted_contract.league_id).session(session)
        // log deletion of contract
        const sleeper_league_id = league.sleeper_league_ids.get(time.getFullYear()) || "-1" // sleeper league id at time of contract's creation

        const first_txn = new Transaction({
            sleeper_league_id,
            league_id: league._id,
            players: [deleted_contract.player_id],
            txn_time: time,
            type: "delete_contract",
            salary: deleted_contract.salary,
            contract_start_year: deleted_contract.start_year,
            contract_length: deleted_contract.end_year-deleted_contract.start_year+1,
            contract_id: deleted_contract._id
        })
        await first_txn.save({session})

        const {player_id, league_id} = deleted_contract
        const deleted_extension = await Contract.findOneAndDelete({
            player_id,
            league_id,
            contract_type: "extension"
        }, {session})

        // log deletion of extension
        if (deleted_extension) {
            const second_txn = new Transaction({
                sleeper_league_id,
                league_id: league._id,
                players: [deleted_extension.player_id],
                txn_time: time,
                type: "delete_contract",
                salary: deleted_extension.salary,
                contract_start_year: deleted_extension.start_year,
                contract_length: deleted_extension.end_year-deleted_extension.start_year+1,
                contract_id: deleted_extension._id
            })
            await second_txn.save({session})
        }

        await session.commitTransaction()
        return {deleted_contract, deleted_extension}
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        session.endSession()
    }
}

export async function delete_contracts(league_id, user_id, draft_id) {
    const timestamp = new Date()

    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID")
        err.statusCode = 400
        throw err
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID")
        err.statusCode = 400
        throw err
    }

    // check if league exists
    const league = await League.findById(league_id)
    const user = await User.findById(user_id)

    if (!league) {
        const err = new Error("League does not exist")
        err.statusCod = 404
        throw err
    }
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 404
        throw err
    }

    // make sure user is a commissioner
    const is_commish = verify_commissioner(league, user)
    if (!is_commish) {
        const err = new Error("User is not the owner or a commissioner of this league.")
        err.statusCode = 403
        throw err
    }

    const session = await mongoose.startSession()
    try {
        // Fetch draft info
        let draft
        try {
            const url = `https://api.sleeper.app/v1/draft/${draft_id}`
            const res = await axios.get(url)
            draft = res.data
        } catch {
            const error = new Error("Unable to fetch draft from Sleeper")
            err.statusCode = 502
            throw error
        }

        if (!draft) {
            const error = new Error("Draft does not exist on Sleeper")
            err.statusCode = 404
            throw err
        }

        session.startTransaction()
        const league = await League.findById(league_id).session(session)
        // league not found in the DB
        if (!league) {
            const err = new Error("League has not been activated on LeagueHQ")
            err.statusCode = 400
            throw err
        }

        // Build transaction docs
        const txn = new Transaction({
            league_id,
            sleeper_league_id: draft.league_id,
            txn_time: timestamp,
            type: "draft_delete",
            draft_id
        })
        
       await txn.save({session})

        // Delete contractss
        const result = await Contract.deleteMany({
            league_id,
            draft_id
        }, {session})

        await League.updateOne(
            {_id: league_id},
            {$pull: {imported_drafts: {draft_id: draft_id}}},
            {session}
        )

        await session.commitTransaction()
        
        return result.deletedCount
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        session.endSession()
    }
}

// used for loading players on roster page
export async function get_players(league_id, player_ids) {
    try {
        const players = await Player.find({ _id: { $in: player_ids}})
        const contracts = await Contract.find({
            league_id: league_id,
            player_id: {$in : player_ids}
        })

        const current_year = new Date().getFullYear()
        // map player_id to list of contracts
        const contract_map = new Map();
        contracts.forEach(contract => {
            const player_id = contract.player_id.toString()
            if (!contract_map.has(player_id)) {
                contract_map.set(player_id, [])
            }
            // dont include expired contracts
            if (contract.end_year >= current_year && !contract.terminated_early) {
                contract_map.get(player_id).push(contract)
            }
        })

        // sort all of the contracts arrays
        for (const [player_id, contracts] of contract_map.entries()) {
            contracts.sort((a,b) => a.start_year - b.start_year)
        }

        // contract.player_id references player._id
        const combined = players.map(player => {
            const player_id = player._id.toString()
            const contracts = contract_map.get(player_id) || [];
            return {
              ...player.toObject(),  // Flatten Mongoose document to plain JS object
              contracts               // Add contract object (or null if none exists)
            };
        });

        return combined
    } catch (error) {
        console.error(`Error fetching players: ${error}`);
        throw error;
    }
    
}

export async function search_leagues(league_id, username) {

}

export async function delete_league(league_id, user_id, password) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // validate IDs
        if (!mongoose.Types.ObjectId.isValid(league_id)) {
            const err = new Error("Invalid league ID format");
            err.statusCode = 400;
            throw err;
        }

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            const err = new Error("Invalid user ID format");
            err.statusCode = 400;
            throw err;
        }
        
        // fetch league and user
        const league = await League.findById(league_id).session(session)
        if (!league) {
            const err = new Error("League does not exist")
            err.statusCode = 404
            throw err
        }

        // console.log("deleting league:", league)

        const user = await User.findById(user_id).session(session)
        if (!user) {
            const err = new Error("User does not exist")
            err.statusCode = 400
            throw err
        }

        // verify ownership
        const is_owner = String(league.owner) === String(user._id)
        if (!is_owner) {
            const err = new Error("User is not the owner of this league")
            err.statusCode = 403
            throw err
        }

        const password_match = await bcrypt.compare(password, user.password)
        if (!password_match) {
            const err = new Error("Incorrect password")
            err.statusCode = 401
            throw err
        }

        // pull the league from all users' leagues arrays
        await User.updateMany(
            {leagues: league._id},
            {$pull: {leagues: league._id}},
            {session}
        )

        // delete contracts for this league
        await Contract.deleteMany(
            {league_id: league._id},
            {session}
        )

        // delete any league-specific transactions
        await Transaction.deleteMany(
            {league_id: league._id},
            {session}
        )

        // delete the league
        await League.deleteOne({_id: league_id}, {session})

        await session.commitTransaction()
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        session.endSession()
    }
}

// export async function get_league_info(league_ids) {
//     const leagues = await League.find({_id: {$in: league_ids}})
//     return leagues
// }

export async function upload_contract_extension(contract_id, user_id, length) {
    if (!mongoose.Types.ObjectId.isValid(contract_id)) {
        const err = new Error("Invalid contract ID format");
        err.statusCode = 400;
        throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format");
        err.statusCode = 400;
        throw err;
    }

    // get the player's current contract
    const current_contract = await Contract.findById(contract_id)
    const user = await User.findById(user_id)
    if (!user) {
        const err = new Error("User does not exist.")
        err.statusCode = 404
        throw err
    }
    if (!current_contract) {
        const err = new Error("Current contract does not exist.")
        err.statusCode = 404
        throw err
    }
    if (!current_contract.extension_eligible) {
        const err = new Error("Player is not eligible for an extension.")
        err.statusCode = 400
        throw err
    }
    // convert to object, delete auto-generated fields
    const base = current_contract.toObject();
    delete base._id;
    delete base.__v;
    delete base.createdAt;
    delete base.updatedAt;

    // find the league
    const league = await League.findById(current_contract.league_id)
    if (length > league.max_extension_length) {
        const err = new Error("Extension is longer than this league's rules permit.")
        err.statusCode = 400
        throw err
    }

    // if (!league.users.includes(String(user_id))) {
    //     const err = new Error("User is not in this league")
    //     err.statusCode = 401
    //     throw err
    // }

    const is_commish = verify_commissioner(league, user)
    if (!is_commish) {
        // make sure player is on this user's team
 
        if ( ![...league.teams.keys()].includes(String(user._id))) {
            const err = new Error("User is not assigned to a team.")
            err.statusCode = 401
            throw err
        }

        // get current sleeper league
        const league_year = Math.max(...league.sleeper_league_ids.keys())
        const sleeper_league_id = league.sleeper_league_ids.get(String(league_year))
        // get all rosters
        const url = `https://api.sleeper.app/v1/league/${sleeper_league_id}/rosters`
        const res = await axios.get(url)
        // get this user's roster
        // console.log(res.data)
        const roster = res.data.filter(t => String(t.roster_id) === String(league.teams.get(user._id)))[0]
        // check that player is on this user's roster
        const on_team = roster?.players?.includes(current_contract.player_id) || false
        
        if (!on_team) {
            const err = new Error("Player is not on this user's team")
            err.statusCode = 403
            throw err
        }
    }

    const createdAt = new Date()
    // create the new contract with updated start/end years, salary
    const new_contract = new Contract({
        ...base,
        start_year: current_contract.end_year+1,
        end_year: parseInt(current_contract.end_year) + parseInt(length),
        salary: current_contract.salary + league.extension_price_hike * length,
        contract_type: "extension",
        extension_eligible: false,
        txn_time: createdAt,
        import_time: createdAt,
        createdAt
    })
 
    await new_contract.save()
    
    // create transaction document
    const txn = new Transaction({
        sleeper_league_id: league.sleeper_league_ids.get(String(new Date().getFullYear())) || "-1",
        league_id: league._id,
        players: [new_contract.player_id],
        txn_time: createdAt,
        type: "extension",
        salary: new_contract.salary,
        ext_player_id: new_contract.player_id,
        contract_start_year: new_contract.start_year,
        contract_length: length,
        contract_id: new_contract._id
    })
    await txn.save()

    return new_contract
}

export async function get_users_by_username(query, limit=10) {
    if (query === "") {
        return []
    }
    const regex = new RegExp(query, 'i')

    const users = await User.find({
        username: {$regex: regex}
    })
    .select("username")
    .limit(Number(limit))

    return users
}

export async function add_user_to_league(league_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format");
        err.statusCode = 400;
        throw err;
    }

    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
        const user = await User.findById(user_id).session(session)
        if (!user) {
            const err = new Error("User does not exist")
            err.statusCode = 404
            throw err
        }
    
        const league = await League.findById(league_id).session(session)
        if (!league) {
            const err = new Error("League does not exist")
            err.statusCode = 404
            throw err
        }
    
        if (league.users.includes(user._id)) {
            const err = new Error("User is already in this league")
            err.statusCode = 409
            throw err
        }
    
        league.users.push(user._id)
        user.leagues.push(league._id)
        
        await league.save({session})
        await user.save({session})

        await session.commitTransaction()
        session.endSession()
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

export async function remove_user_from_league(league_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format");
        err.statusCode = 400;
        throw err;
    }

    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
        const user = await User.findById(user_id).session(session)
        if (!user) {
            const err = new Error("User does not exist")
            err.statusCode = 404
            throw err
        }
    
        const league = await League.findById(league_id).session(session)
        if (!league) {
            const err = new Error("League does not exist")
            err.statusCode = 404
            throw err
        }
    
        if (!league.users.includes(user._id)) {
            const err = new Error("User is not in this league")
            err.statusCode = 409
            throw err
        }
    
        league.users = league.users.filter(id => !id.equals(user._id))
        league.commissioners = league.commissioners.filter(id => !id.equals(user._id))
        league.teams.delete(user._id.toString())
        user.leagues = user.leagues.filter(id => !id.equals(league._id))
        
        await league.save({session})
        await user.save({session})

        await session.commitTransaction()
        session.endSession()
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

export async function upload_edited_contracts(updated_contracts, league_id, user_id) {
    const session = await mongoose.startSession()
    const changes = []

    const league = await League.findById(league_id)
    const user = await User.findById(user_id)
    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 404
        throw err
    }
    if (!verify_commissioner(league, user)) {
        const err = new Error("User is not the owner or a commissioner of this league")
        err.statusCode = 403
        throw err
    }
    try {
        session.startTransaction()
        for (const contract of updated_contracts) {
            if (String(contract.league_id) !== league_id) {
                const err = new Error("Contract is not for this league.")
                err.statusCode = 400
                throw err
            }
            const {_id, salary, start_year, end_year} = contract

            // Fetch the existing contract first
            const existingContract = await Contract.findById(_id).session(session);
            if (!existingContract) {
                const err = new Error(`Contract with ID ${_id} not found.`);
                err.statusCode = 404;
                throw err;
            }

            // Check if there are any changes
            const isChanged =
                existingContract.salary !== salary ||
                existingContract.start_year !== start_year ||
                existingContract.end_year !== end_year;

            if (!isChanged) {
                console.log(`No changes for contract ${_id}, skipping update.`);
                continue; // Skip this contract
            }

            const league = await League.findById(existingContract.league_id).session(session)
            const sleeper_league_id = league.sleeper_league_ids.get(String(new Date().getFullYear())) || "-1"

            const updatedContract = await Contract.findByIdAndUpdate(
                _id,
                {salary, start_year, end_year},
                {new: true, session}
            )

            const changes_made = {
                old_salary: existingContract.salary,
                new_salary: salary,
                old_start_year: existingContract.start_year,
                new_start_year: start_year,
                old_end_year: existingContract.end_year,
                new_end_year: end_year
            }

            // create the transaction document for this
            const txn = new Transaction({
                league_id: league._id,
                sleeper_league_id,
                players: [updatedContract.player_id],
                txn_time: updatedContract.updatedAt,
                type: "edit_contract",
                salary: updatedContract.salary,
                contract_id: existingContract._id,
                changes: changes_made
            })
            console.log("contract edited:", txn)
            await txn.save({session})
            changes.push(changes_made)
        }
        await session.commitTransaction()
        
        return changes
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        session.endSession()
    }
}

export async function save_league_settings(user_id, formData) {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format");
        err.statusCode = 400;
        throw err
    }

    const user = await User.findById(user_id)
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 400
        throw err
    }

    const league_id = formData._id
    const league = await League.findById(league_id)
    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 400
        throw err
    }

    const is_commish = verify_commissioner(league, user)
    if (!is_commish) {
        const err = new Error("User is not the owner or a commissioner of this league.")
        err.statusCode = 403
        throw err
    }

    const {
        auction_contract_length,
        rookie_contract_length,
        max_extension_length,
        extension_price_hike,
        rookie_salaries
    } = formData
   
    const result = await League.findByIdAndUpdate(
        league_id,
        {auction_contract_length, rookie_contract_length, max_extension_length, extension_price_hike, rookie_salaries},
        {new: true}
    )

    return result
}

export async function update_draft_rounds(league_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err
    }

    const league = await League.findById(league_id)
    const user = await User.findById(user_id)

    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 404
        throw err
    }

    // get the current number of draft rounds from Seeper
    const latest_year = Math.max(...league.sleeper_league_ids.keys())
    const sleeper_league_id = league.sleeper_league_ids.get(String(latest_year))
    const sleeper_league = await axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}`)
    if (!sleeper_league.data) {
        const err = new Error("Error accessing Sleeper API")
        err.statusCode = 502
        throw err
    }
    
    // number of draft rounds in the sleeper league's settings
    const sleeper_num_rounds = parseInt(sleeper_league.data.settings.draft_rounds)
    // number of draft rounds in the database's league document
    const db_num_rounds = league.rookie_salaries.size
    
    const new_salaries = new Map()
    // update to match current sleeper settings
    if (sleeper_num_rounds != db_num_rounds) {
        for (let round=1; round <= sleeper_num_rounds; round++) {
            const current_salary = league.rookie_salaries.get(round.toString())
            // console.log("current_salary:", current_salary)
            // if this round does not have a salary in the league document, set it to default
            if (!current_salary) {
                new_salaries.set(round.toString(), Math.ceil((league.salary_cap * 0.018) * (1/2) ** (round-1)))
            } else {
                new_salaries.set(round.toString(), current_salary)
            }
        }
        league.rookie_salaries = new_salaries
        await league.save()
    }
    // console.log(league.rookie_salaries)
    
    return {updated: (sleeper_num_rounds != db_num_rounds), rookie_salaries: league.rookie_salaries}
}

export async function create_contract(new_contract) {
    console.log("new contract")
    const session = await mongoose.startSession()

    try {
        session.startTransaction()
        // check if player already has a contract in this league 
        const current_contract = await Contract.findOne({
            player_id: new_contract.player_id,
            league_id: new_contract.league_id
        }).session(session)

        if (current_contract) {
            const err = new Error("Player already has a contract.")
            err.statusCode = 400
            throw err
        }

        const [created_contract] = await Contract.create([new_contract], {session})
        const league = await League.findById(created_contract.league_id).session(session)
        const txn = new Transaction({
            sleeper_league_id: league.sleeper_league_ids.get(String(new Date().getFullYear())) || "-1",
            league_id: league._id,
            players: [created_contract.player_id],
            txn_time: created_contract.createdAt,
            type: "create_contract",
            salary: created_contract.salary,
            contract_start_year: created_contract.start_year,
            contract_length: created_contract.end_year-created_contract.start_year+1,
            contract_id: created_contract._id
        })
        console.log("transaction:", txn)
        await txn.save({session})
        await session.commitTransaction()
        return created_contract
    } catch (err) {
        session.abortTransaction()
        throw err
    } finally {
        session.endSession()
    }

}

export async function get_standings_map(league_id) {
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format");
        err.statusCode = 400;
        throw err
    }

    const league = await League.findById(league_id)

    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }
    const standings_map = {}
    for (const [year, sleeper_league_id] of league.sleeper_league_ids) {
        const [league_res, user_res, roster_res] = await Promise.all([
            axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}`),
            axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/users`),
            axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/rosters`)
        ])

        const league_median = parseInt(league_res.data.settings?.league_average_match) === 1
        
        const divisions = Object.entries(league_res.data.metadata)
            .filter(([key]) => key.startsWith("division_"))
            .reduce((acc, [key, value]) => {
                const number = key.split("_")[1]
                acc[number] = value
                return acc
            }, {})

        let are_divisions
        if (Object.entries(divisions).length === 0) {
            divisions[-1] = ""
            are_divisions = false
        } else {
            are_divisions = true
        }

        // map roster id to team name
        const team_info = new Map(roster_res.data.map(team => {
            if (team.owner_id) {
                const team_info = user_res.data.find((user) => user.user_id === team.owner_id)
                return [team.roster_id, team_info.metadata.team_name || team_info.display_name]
                
            } else {
                return [team.roster_id, `Team ${team.roster_id}`]
            }
        }))



        const teams = roster_res.data.map(team => {
            const num_matchups = league_median ? team.metadata?.record?.length / 2 : team.metadata?.record?.length || 1
            return {
                roster_id: team.roster_id,
                team_name: team_info.get(team.roster_id),
                num_matchups,
                wins: team.settings.wins,
                losses: team.settings.losses,
                division: are_divisions ? team.settings.division : -1,
                points_for: (team.settings.fpts + team.settings.fpts_decimal / 100 ) || 0,
                points_against: (team.settings.fpts_against + team.settings.fpts_against_decimal / 100 ) || 0
            }
        })

        teams.sort((a, b) => {
            if (a.wins !== b.wins) {
                return b.wins - a.wins
            } else {
                return b.points_for - a.points_for
            }
        })

        const res = Object.entries(divisions).map(([divisionNumber, divisionName]) => {
            return {
                division_number: divisionNumber,
                division_name: divisionName,
                teams: teams
                    .filter(t => t.division === Number(divisionNumber))
            };
        })
        standings_map[year] = res
    }
    return standings_map
}

// map roster id to player ids
// function flipPlayerMap(playerMap) {
//     if (!playerMap) return {};
//     const rosterMap = {};
//     for (const [playerId, rosterId] of Object.entries(playerMap)) {
//         if (!rosterMap[rosterId]) rosterMap[rosterId] = [];
//         rosterMap[rosterId].push(playerId);
//     }
//     return rosterMap;
// }


// export async function upload_transaction(sleeperTxn, sleeper_league_id) {
//     const adds = build_roster_entries(sleeperTxn.adds)
//     const drops = build_roster_entries(sleeperTxn.drops)
//     const doc = {
//         _id: sleeperTxn.transaction_id,
//         sleeper_league_id,
//         roster_ids: sleeperTxn.roster_ids,
//         players: sleeperTxn.players,
//         adds,
//         drops,
//         txn_time: new Date(sleeperTxn.created),
//         type: sleeperTxn.type,
//         salary: sleeperTxn.settings?.waiver_bid || null
//     };

//     // Upsert to avoid duplicates
//     //await Transaction.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
//     // console.log("doc:", doc)
//     return doc
// }
function build_roster_entries(playerMap, type) {
    if (!playerMap) return []
    return Object.entries(playerMap).map(([player_id, roster_id])=> ({
        roster_id,
        player: player_id
    }))
}

// prepare Sleeper transaction to be inserted into the db
export function prepare_txn_doc(txn, league_id, sleeper_league_id) {
    // console.log("prepare:", league_id, sleeper_league_id)
    const adds = build_roster_entries(txn.adds);
    const drops = build_roster_entries(txn.drops);
    // console.log(adds)
    // console.log(drops)
    // console.log("-----------")
    // collect all players involved (adds, drops, extension)
    const player_ids = [
        ...(txn.players || []), // sleeper gives this flat array sometimes
        ...(txn.adds ? Object.keys(txn.adds) : []),
        ...(txn.drops ? Object.keys(txn.drops) : [])
    ];

    let salary = 0
    if (txn.type === "free_agent" && txn.adds !== null) {
        salary = 1
    } else if (txn.type === "waiver") {
        if (txn.settings?.waiver_bid) {
            salary = parseInt(txn.settings.waiver_bid)
        } else {
            salary = 1
        }
    }

    // if (txn.type === "trade") {
    //     console.log("Trade:", txn)
    // }

    return {
        updateOne: {
            filter: { 
                league_id,
                sleeper_txn_id: txn.transaction_id 
            },
            update: {
                $set: {
                    league_id,
                    sleeper_txn_id: txn.transaction_id,
                    sleeper_league_id,
                    adds,
                    drops,
                    draft_picks: txn.draft_picks,
                    players: [...new Set(player_ids)], // ensure uniqueness
                    txn_time: new Date(txn.created),
                    type: txn.type,
                    salary
                }
            },
            upsert: true
        }
    };
}

export async function get_latest_transactions(league_id, cursor, limit) {
    const query = { league_id}
    if (cursor) {
        query.txn_time = {$lt: cursor}
    }
    const transactions = await Transaction.find(query)
        .sort({txn_time: -1})
        .limit(limit+1)
        .populate(["players", "adds.player", "drops.player"])
    
    let nextCursor = null
    if (transactions.length > limit) {
        const next = transactions.pop()
        nextCursor = next.txn_time
    }
    
    return {
        transactions,
        nextCursor,
        hasNext: !!nextCursor
    }
}

export async function create_subscription(sleeper_league_id, league_id, user_id) {
    // validate
    if (!sleeper_league_id) {
        const err = new Error("No Sleeper league ID provided.")
        err.statusCode = 400
        throw err
    }

    if (!league_id) {
        const err = new Error("No league ID provided.")
        err.statusCode = 400
        throw err
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format")
        err.statusCode = 400
        throw err
    }

    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format")
        err.statusCode = 400
        throw err
    }

    // get Sleeper league
    const url = `https://api.sleeper.app/v1/league/${sleeper_league_id}`
    const {data: sleeper_league} = await axios.get(url)
    if (!sleeper_league) {
        const err = new Error(`League ${sleeper_league_id} does not exist on Sleeper`)
        err.statusCode = 404
        throw err
    }

    // validate the league year
    const season = parseInt(sleeper_league.season, 10)
    const now = new Date()
    const current_year = now.getFullYear()

    if (season < 2024 || season > current_year) {
        const err = new Error(`League season ${season} is invalid`)
        err.statusCode = 400
        throw err
    }

    // make sure not purchasing subscription for a league that is in the past
    if (current_year > season) {
        const err = new Error(`Attempting to purchase subscription for a ${season} Sleeper league which is in the past`)
        err.statusCode = 400
        throw err
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction()
        const league = await League.findById(league_id).session(session)
        const user = await User.findById(user_id).session(session)

        if (!user) {
            const err = new Error("User does not exist")
            err.statusCode = 404
            throw err
        }
        if (!league) {
            const err = new Error("League does not exist")
            err.statusCode = 404
            throw err
        }

        // if there is a previous league, make sure it matches with league.sleeper_league_ids
        if (sleeper_league.previous_league_id && sleeper_league.previous_league_id !== "0") {
            if (league.sleeper_league_ids.get(String(season-1)) !== sleeper_league.previous_league_id) {
                const err = new Error("Sleeper league ID is for a different league")
                err.statusCode = 400
                throw err
            }   
        }

        // check if this league already has a subscription
        const existing_subscription = await Subscription.findOne({
            sleeper_league_id
        }).session(session)
        console.log("existing:", existing_subscription)
        if (existing_subscription) {
            const err = new Error("Subscription already exists for this league")
            err.statusCode = 400
            throw err
        }

        const price = process.env.SUBSCRIPTION_PRICE
        // construct subscription document
        const new_subscription = new Subscription({
            purchased_by: user._id,
            purchased_at: new Date(),
            season,
            price,
            sleeper_league_id
        })

        // for re-newing a league - update sleeper league ids map
        league.sleeper_league_ids.set(String(season), sleeper_league_id)
        await league.save({session})
        await new_subscription.save({session})

        await session.commitTransaction()
        return new_subscription
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        await session.endSession()
    }

}

export async function fetch_league_sub_history(sleeper_league_id) {
    const sub_docs = []

    do {
        // loop over this league and all previous years of this league
        const url = `https://api.sleeper.app/v1/league/${sleeper_league_id}`
        const res = await axios.get(url)
        const league_name = res.data.name

        if (!res.data) {
            const err = new Error("League does not exist on sleeper.")
            err.statusCode = 404
            throw err
        }

        // get the subscription document for this league id
        const sub = await Subscription.findOne({sleeper_league_id}).populate("purchased_by", "username")
        if (sub) {
            const sub_obj = sub.toObject()
            sub_obj.league_name = league_name // inlude league name for frontend
            if (sub_obj) sub_docs.push(sub_obj)
        }
        sleeper_league_id = res.data.previous_league_id

    } while (sleeper_league_id && sleeper_league_id !== "0")

    return sub_docs
}

export async function fetch_user_sub_history(user_id) {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        const err = new Error("Invalid user ID format")
        err.statusCode = 400
        throw err
    }

    const user = await User.findById(user_id)
    if (!user) {
        const err = new Error("User does not exist")
        err.statusCode = 404
        throw err
    }

    const sub_history = await Subscription.find({purchased_by: user._id}).populate("purchased_by", "username")

       const enriched = await Promise.all(sub_history.map(async (sub) => {
        let league_name = null
        try {
            if (sub.sleeper_league_id) {
                const res = await axios.get(`https://api.sleeper.app/v1/league/${sub.sleeper_league_id}`)
                league_name = res.data.name || null
            }
        } catch (err) {
            console.error(`Error fetching league ${sub.sleeper_league_id}:`, err.message)
        }

        return {
            ...sub.toObject(),   // keep subscription fields
            league_name          // add league name
        }
    }))
    return enriched
}

export async function update_sleeper_leagues(league_id, sleeper_league_id) {
    // validate input
    if (!mongoose.Types.ObjectId.isValid(league_id)) {
        const err = new Error("Invalid league ID format")
        err.statusCode = 400
        throw err
    }
    if (!sleeper_league_id) {
        const err = new Error("No sleeper league ID provided")
        err.statusCode = 400
        throw err
    }

    // get this league and it's most recent ID and year
    const league = await League.findById(league_id)
    if (!league) {
        const err = new Error("League does not exist")
        err.statusCode = 404
        throw err
    }

    const years = Array.from(league.sleeper_league_ids.keys()).map(y => parseInt(y, 10))
    console.log(years)
    const max_year = Math.max(...years)
    console.log(max_year)
    const most_recent_id = league.sleeper_league_ids.get(String(max_year))
    console.log(most_recent_id)

    // helper to fetch safely from Sleeper
    async function fetchSleeperLeague(id) {
        try {
            const res = await axios.get(`https://api.sleeper.app/v1/league/${id}`);
            return res.data;
        } catch (e) {
            if (e.response && e.response.status === 404) {
                return null; // league does not exist
            }
            const err = new Error(`Error pulling data for league ${id}: ${e.message}`)
            err.statusCode = 502
            throw err
        }
    }

    // get the league being added
    let sleeper_league = await fetchSleeperLeague(sleeper_league_id)
    if (!sleeper_league) {
        const err = new Error(`Sleeper league with ID ${sleeper_league_id} does not exist`);
        err.statusCode = 404;
        throw err;
    }

    let year = parseInt(sleeper_league.season)
    let current_id = sleeper_league_id
    const leagues_to_insert = new Map()

    // Walk back until we hit the stored max_year
    while (year > max_year) {
        leagues_to_insert.set(year, sleeper_league.league_id);

        // If the next hop connects to our most recent stored league, success
        if (sleeper_league.previous_league_id === most_recent_id) {
            for (const [year, id] of leagues_to_insert) {
                league.sleeper_league_ids.set(String(year), id);
            }
            await league.save()
            return
        }

        // Otherwise, go one step back
        current_id = sleeper_league.previous_league_id;

        // end of chain -> wrong league
        if (!current_id || current_id === "0") {
            const err = new Error(
                `Sleeper league ID ${sleeper_league_id} is for a different league.`
            )
            err.statusCode = 400
            throw err
        }

        sleeper_league = await fetchSleeperLeague(current_id)
        if (!sleeper_league) {
            const err = new Error(`Error pulling data from Sleeper: ${current_id} was referenced as a previous league ID, but the league does not exist.`)
            err.statusCode = 502
            throw err
        }
        year = parseInt(sleeper_league.season);
    }
    
    const err = new Error(
    `Data integrity error: league chain from Sleeper ID ${sleeper_league_id} did not connect back to your stored most recent league (year ${max_year}, id ${most_recent_id}). This should never happen unless Sleeper's data is inconsistent or your database has corrupted league IDs.`
    );
    err.statusCode = 500; // internal error, not a user error
    throw err;
}