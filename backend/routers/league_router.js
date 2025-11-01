import express from "express";
import {
  get_user_subscriptions, get_league_subscriptions, get_standings,
  get_transactions, search_users, new_contract, delete_contract,
  edit_contracts, add_user, remove_user, setup_league,
  update_league_settings, update_assignments, get_player_info,
  get_rosters, get_users, import_draft, delete_draft,
  search_league_get, search_league_post, get_drafts, get_picks,
  deactivate_league, find_leagues, extend_contract, update_num_draft_rounds,
  purchase_subscription, add_sleeper_league, create_checkout_session
} from "../controllers/league_controller.js";

import { verify_token } from "../middleware/verify_token.js";

const router = express.Router();

// League setup & subscription
router.post("/setup", verify_token, setup_league);
router.post("/subscribe", verify_token, purchase_subscription);
router.post("/add-sleeper-league", verify_token, add_sleeper_league)
// purchase
router.post("/create-checkout-session", verify_token, create_checkout_session)

// League info routes
router.get("/:sleeper_league_id/subscription-history", get_league_subscriptions);
router.delete("/:league_id/delete", verify_token, deactivate_league);
router.put("/:league_id/update-settings", verify_token, update_league_settings);
router.put("/:league_id/update-rounds", verify_token, update_num_draft_rounds);
router.post("/:league_id/player-info", get_player_info);

// League search
router.post("/leagues/search", find_leagues);
router.get("/leagues/:league_id", search_league_get);
router.post("/leagues", search_league_post);

// Rosters, standings, transactions
router.get("/leagues/:league_id/rosters", get_rosters);
router.get("/leagues/:league_id/standings", get_standings);
router.get("/leagues/:league_id/transactions", get_transactions);
router.get("/leagues/:league_id/users", get_users);
router.put("/leagues/:league_id/edit-members", update_assignments);

// Draft routes
router.get("/:league_id/drafts", get_drafts);
router.get("/drafts/:draft_id/picks", get_picks);
router.get("/:league_id/drafts/:draft_id/import", verify_token, import_draft);
router.delete("/:league_id/drafts/:draft_id/delete", verify_token, delete_draft);

// Contracts
router.post("/:league_id/contracts/extend/:contract_id", verify_token, extend_contract);
router.post("/:league_id/contracts/edit", verify_token, edit_contracts);
router.delete("/contracts/delete/:contract_id", delete_contract);
router.post("/contracts/create", new_contract);

// Users
router.get("/users/search", search_users);
router.post("/leagues/:league_id/users", add_user);
router.delete("/leagues/:league_id/users/:user_id", remove_user);
router.get("/users/sub-history", get_user_subscriptions);

export default router;