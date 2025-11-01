import Card from '../components/Card'
import Row from '../components/Row'
import MainPanel from '../components/MainPanel'
import Standings from '../components/Standings'
import '../css/Dashboard.css'
import TransactionLog from '../components/TransactionLog'
import { useLeague } from '../contexts/LeagueContext'
import { useState } from 'react'
import Spinner from '../components/Spinner'

export default function Dashboard() {
    const {leagueYear, loadingLeague} = useLeague()
    const [year, setYear] = useState(leagueYear)

    if (loadingLeague) {
      return (
        <div className="spinner-container">
          <Spinner />
        </div>
      )
    }

    return (
      <MainPanel>
        <Row height={"100%"}>
          <Card headerText={"Standings"} width={"50%"} height={"100%"}>
            <div className="subtitle">Standings</div>
            <Standings selectedYear={year} changeYear={setYear}/>
          </Card>

          <Card width={"50%"} height={"100%"}>
            <div className="subtitle">League activity</div>
            <TransactionLog year={year}/>
          </Card>
        </Row>
      </MainPanel>
    );
  }