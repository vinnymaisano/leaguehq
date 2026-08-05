import { Outlet, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from "react"
import axios from "axios"
import '../css/Layout.css'
import Spinner from './Spinner'
import MainPanel from './MainPanel'
import Card from './Card'
import TopBar from './TopBar'
import Tabs from './Tabs'
import Logo from './Logo'
import { useLeague } from '../contexts/LeagueContext'
import { LuLayoutGrid, LuList, LuDollarSign, LuArrowLeftRight, LuSlidersHorizontal } from "react-icons/lu"

export default function Layout() {
  const { league_id } = useParams()
  const location = useLocation()
  const { isCommish, subStatus } = useLeague()
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    if (!location.pathname.includes("rosters")) {
      sessionStorage.removeItem("selectedRosterID");
    }
  }, [location.pathname])

  useEffect(() => {
    if (!location.pathname.includes("contracts")) {
      sessionStorage.removeItem("query");
      sessionStorage.removeItem("position")
    }
  }, [location.pathname])

  useEffect(() => {
    async function search() {
      try {
        const response = await axios.get(`/api/leagues/${league_id}`)
        setExists(!!response.data.success)
      } catch (err) {
        console.error("Error searching for league: ", err.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [league_id])

  const base = `/league/${league_id}`
  const tabs = [
    { label: "Dashboard", to: base, icon: LuLayoutGrid, end: true, disabled: !subStatus },
    { label: "Rosters", to: `${base}/rosters`, icon: LuList, disabled: !subStatus },
    { label: "Contracts", to: `${base}/contracts`, icon: LuDollarSign, disabled: !subStatus },
    { label: "Trade Center", to: `${base}/trade-center`, icon: LuArrowLeftRight, disabled: !subStatus },
    isCommish && { label: "Settings", to: `${base}/settings`, icon: LuSlidersHorizontal, disabled: !subStatus },
  ]

  return (
    <div className="layout">
      <div className="topbar">
        <Logo />
        <TopBar />
      </div>

      <div className="tabbar">
        <Tabs tabs={tabs} />
      </div>

      <div className="main">
        {loading ? (
          <MainPanel>
            <div className="spinner-container">
              <Spinner />
            </div>
          </MainPanel>
        ) : exists ? (
          <Outlet />
        ) : (
          <div className="content-center">
            <Card>
              <div className="subtitle">League not found</div>
              League with ID {league_id} does not exist.
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
