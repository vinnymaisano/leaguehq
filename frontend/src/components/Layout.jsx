import Sidebar from './Sidebar';
import {Outlet} from 'react-router-dom'
import '../css/Layout.css'
import Spinner from './Spinner'
import MainPanel from './MainPanel'
import {useEffect, useState} from "react"
import axios from "axios"
import Card from './Card'
import { useParams } from 'react-router-dom'
import TopBar from './TopBar';

export default function Layout() {
  const {league_id} = useParams()
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)
  const [leagueName, setLeagueName] = useState("")

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

  useEffect(()=> {
    async function search() {
      try {
        const response = await axios.get(`/api/leagues/${league_id}`)
        if (response.data.success) {
          setExists(true)
          setLeagueName(response.data.league.name)
        } else {
          setExists(false)
        }
      } catch (err) {
        console.error("Error searching for league: ", err.response.data.error)
      } finally {
        // await new Promise((res) => setTimeout(res, 1000))
        setLoading(false)
      }
    }
    search()
  }, [league_id])

  return (
    <div className="layout">

      <div className="topbar">
        <TopBar />
      </div>
      
      <div className="sidebar">
        <Sidebar />
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