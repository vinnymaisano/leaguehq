import { useParams } from "react-router-dom";
import Card from "../components/Card"
import Row from "../components/Row"
import SettingCard from "../components/SettingCard"
import {useLeague} from "../contexts/LeagueContext"
import { FaFileContract, FaEdit, FaUserFriends, FaCalendarAlt, FaUserLock, FaTrashAlt, FaClipboardList} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LeagueSettingsPage() {
    const {league_id} = useParams()
    const {user, loadingAuth} = useAuth()
    const {league, loadingLeague, isOwner} = useLeague()

    return (
        <div className="mainpanel">
            <Row center={true}>
                <Card height={"100%"}>
                    <div className="subtitle">Settings</div>
                    <div className="settings-container">
                        <SettingCard icon={FaClipboardList} to={`/league/${league_id}/settings/league-rules`}>League settings</SettingCard>
                        <SettingCard icon={FaFileContract} to={`/league/${league_id}/settings/import-draft`}>Import or delete contracts from a draft</SettingCard>
                        <SettingCard icon={FaUserFriends} to={`/league/${league_id}/settings/members`}>Manage league members</SettingCard>
                        {isOwner && (
                            <>
                            <div className="subtitle">Owner settings</div>
                            <SettingCard to={`/league/${league_id}/settings/subscription`} icon={FaCalendarAlt}>Subscription</SettingCard>
                            <SettingCard icon={FaTrashAlt} to={`/league/${league_id}/settings/delete-league`}>Delete league</SettingCard>
                            </>
                        )}
                    </div>
                </Card>
            </Row>
        </div>
    )
}