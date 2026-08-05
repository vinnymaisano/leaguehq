import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from "axios"
import { useAuth } from './AuthContext'
import {is_subscription_active, league_display_name} from "../utils/utils.js"
import Spinner from '../components/Spinner.jsx'

const LeagueContext = createContext()

export function LeagueProvider({children}) {
    const {league_id} = useParams()
    const [league, setLeague] = useState(null)
    const [leagueYear, setLeagueYear] = useState(-1)
    const [loadingLeague, setLoadingLeague] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [isCommish, setIsCommish] = useState(false)
    const {user, loadingAuth} = useAuth()
    const [subHistory, setSubHistory] = useState(null)
    const [subStatus, setSubStatus] = useState(false)
    const [ready, setReady] = useState(false)
    const location = useLocation()

    // console.log(location.pathname, location.pathname.includes("dashboard"))
    // set title
    let page = ""
    if (location.pathname.includes("rosters")) {
      page = "Rosters"
    } else if (location.pathname.includes("contracts")) {
      page = "Contracts"
    } else if (location.pathname.includes("trade-center")) {
      page = "Trade Center"
    } else if (location.pathname.includes("settings")) {
      page = "Settings"
    } else {
      page = "Dashboard"
    }
    // only set if league has loaded
    if (league) {
      document.title = `${page ? `${page} -` : ""} ${league_display_name(league)} |  LeagueHQ`
    }

    useEffect(()=> {
      if (!user && !loadingAuth) return

      const get_league = async() => {
        try {
          setLoadingLeague(true)
          const response = await axios.get(`/api/leagues/${league_id}`)

          const league_data = response.data.league
          setLeague(league_data)

          const league_year = Math.max(...Object.keys(league_data.sleeper_league_ids))
          setLeagueYear(Number(league_year))

          if (user) {
            setIsCommish(league_data.commissioners.includes(user._id))
            setIsOwner(league_data.owner === user._id)
          }
        } catch (err) {
          setLeague(null)
          setReady(true)
          console.error("Failed to load league context: ", err)
        } finally {
          setLoadingLeague(false)
        }
      }
      get_league()
    }, [league_id, user, loadingAuth])


    useEffect(() => {
        if (!league) return
        // start from newest sleeper league id
        const sleeper_league_ids = Object.keys(league.sleeper_league_ids)
            .sort((a, b) => Number(b)-Number(a))
            .map(year => league.sleeper_league_ids[year])

        async function get_sub_history() {
            for (const id of sleeper_league_ids) {
                try {
                    const url = `/api/leagues/${id}/subscription-history`
                    console.log(url)
                    const res = await axios.get(url)
                    const history = res.data.history
                    if (history.length > 0) {
                        setSubHistory(history)
                        // console.log("History:", history)
                        return
                    }
                } catch (err) {
                    console.error("Error getting subscription history:", err.response?.data?.message || err.message)
                }
            }
            // would have returned early if history was found
            setSubHistory([])
        }
        get_sub_history()
    }, [league])

    // const subStatus = is_subscription_active(league, subHistory)

    // Compute subscription status once both are ready
    useEffect(() => {
      if (!league || !subHistory) return
      setSubStatus(is_subscription_active(league, subHistory))
      setReady(true)
    }, [league, subHistory])

    if (!ready) {
      return (
        <div className="spinner-container">
          <Spinner />
        </div>
      )
    }

    // need to be able to tell whether purchased or on free trial
    return (
        <LeagueContext.Provider 
          value={{
            league,
            leagueYear,
            loadingLeague: !ready,
            setLeague,
            isOwner,
            isCommish,
            subHistory,
            subStatus,
            subPurchased: (subStatus && subHistory.length > 0)
          }}
        >
          {children}
        </LeagueContext.Provider>
      )
    }

export function useLeague() {
    return useContext(LeagueContext);
}