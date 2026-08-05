import { useAuth } from "../contexts/AuthContext"
import "../css/LandingPage.css"
import HeaderButton from "../components/HeaderButton"
import { Navigate } from "react-router-dom"

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
                    
                    <div className="landing-heading">Connect to your dynasty league on the Sleeper platform</div>
                    <div className="landing-subheadline">LeagueHQ automatically pulls all of your league's data directly from Sleeper - so your league is ready to go in just a click.</div>
                    

                    <div className="image-container">
                        <img className="rounded-image" width="70%" src="roster.png" />
                        <img className="rounded-image" width="30%" src="salary cap.png" />
                    </div>

                </div>

                <div className="landing-section-light">
                    <div className="landing-section-row">

                        <img className="rounded-image" width="45%" src="import draft.png" />
                        

                        <div className="heading-container">
                            <div className="landing-heading">Import contracts from your league's drafts</div>
                            <div className="landing-subheadline">Player contracts are automatically imported from auction and rookie drafts. No more manual bookkeeping or spreadsheets for commissioners.</div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    )

}