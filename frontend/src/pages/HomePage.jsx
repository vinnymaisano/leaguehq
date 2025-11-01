import Card from '../components/Card'
import Button from '../components/Button'
import '../css/HomePage.css'
import { Outlet } from 'react-router-dom'

export default function HomePage() {
    return (
        <div className="homepage-container">
            <Card width={"200px"}>
                <div className="subtitle">Home</div>
                <Button href={"/home"}>My leagues</Button>
                <Button href={"/home/create"}>Create league</Button>
                <Button href={"/home/account"}>Account</Button>
                <Button href={"/home/purchases"}>Purchases</Button>
            </Card>
            <Card width={"750px"}>
                <Outlet />
            </Card>
        </div>
    )

}