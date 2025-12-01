import axios from "axios"
import Button from './Button'
import Logo from './Logo'
import Card from './Card'
import '../css/Sidebar.css'
import HeaderButton from './HeaderButton'
import { useLocation, useParams } from 'react-router-dom'
import { FaThLarge, FaGripHorizontal, FaListUl, FaWallet, FaExchangeAlt, FaDollarSign, FaFileContract, FaSlidersH } from "react-icons/fa";
import {useLeague} from '../contexts/LeagueContext'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'


export default function Sidebar() {
    const {league_id} = useParams()
    const {league, leagueYear, isCommish, subStatus} = useLeague()
    const {user} = useAuth()
    const [teamName, setTeamName] = useState("")
    const location = useLocation()

    useEffect(() => {
      if (!league || !user) return

      async function get_team_names() {
        try {
          const url = `/api/leagues/${league_id}/rosters`
          const {data: {team_info, teams}} = await axios.get(url)
          const roster_id = teams[user._id] ?? -1
          const team = team_info.find(team => team.roster_id === roster_id)
          setTeamName(team ? team.name : "")
        } catch (err) {
          console.error("Error getting team name:", err?.response?.data || err.message)
          setTeamName("")
        }
      }
      get_team_names()
    }, [league, user])

    return (
      <Card width={"100%"} height={"100%"}>
        <div className="sidebar-space">
          <div className="sidebar-button-container">
            <Logo />
            <Button icon={FaThLarge} href={`/league/${league_id}`} active={location.pathname === `/league/${league_id}`} disabled={!subStatus}>Dashboard</Button>
            <Button icon={FaListUl} href={`/league/${league_id}/rosters`} active={location.pathname.includes("rosters")} disabled={!subStatus}>Rosters</Button>
            <Button icon={FaDollarSign} href={`/league/${league_id}/contracts`} active={location.pathname.includes("contracts")} disabled={!subStatus}>Contracts</Button>
            <Button icon={FaExchangeAlt} href={`/league/${league_id}/trade-center`} active={location.pathname.includes("trade-center")} disabled={!subStatus}>Trade Center</Button>
            {isCommish && <Button icon={FaSlidersH} href={`/league/${league_id}/settings`} active={location.pathname.includes("settings")} disabled={!subStatus}>Settings</Button>}
          </div>

          <div className="sidebar-gap">
            {/* {league && league.sleeper_league_ids[new Date().getFullYear()]} */}

            <div className="sidebar-user-container">
              
                {user?.username ? (
                  <span className="info-bold">{user.username}</span>
                ) : (
                  <HeaderButton to={`/login`} background={true} state={{from: location.pathname}}>Login</HeaderButton>
                )}
                <div style={{fontStyle: "italic"}} className="info-secondary">{teamName}</div>
              
            </div>


          </div>

        </div>
      </Card>
    )
  }

  // <Button icon={TbChartDots2} href={`/league/${league_id}/commissioner-settings`}>Commissioner Settings</Button>