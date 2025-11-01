import './css/App.css'
import { Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AccountSettings from './pages/AccountSettings'
import VerifyEmailPage from './pages/VerifyEmailPage'
import HeaderTemplate from './components/HeaderTemplate'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import MyLeagues from './pages/MyLeagues'
import CreateLeague from './pages/CreateLeague'
import LeagueSetup from './pages/LeagueSetup'
import RostersPage from './pages/RostersPage'
import ContractsPage from './pages/ContractsPage'
import LeagueSettingsPage from './pages/LeagueSettingsPage'
import CommissionerSettings from './pages/CommissionerSettings'
import ImportDraftPage from './pages/ImportDraftPage'
import LeagueMembersPage from './pages/LeagueMembersPage'
import LeagueRulesPage from './pages/LeagueRulesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SubscriptionPage from './pages/SubscriptionPage'
import {AuthProvider} from './contexts/AuthContext'
import {LeagueProvider}  from './contexts/LeagueContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TradeCenter from './pages/TradeCenter'
import PurchaseSubscriptionPage from './pages/PurchaseSubscriptionPage'
import RequireSubscription from './components/RequireSubscription'
import AccountPurchases from './pages/AccountPurchases'
import DeleteAccount from './pages/DeleteAccount'
import DeleteLeague from './pages/DeleteLeague'
import { TitleProvider } from './contexts/TitleContext'

function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <TitleProvider>
        <Routes>
          {/* Public routes */}
            <Route path="/" element={<HeaderTemplate/>}>
              <Route index element={<LandingPage />} />
              
              
              <Route path="home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }>
                <Route index element={<MyLeagues />} />
                <Route path="create" element={<CreateLeague />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="purchases" element={<AccountPurchases />} />
                <Route path="import/:league_id" element={<LeagueSetup />}/>
                <Route path="delete-account" element={<DeleteAccount />}/>
              </Route>
              
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage/>}></Route>
              
              <Route path="/reset-password/:reset_token" element={<ResetPasswordPage />}></Route>
            </Route>

          {/* League routes */}
          <Route path="/league/:league_id" element={
            <LeagueProvider>
              <RequireSubscription>
                <Layout />
              </RequireSubscription>
            </LeagueProvider>
          }>
            <Route index element={<Dashboard />} />
            <Route path="rosters" element={<RostersPage />}/>
            <Route path="contracts" element={<ContractsPage/>}/>
            <Route path="trade-center" element={<TradeCenter />}/>
            

            {/* League settings */}
            <Route path="settings" element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route index element={<LeagueSettingsPage />}/>
              <Route path="league-rules" element={<LeagueRulesPage/>} />
              <Route path="import-draft" element={<ImportDraftPage />} />
              <Route path="members" element={<LeagueMembersPage />} />
              {/* Owner only */}
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="purchase-subscription" element={<PurchaseSubscriptionPage />} />
              <Route path="delete-league" element={<DeleteLeague />} />
            </Route>
          </Route>

        </Routes>
      </TitleProvider>
    </AuthProvider>
    </BrowserRouter>
  )
}

export default App