import { useAuth } from "../contexts/AuthContext"
import Card from '../components/Card'
import Row from "../components/Row"
import "../css/LandingPage.css"
import HeaderButton from "../components/HeaderButton"
import { Navigate } from "react-router-dom"
import ImageCarousel from "../components/ImageCarousel"

export default function LandingPage() {
    const {user} = useAuth()
    if (user) {
        return <Navigate to="/home" />
    }

    return (
        <div className="landing-content">
            <div className="landing-container">
                
                <div className="landing-section-light">
                    <div>
                        <div className="landing-headline">Step into the front office.</div>
                        <div className="landing-subheadline">Add a new dimension to dynasty fantasy football with contracts, salaries, and salary cap management.</div>
                    </div>
                    <HeaderButton to={"/register"} background={true}>Try for Free</HeaderButton>
                </div>

                <div className="landing-section-dark">
                    <div className="landing-heading">Import your dynasty league from the Sleeper platform</div>
                </div>

            </div>
        </div>
    )

    // return (
    //     <div className="landing-content">
    //         <Row center={true} width={"80%"} height={""}>
    //             <Card width={"100%"} gap={"5px"}>
    //                 <div className="landing-headline">Step into the front office.</div>
    //                 <div className="landing-subheadline">Add a new dimension to dynasty fantasy football with contracts, salaries, and salary cap management.</div>
    //                 <HeaderButton to={"/register"} background={true}>Try for Free</HeaderButton>
    //             </Card>
                
    //         </Row>

    //         <Row center={false} width={"80%"} height={"500px"}>
    //             {/* <Card width={"50%"}>
    //                 <img src="contract-list.jpeg"></img>
    //             </Card> */}
                
    //             <Card width={"40%"}>
    //                 <div className="landing-subheading">Automatic sync with Sleeper</div>
    //                 <div>Connect your Sleeper league, manage player contracts, and dominate your league like. GM. LeagueHQ automatically pulls all of your league's data directly from the Sleeper platform - so your league is ready to go in just a click.</div>
    //             </Card>

    //             <Card height={"100%"} padding={"10px"} width={"60%"}>
    //             </Card>

    //         </Row>

    //         <Row center={false} width={"80%"} height={"500px"}>
    //             {/* <Card width={"50%"}>
    //                 <img src="contract-list.jpeg"></img>
    //             </Card> */}
    //             <Card width={"50%"}>
    //                 <div className="landing-subheading">Build a dynasty</div>
    //                 <div>Stash cheap rookies and sign under-the-radar free agents to build a team that contends year-after-year.</div>
    //             </Card>

    //             {/* <Card height={""} width={"50%"}>
    //                 <img src="leaguehq-contracts.png"></img>
    //             </Card> */}

    //         </Row>
    //     </div>
    // )
}