import {create_subscription, get_latest_transactions, import_contracts, delete_contracts, create_contract, get_players, delete_league, fetch_league, fetch_multiple_leagues, fetch_users, save_assignments, upload_contract_extension, get_users_by_username, add_user_to_league, remove_user_from_league, upload_edited_contracts, save_league_settings, update_draft_rounds, delete_one_contract, get_standings_map, fetch_league_sub_history, fetch_user_sub_history, update_sleeper_leagues} from '../services/league_service.js'
import { pollLeagues } from '../services/transaction_poller.js'
import mongoose from "mongoose"
import axios from "axios"
axios.defaults.timeout = 5000
import User from '../models/User.js'
import League from '../models/League.js'
import league_validation_schema from '../validation/League.js'
import { most_recent_league_id } from '../services/league_service.js'
import Stripe from 'stripe'

// create a league document with this league's settings
export async function setup_league(req, res) {
  const session = await mongoose.startSession()

  try {
    // server-side validation of form data
    session.startTransaction()
    const validated = await league_validation_schema.validateAsync(req.body)

    // guaranteed to exist bc of verify_token middleware
    const user_id = req.user.user_id
    const user = await User.findById(user_id).session(session)
    // get the submitted form data
    const {
        sleeper_league_id,
        salary_cap,
        rookie_contract_length, 
        auction_contract_length, 
        max_extension_length,
        extension_price_hike,
        rookie_salaries
    } = validated

    const sleeper_league_ids = {}
    let current_id = sleeper_league_id
    while (current_id && current_id !== "0") {
      const response = await axios.get(`https://api.sleeper.app/v1/league/${current_id}`)
      sleeper_league_ids[Number(response.data.season)] = response.data.league_id
      current_id = response.data.previous_league_id
    }

    const league = new League({
      sleeper_league_ids,
      salary_cap,
      rookie_contract_length, 
      auction_contract_length, 
      max_extension_length, 
      extension_price_hike,
      rookie_salaries,
      commissioners: [user._id],
      users: [user._id],
      owner: user._id,
      last_checked_txn: new Map()
    })

    await league.save({session}) // create league document
    user.leagues.push(league._id) // add to list of leagues for this user
    await user.save({session})

    await session.commitTransaction()

    await pollLeagues([league]) // poll transactions
    return res.status(201).json({message: "League setup complete", league})
  } catch (err) {
      console.error("Error setting up league: ", err.message)
      await session.abortTransaction()
      if (err.isJoi) {
        res.status(400).json({error: err.details[0].message})
        return
      }
      console.error("Error setting up league: ", err.message)
      res.status(500).json({error: "Internal server error"})
  } finally {
      session.endSession()
  }

}

export async function purchase_subscription(req, res) {
    const {sleeper_league_id, league_id} = req.body
    const user = req.user
    try {
      await create_subscription(sleeper_league_id, league_id, user.user_id)
      res.json({success: true, message: "Subscription purchased"})
    } catch (err) {
      const status = err.statusCode || 500
      res.status(status).json({success: false, message: err.message}) 
    }
}

export async function get_league_subscriptions(req, res) {
  const {sleeper_league_id} = req.params
  try {
    const data = await fetch_league_sub_history(sleeper_league_id)
    res.json({success: true, history: data})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message}) 
  }
}

export async function deactivate_league(req, res) {
  const {league_id} = req.params
  const {password} = req.body
  if (!password) {
    return res.status(400).json({success: false, message: "No password provided"})
  }
  const user_id = req.user.user_id // verified by JWT

  try {
    await delete_league(league_id, user_id, password)
    res.json({success: true, message: "League deleted successfully"})
    return
  } catch (error) {
      const status = error.statusCode || 500
      res.status(status).json({success: false, message: error.message})
  }
}

// given username or league id, search for leagues
export async function find_leagues(req, res) {
  const { username, league_id } = req.body;
  // neither provided: error
  if (!username && !league_id) {
    res.status(400).json({ error: "No input provided" });
    return
  }

  let leagues = [];
  
  // username is provided
  if (username) {
    try {  
      //get user's ID
      const user_data = await axios.get(`https://api.sleeper.app/v1/user/${username}`)
      const user_id = user_data.data.user_id

      // using user_id, get all dynasty leagues that use FAAB waivers
      const league_data = await axios.get(
      `https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/${new Date().getFullYear()}`
      );
      
      leagues = league_data.data
      .filter(
          (league) =>
          league.settings.type === 2 && // dynasty
          league.settings.waiver_type === 2 && // FAAB
          (!league_id || league.league_id !== league_id) // avoid duplicates
      )
      .map((league) => ({
          league_id: league.league_id,
          name: league.name,
          season: league.season
      }));
    } catch (err) {
      console.error(`Sleeper user ${username} does not exist`)
    }
  }

  // league_id provided
  if (league_id) {
    // console.log("searching by league id...")
    try {
      // using league_id, get info about the league      
      const league_resp = await axios.get(`https://api.sleeper.app/v1/league/${league_id}`);
      const league = league_resp.data;
      // console.log(league)

      if (
          league.settings.type === 2 && // dynasty
          league.settings.waiver_type === 2 // FAAB
      ) {
      leagues.push({
          league_id: league.league_id,
          name: league.name,
          season: league.season
      });
      }
    } catch (err) {
      console.error(`League ID ${league_id} does not exist.`)
    }
  }

  // check if no leagues found after checking username and league id
  if (leagues.length === 0) {
    return res.status(404).json({error: "No leagues found"})
  }


  // chech if league has an auction draft
  try {
  const auction_leagues = await Promise.all(
    leagues.map(async (league) => {
      try {
        const response = await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/drafts`)
        
        let auction = false
        let auction_budget = 200 // default value if league doesn't have an auction draft
        // find the first auction draft
        for (let i = response.data.length-1; i >=0; i--) {
          const draft = response.data[i]
          // console.log("draft:", draft)
          if (draft.type === "auction") {
            auction = true
            auction_budget = draft.settings.budget
            break
          }
        }

        return {
          ...league,
          auction,
          auction_budget
        }

      } catch (err) {
        console.error(`Failed to fetch drafts for league with ID ${league.league_id}:`, err.message);
        return null;
      }
    })
  );

  // filter out the nulls returned by the map function
  const filtered_leagues = auction_leagues.filter(Boolean);
  // console.log("filtered leagues:", filtered_leagues)
  res.json(filtered_leagues);
  } catch (err) {
    console.error("Error getting leagues:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

// get league by ID
export async function search_league_get(req, res) {
  const league_id = req.params.league_id

  if (!mongoose.Types.ObjectId.isValid(league_id)) {
    res.status(400).json({error: "Invalid league ID format"})
    return
  }

  try {
    const league = await fetch_league(league_id)
    res.json({success: true, league})
  } catch (error) {
    const status = error.status_code || 500
    res.status(status).json({error: error.message})
  }
}
// get multiple leagues by ID
// export async function search_league_post(req, res) {
//   const {league_ids} = req.body

//   try {
//     // no IDs provided
//     if (!league_ids.length) {
//       const err = new Error("No league IDs provided")
//       err.status_code = 400
//       throw err
//     }
//     // invalid ID provided
//     for (const id of league_ids) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//           const err = new Error(`${id} is an invalid league ID`);
//           err.status_code = 400;
//           throw err;
//       }
//   }
//     const leagues = await fetch_multiple_leagues(league_ids)
//     res.json({success: true, leagues})
//   } catch (error) {
//     const status = error.status_code || 500
//     res.status(status).json({error: error.message})
//   }
// }


export async function search_league_post(req, res) {
  const {league_ids} = req.body
  
  if (!Array.isArray(league_ids) || league_ids.length === 0) {
    res.status(400).json({error: "No league IDs provided"})
    return
  }

  const valid_ids = league_ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => id.toString())
  
  if (valid_ids.length === 0) {
    res.status(400).json({error: "No valid league IDs provided"})
    return
  }

  try {
    const leagues = await fetch_multiple_leagues(valid_ids)
    const found_ids = leagues.map(league => league._id.toString())
    const missing_ids = valid_ids.filter(id => !found_ids.includes(id))
    res.json({
      leagues,
      missing_ids
    })

  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function update_league_settings(req, res) {
  const user_id = req.user.user_id
  const {formData} = req.body
  try {
    await save_league_settings(user_id, formData)
    res.json({success: true, message: "League settings updated"})
  } catch (err) {
    const status = err.statusCode || 500
    console.error("Error updating league settings:", err.message)
    res.status(status).json({success: false, message: err.message})
  }
}

export async function get_player_info(req, res) {
    const league_id = req.params.league_id
    const player_ids = req.body // array of player ids
    try {
        const data = await get_players(league_id, player_ids)
        res.send(data)
    } catch (error) {
        res.status(500).json({error: "Internal server error - failed to get player data"})
    }
}

export async function get_rosters(req, res) {
  try {
    const {league_id} = req.params

    if (!mongoose.Types.ObjectId.isValid(league_id)) {
      res.status(400).json({error: "Invalid league ID format"})
      return
    }

    const league = await League.findById(league_id)

    if (!league) {
      res.status(404).json({error: "League does not exist"})
      return
    }

    // get users and rosters for this league
    const sleeper_league_id = most_recent_league_id(league)
    // const sleeper_league_id = league.sleeper_league_ids.get(new Date().getFullYear().toString())
    if (!sleeper_league_id) {
      res.status(400).json({error: "League is not associated with any Sleeper league ID"})
      return
    }
    const [user_res, roster_res] = await Promise.all([
      axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/users`),
      axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/rosters`)
    ])

    // join the name of team/username from user_res with the data from roster_res (roster_id, players)
    const combined = roster_res.data.map(team => {
          // if team has an owner, get the team info from the user_res
          if (team.owner_id) {
              const team_info = user_res.data.find((user) => user.user_id === team.owner_id)
              return {
                  name: team_info.metadata.team_name || team_info.display_name,
                  roster_id: team.roster_id,
                  players: team.players
              }
          } else {
              return {
                  name: `Team ${team.roster_id}`,
                  roster_id: team.roster_id,
                  players: team.players
              }
          }
      })

    // giant list of all player ids from all the players rostered
    // use api to get player info (name, position, team etc.)
    const all_player_ids = combined.flatMap(team => team.players || [])
    const response = await axios.post(
        `http://localhost:5000/api/${league_id}/player-info`,
        all_player_ids
    )
    
    // map roster_id to list of players
    const roster_player_map = {};
    for (const team of combined) {
        const team_player_ids = new Set(team.players)

        roster_player_map[team.roster_id] = response.data
                .filter(player => team_player_ids.has(player._id)) // filter to only include players on this team
                .sort((a, b) => { // sort by salary
                const asal = a.contracts?.[0]?.salary || 0;
                const bsal = b.contracts?.[0]?.salary || 0;
                return bsal - asal || a.full_name.localeCompare(b.full_name);
        });
    }

    // list objects with team name and roster id
    const team_info = combined.map(t => ({name: t.name, roster_id: t.roster_id}))
    res.json({team_info, teams: league.teams, roster_player_map})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({error: `Error fetching rosters: ${err.message}`})
  }
}

export async function get_users(req, res) {
  try {
    const {league_id} = req.params
    const users = await fetch_users(league_id)
    res.json(users)
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({error: `Error getting users: ${err.message}`})
  }
}

export async function update_assignments(req, res) {
  try {
    const {assignments, commissioners} = req.body
    const {league_id} = req.params
    await save_assignments(league_id, assignments, commissioners)
    res.json({success: true, message: "Team assignments updated."})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message})
  }
}

  export async function get_drafts(req, res) {
    const {league_id} = req.params
    try {
      if (!mongoose.Types.ObjectId.isValid(league_id)) {
        res.status(400).json({error: "Invalid league ID format"})
        return
      }
      const league = await League.findById(league_id)

      if (!league) {
      res.status(404).json({error: "League does not exist"})
        return
      }

      let all_drafts = []
      for (const [year, sleeper_league_id] of league.sleeper_league_ids) {
        const response = await axios.get(`https://api.sleeper.app/v1/league/${sleeper_league_id}/drafts`)

        for (const draft of response.data) {
          const picks = await axios.get(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`)
          let all_rookies = true
          let all_vets = true

          for (const pick of picks.data) {
            const years_exp = parseInt(pick.metadata.years_exp)
            if (years_exp > 0) {
              all_rookies = false
            } else {
              all_vets = false
            }
          }
          
          if (picks.data.length === 0) {
            all_rookies = false
            all_vets = false
          }
          
          draft.rookie_draft = all_rookies
          draft.veteran_draft = all_vets
          if (draft.type === "auction") {
            draft.budget = 200
          }
          all_drafts.push(draft)
        }
      }

      const drafts = all_drafts.map(draft => ({
        draft_id: draft.draft_id,
        sleeper_league_id: draft.league_id,
        season: draft.season,
        season_type: draft.season_type,
        start_time: draft.start_time,
        status: draft.status,
        type: draft.type,
        imported: league.imported_drafts.some(d => d.draft_id === draft.draft_id),
        rookie_draft: draft.rookie_draft,
        veteran_draft: draft.veteran_draft,
        budget: draft?.budget || -1
      }))

      res.json(drafts.sort((a,b) => {
        return Number(a.start_time) - Number(b.start_time)
      }))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          res.status(err.response.status).json({error: err.response.data?.error || "Sleeper API error"})
          return
        } else if (err.request) {
          res.status(502).json({error: "No response from Sleeper API"})
          return
        } else {
          res.status(500).json({error: `Something went wrong: ${err.message}`})
          return
        }
      }
      const status = err.statusCode || 500
      res.status(status).json({error: err.message})
    }
  }

export async function get_picks(req, res) {
  // const draft_id = req.params.draft_id;
  // try {
  //     const response = await axios.get(`https://api.sleeper.app/v1/draft/${draft_id}/picks`)
  //     res.json(response.data)
  // } catch (error) {
  //     console.error(error.message)
  //     res.status(500).json({error: "Failed to fetch pick data"})
  // }
}

// given league_id, use the sleeper API to get the results of the startup auction and insert contracts into the DB
export async function import_draft(req, res) {
  const {draft_id, league_id} = req.params
  const user_id = req.user.user_id
  const overwrite = req.query.overwrite === "true"
  try {
      const count = await import_contracts(league_id, user_id, draft_id, overwrite)
      res.json({success: true, message: `Imported ${count} contracts`})
  } catch (error) {
      const status = error.statusCode || 500
      console.error("Error importing draft:", error.message)
      res.status(status).json({success: false, message: error.message})
  }
}

export async function delete_draft(req, res) {
  console.log("delete route")
  const {league_id, draft_id} = req.params
  const user_id = req.user.user_id
  console.log(req.user)
  try {
    const count = await delete_contracts(league_id, user_id, draft_id)

    if (count === 0) {
      res.status(404).json({message: "No contracts found"})
      return
    }

    res.json({message: `Deleted ${count} contracts`})
  } catch (error) {
    console.error("Error deleting draft:", error.message)
    const status = error.statusCode || 500
    res.status(status).json({error: error.message || "Internal server error"})
  }
}

export async function delete_contract(req, res) {
  const {contract_id} = req.params
  try {
    const deleted_contract = await delete_one_contract(contract_id)
    res.status(200).json({success: true, message: "Contract deleted.", deleted_contract})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function extend_contract(req, res) {
  const {contract_id} = req.params
  const {length} = req.body
  const user_id = req.user.user_id
  try {
    await upload_contract_extension(contract_id, user_id, length)
    res.json({success: true, message: "Contract extended"})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function search_users(req, res) {
  const query = req.query.username
  const limit = req.query.limit
  const safe_query = escapeRegex(query)
  
  try {
    const results = await get_users_by_username(safe_query, limit)
    res.json({sucess: true, results})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function add_user(req, res) {
  const {league_id} = req.params
  const {user_id} = req.body
  try {
    await add_user_to_league(league_id, user_id)
    res.status(201).json({success: true, message: "User added to league"})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function remove_user(req, res) {
  const {league_id, user_id} = req.params
  if (!league_id || !user_id) {
    res.status(400).json({sucess: false, message: "Missing parameter(s)"})
    return
  }
  try {
    await remove_user_from_league(league_id, user_id)
    res.status(201).json({success: true, message: "User removed league"})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function edit_contracts(req, res) {
  const {league_id} = req.params
  const {new_contracts} = req.body
  const user_id = req.user.user_id
  
  if (!new_contracts.length) {
    res.status(400).json({sucess: false, message: "new_contracts is not an array"})
  }
  try {
    const changes = await upload_edited_contracts(new_contracts, league_id, user_id)
    res.json({success: true, message: "Contracts updated", changes})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function update_num_draft_rounds(req, res) {
  const {league_id} = req.params
  const user_id = req.user.user_id
  try {
    const data = await update_draft_rounds(league_id, user_id)
    res.json({success: true, message: (data.updated ? "Draft rounds updated" : "Draft rounds already up to date"), updated: data.updated, salary_map: Object.fromEntries(data.rookie_salaries)})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function new_contract(req, res) {
  const contract = req.body
  try {
    const new_contract = await create_contract(contract)
    res.json({success: true, data: new_contract})
  } catch (err) {
    const status = err.statusCode || 500
    console.error(err.message)
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function get_standings(req, res) {
  const {league_id} = req.params
  try {
    const standings_map = await get_standings_map(league_id)
    res.status(200).json({success: true, standings_map})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function get_transactions(req, res) {
  try {
    const {league_id} = req.params
    const limit = parseInt(req.query.limit) || 10
    const cursor = req.query.cursor || null

    const {transactions, nextCursor, hasNext} = await get_latest_transactions(league_id, cursor, limit)
    res.json({success: true, transactions, hasNext, nextCursor})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function get_user_subscriptions(req, res) {
  const {user_id} = req.query
  try {
    const sub_history = await fetch_user_sub_history(user_id)
    res.status(200).json({success: true, sub_history})
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({success: false, message: err.message || "Internal server error"})
  }
}

export async function add_sleeper_league(req, res) {
  const {league_id, sleeper_league_id} = req.body
  try {
    await update_sleeper_leagues(league_id, sleeper_league_id)
    res.json({success: true, message: "League added successfully"})
  } catch (err) {
    const status = err.statusCode || 500
    const message = err.message || "Internal server error"
    res.status(status).json({success: false, message})
  }
}

export async function create_checkout_session(req, res) {
    try {
      const {amount, year} = req.body
      if (!amount || !productName) {
        res.status(400).json({ success: false, message: "Missing amount or product name" });
        return
      }

      // create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],  // Accept credit/debit cards
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Subscription for ${year} season`,
              },
              unit_amount: amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",  // One-time payment
        billing_address_collection: "required",
        success_url: "http://google.com",
        cancel_url: "http://youtube.com",
      })

      res.status(200).json({success: true, url: session.url})
    } catch (err) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({success: false, message: err.message})
    }
}