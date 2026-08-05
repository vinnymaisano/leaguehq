import { useParams } from "react-router-dom";
import Card from "../components/Card"
import Row from "../components/Row"
import SettingCard from "../components/SettingCard"
import {useLeague} from "../contexts/LeagueContext"
import { LuFileText, LuUsers, LuCalendar, LuTrash2, LuClipboardList } from "react-icons/lu";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LeagueSettingsPage() {
    const {league_id} = useParams()
    const {user, loadingAuth} = useAuth()
    const {league, loadingLeague, isOwner} = useLeague()

    return (
        <div className="mainpanel">
            <Row center={true}>
                <Card height={"100%"} maxWidth={"720px"} gap={"var(--space-5)"}>
                    <Card table>
                        <div className="table-card-head table-head-title">Settings</div>
                        <SettingCard icon={LuClipboardList} to={`/league/${league_id}/settings/league-rules`}>League settings</SettingCard>
                        <SettingCard icon={LuFileText} to={`/league/${league_id}/settings/import-draft`}>Import or delete contracts from a draft</SettingCard>
                        <SettingCard icon={LuUsers} to={`/league/${league_id}/settings/members`}>Manage league members</SettingCard>
                    </Card>

                    {isOwner && (
                        <Card table>
                            <div className="table-card-head table-head-title">Owner settings</div>
                            <SettingCard to={`/league/${league_id}/settings/subscription`} icon={LuCalendar}>Subscription</SettingCard>
                            <SettingCard icon={LuTrash2} to={`/league/${league_id}/settings/delete-league`}>Delete league</SettingCard>
                        </Card>
                    )}
                </Card>
            </Row>
        </div>
    )
}