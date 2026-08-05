import '../css/HomePage.css'
import { Outlet } from 'react-router-dom'
import Tabs from '../components/Tabs'

export default function HomePage() {
    const tabs = [
        { label: "My leagues", to: "/home", end: true },
        { label: "Create league", to: "/home/create" },
        { label: "Invitations", to: "/home/invitations", disabled: true },
        { label: "Account", to: "/home/account" },
        { label: "Purchases", to: "/home/purchases" },
    ]

    return (
        <div className="homepage-container">
            <div className="homepage-tabs">
                <Tabs tabs={tabs} />
            </div>
            <div className="homepage-content">
                <Outlet />
            </div>
        </div>
    )
}
