import axios from "axios"
import mongoose from "mongoose"
import pLimit from "p-limit"
import League from "../models/League.js"
import Contract from "../models/Contracts.js"
import Transaction from "../models/Transaction.js"
import {prepare_txn_doc} from "./league_service.js"

// Set a concurrency limit to prevent overwhelming the Sleeper API with requests.
const CONCURRENCY = 5
const limit = pLimit(CONCURRENCY)

// The interval for polling, in milliseconds.
const POLL_INTERVAL_MS = 5 * 60 * 1000

/**
 * Starts the transaction poller, which periodically checks for new transactions
 * on the Sleeper API and updates the local database.
 * @returns {function} A stop function to clear the polling interval.
 */
export function startTransactionPoller() {
    console.info("Starting transaction poller...");
    let intervalID

    async function pollOnce() {
        try {
            // Get all leagues in the database and poll transactions for them
            const leagues = await League.find({})
            await pollLeagues(leagues)
        } catch (err) {
            console.error("Error polling Sleeper transactions:", err);
        }
    }

    // Run the poller immediately and then set the interval.
    pollOnce();
    intervalID = setInterval(pollOnce, POLL_INTERVAL_MS);

    // Return a function to allow the poller to be stopped externally.
    function stop() {
        clearInterval(intervalID)
        console.info("Transaction poller stopped")
    }
    return stop
}

export async function pollLeagues(leagues) {
    const currentYear = new Date().getFullYear();

    // Create a map to group leagues by their shared Sleeper League ID.
    // This prevents duplicate API calls for leagues that belong to the same Sleeper instance.
    const sleeperMap = new Map();
    leagues.forEach(league => {
        const sleeperLeagueId = league.sleeper_league_ids.get(String(currentYear));
        // Only process leagues with a Sleeper ID for the current year.
        if (!sleeperLeagueId) return;
        if (!sleeperMap.has(sleeperLeagueId)) sleeperMap.set(sleeperLeagueId, []);
        sleeperMap.get(sleeperLeagueId).push(league);

        // const sleeper_league_ids = [...league.sleeper_league_ids.values()]
        // console.log('sleeper league ids:', sleeper_league_ids)
        // if (sleeper_league_ids.length == 0) return
        // for (const id of sleeper_league_ids) {
        //     if (!sleeperMap.has(id)) sleeperMap.set(id, []);
        //     sleeperMap.get(id).push(league);
        // }
        // need to fix
        // need to go to last round for previous years
        // fix sorting by date issue
    });
    // Use p-limit to poll each unique Sleeper league concurrently.
    await Promise.all(
        Array.from(sleeperMap.entries()).map(([sleeperLeagueId, relatedLeagues]) =>
            limit(() => pollLeagueTransactions(sleeperLeagueId, relatedLeagues))
        )
    )
}

/**
 * Fetches the current NFL week from the Sleeper API.
 * @returns {Promise<number>} The current week, or -1 if an error occurs.
 */
async function getRound() {
    try {
        const { data } = await axios.get("https://api.sleeper.app/v1/state/nfl");
        // Sleeper's week data can be a string or number. Parse it to an integer.
        const week = parseInt(data.week, 10);
        // Sleeper's 'pre' season can have a week of 0. We'll default to 1 for our logic.
        console.log("Season_type:", data.season_type)
        if (data.season_type === "pre") {
            console.log("Current round: 1")
            return 1
        }
        return week || 1
    } catch (err) {
        console.warn("Failed to fetch current round:", err.message);
        return -1;
    }
}

/**
 * Polls transactions for a single Sleeper league ID and updates all related local leagues.
 * The logic is updated to handle each related league's polling state individually.
 * @param {string} sleeperLeagueId The unique ID of the Sleeper league.
 * @param {Array<object>} relatedLeagues An array of local League documents that use this Sleeper ID.
 */
async function pollLeagueTransactions(sleeperLeagueId, relatedLeagues) {
    console.log(`Processing Sleeper league ID: ${sleeperLeagueId}`);
    const currentRound = await getRound();
    if (currentRound === -1) {
        console.warn(`Could not get current round for league ${sleeperLeagueId}, skipping.`);
        return;
    }

    // Iterate through each of the related leagues to handle their polling state
    // Use promise.all for concurrency
    //await Promise.all(relatedLeagues.map(async (league) => {
    for (const league of relatedLeagues) {
        const currentYear = new Date().getFullYear()
        const sleeper_league_id = league.sleeper_league_ids.get(currentYear.toString())
        console.log("sleeper_league_id:", sleeper_league_id)
        console.log("last checked:", league.last_checked_txn.get(sleeper_league_id))
        const lastCheckedTxn = league.last_checked_txn?.get(sleeperLeagueId) || { round: 1, txn_id: "" };
        let startRound = parseInt(lastCheckedTxn.round, 10) || 1 // latest round that has been polled for this league
        let latestTxnID = lastCheckedTxn.txn_id // latest transaction_id that has been polled for this league
        console.log("latestTxnID:", latestTxnID)

        // Ensure we don't try to poll from before the first week.
        if (startRound < 1) {
            startRound = 1;
        }

        console.log(`- League ${league._id}: Starting from round ${startRound} and last transaction ID [${latestTxnID}]`);

        let newLatestTxnID = latestTxnID;
        let newTxnFound = false

        // Fetch and process transactions for all rounds from the league's last checked round to the current round.
        for (let round = startRound; round <= currentRound; round++) {
            const url = `https://api.sleeper.app/v1/league/${sleeperLeagueId}/transactions/${round}`;
            
            try {
                const { data: transactions } = await axios.get(url);
                if (!transactions || transactions.length === 0) continue
                
                let newTransactions = [];

                if (transactions.length > 0) {
                    // Sleeper API returns transactions from newest to oldest.

                    // If we are in the start round and have a last-checked transaction ID,
                    // only want to include up to the last checked transaction
                    // console.log("condition:", Boolean(round === startRound && latestTxnID))
                    if (round === startRound && latestTxnID) {
                        // let i = 1
                        for (const txn of transactions) {
                            // console.log("loop", i)
                            if (txn.transaction_id === latestTxnID) {
                                break; // Stop when we find the last transaction we already processed.
                            }
                            newTransactions.push(txn)
                        }
                    } else {
                        // If it's a new round (hasn't been polled yet) for this league, process all transactions in it.
                        newTransactions = transactions;
                    }

                    // now new transactions found --> continue to next league
                    if (newTransactions.length === 0){
                        console.log(`League ${league._id}: no new transactions found.`)
                        continue
                    }

                    // Process transactions from oldest to newest to ensure they are applied chronologically.
                    newLatestTxnID = transactions[0].transaction_id
                    newTransactions.reverse()
                    newTxnFound = true

                    const db_success = await processTransactions(newTransactions, league, sleeperLeagueId, round);
                    if (!db_success) {
                        console.warn(`- League ${league._id}: DB operation failed, aborting last_checked_txn update.`);
                        return; // Skip updating last_checked_txn for this league
                    }
                }
            } catch (err) {
                console.error(`Error fetching transactions for league ${sleeperLeagueId}, round ${round}:`, err.message);
                // Continue to the next round even if one fails.
            }
        }

    }

}

/**
 * Processes a list of new transactions to identify adds, drops, and waiver pickups.
 * @param {Array<object>} transactions The array of new Sleeper transactions.
 * @param {string} sleeperLeagueID The Sleeper League ID.
 */
async function processTransactions(transactions, league, sleeper_league_id, round) {
    // console.log(transactions)
    const adds = []
    const drops = []
    const waiverPickups = []
    const bulk_txns = []

    // for updating league
    const new_latest_txn_id = transactions[transactions.length-1].transaction_id

    for (const txn of transactions) {
        const addIDs = Object.keys(txn.adds || {})
        const dropIDs = Object.keys(txn.drops || {})
        const txnTime = new Date(txn.status_updated)

        if (txn.status === "complete") {
            bulk_txns.push(prepare_txn_doc(txn, league._id, sleeper_league_id))
        }

        // Classify transactions and extract relevant info
        if (txn.type === "free_agent" || txn.type === "commissioner") {
            dropIDs.forEach(player_id => drops.push({ player_id, time: txnTime }))
            addIDs.forEach(player_id => adds.push({ player_id, time: txnTime, salary: 1 }))
        } else if (txn.type === "waiver" && txn.status === "complete") {
            const salary = parseInt(txn.settings?.waiver_bid, 10) || 1
            addIDs.forEach(player_id => waiverPickups.push({ player_id, time: txnTime, salary }))
            dropIDs.forEach(player_id => drops.push({ player_id, time: txnTime }))
        }
    }

    try {
        // Create & delete contracts and create transaction documents to log these actions
        const success = await applyTransactions(adds, drops, waiverPickups, bulk_txns, league, sleeper_league_id, round, new_latest_txn_id);
        return success
    } catch (err) {
        console.error("Error applying applying transactions:", err.message)
        return false
    }
}

/**
 * Applies the changes from processed transactions to the database.
 * @param {Array<object>} adds An array of player to add.
 * @param {Array<object>} drops An array of player to drop.
 * @param {Array<object>} waiverPickups An array of players picked up on waivers.
 * @param {Object} league The league document
 */
async function applyTransactions(adds, drops, waiverPickups, txn_ops, league, sleeper_league_id, round, new_latest_txn_id) {
    const session = await mongoose.startSession()
    session.startTransaction()
    const currentYear = new Date().getFullYear();

    try {
        // Delete contracts of players that have been dropped
        // Only delete contracts that were created before the transactions
        if (drops.length > 0) {
            const result = await Contract.deleteMany({
                $or: drops.map(drop => ({
                    player_id: drop.player_id,
                    league_id: league._id,
                    start_year: { $lte: currentYear },
                    end_year: { $gte: currentYear },
                    terminated_early: false,
                    import_time: { $lt: drop.time } // only delete a contract if it was imported before this drop occured
                }))
            }).session(session)
            console.info(`Deleted ${result.deletedCount} contracts for league ${league._id}.`);
        }

        const buildContracts = (players, type) => {
            const contracts = [];
            for (const p of players) {
                contracts.push({
                    player_id: p.player_id,
                    league_id: league._id,
                    draft_id: "1", // Not from a draft - hard-code to 1 to indicate contract was from polling
                    salary: p.salary,
                    start_year: currentYear,
                    end_year: currentYear,
                    contract_type: type,
                    extension_eligible: false,
                    terminated_early: false,
                    txn_time: p.time,
                    import_time: p.time,
                    createdAt: p.time
                });
            }
            return contracts;
        };
        

        // combined free agent aand waiver adds into one array
        const addContracts = buildContracts(adds, "waiver");
        const waiverContracts = buildContracts(waiverPickups, "waiver");
        const allContracts = [...addContracts, ...waiverContracts];


        const batchSize = 50
        // for (let i = 0; i < allContracts.length; i++) {
        //     const batch = allContracts.slice(i, i+batchSize)

        //     // get list of player IDs in this batch
        //     const player_ids = batch.map(c => c.player_id)
        //     const existing_contracts = await Contract.find({
        //         player_id: {$in: player_ids},
        //         league_id: league._id,
        //         terminated_early: false
        //     }).session(session)

        //     // filter out players who already have a contract
        //     const existing_player_ids = new Set(existing_contracts.map(c => c.player_id))
        //     const contract_docs = batch.filter(c => !existing_player_ids.has(c.player_id))

        //     if (contract_docs.length === 0) {
        //         console.log(`No new contracts to insert for this batch in league ${league._id}`);
        //         continue
        //     }

        //     // build bulk write operations
        //     const contract_ops = contract_docs.map(c => ({
        //         insertOne: {document: c}
        //     }))
        //     await Contract.bulkWrite(contract_ops, {session})
        // }

        // create the new contracts for all players that were added
        // only create new contracts if one doesn't exist already
        let insert_count = 0
        if (allContracts.length > 0) {
            const add_ops = allContracts.map(contract => ({
                updateOne: {
                    filter: {
                        player_id: contract.player_id,
                        league_id: contract.league_id,
                        terminated_early: false
                    },
                    update: {$setOnInsert: contract},
                    upsert: true
                }
            }))

            for (let i = 0; i < add_ops.length; i += batchSize) {
                const batch = add_ops.slice(i, i + batchSize);
                const res = await Contract.bulkWrite(batch, { session })
                insert_count += res.upsertedCount
            }
            console.info(`Upserted ${insert_count} contracts for league ${league._id}`)
        }

        // create corresonding transaction documents
        let txn_count = 0
        if (txn_ops.length > 0) {
            for (let i = 0; i < txn_ops.length; i+= batchSize) {
                const batch = txn_ops.slice(i, i+batchSize)
                const res = await Transaction.bulkWrite(batch, {session})
                txn_count += res.insertedCount
            }
            console.info(`Created ${txn_count} transaction records for league ${league._id}`)
        }

        // update last_checked_txn for this league
        league.last_checked_txn.set(String(sleeper_league_id), {
            round,
            txn_id: new_latest_txn_id
        })
        await league.save({session})
        
        console.log(`League ${league._id}: Updated last checked to round ${round}, txn_id ${new_latest_txn_id}.`);

        await session.commitTransaction()
        return true
    } catch (err) {
        await session.abortTransaction()
        console.error(`Transaction error for league ${league._id}:`, err.message)
        return false
    } finally {
        session.endSession()
    }
}