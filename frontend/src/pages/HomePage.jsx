import Card from '../components/Card'
import Button from '../components/Button'
import '../css/HomePage.css'
import { Outlet, useLocation } from 'react-router-dom'

export default function HomePage() {
    const location = useLocation()

    return (
        <div className="homepage-container">
            <Card width={"200px"}>
                <div className="sidebar-button-container">
                    <div className="subtitle">Home</div>
                    <Button href={"/home"} active={location.pathname=="/home"}>My leagues</Button>
                    <Button href={"/home/create"} active={location.pathname=="/home/create"}>Create league</Button>
                    <Button>Invitations</Button>
                    <Button href={"/home/account"} active={location.pathname=="/home/account"}>Account</Button>
                    <Button href={"/home/purchases"} active={location.pathname=="/home/purchases"}>Purchases</Button>
                </div>
            </Card>
            <Card width={"750px"}>
                <Outlet />
            </Card>
        </div>
    )

}