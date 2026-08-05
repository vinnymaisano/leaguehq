import { NavLink } from "react-router-dom"
import '../css/Tabs.css'

/**
 * GitHub-style underline tab bar.
 *
 * tabs: array of { label, to, icon?, end?, disabled? }
 *   - to:       route path (NavLink target)
 *   - end:      exact-match active state (use for index/root tabs)
 *   - icon:     optional react-icons component
 *   - disabled: render a non-link muted tab (e.g. no subscription)
 */
export default function Tabs({ tabs }) {
    return (
        <nav className="tabs">
            {tabs.filter(Boolean).map(({ label, to, icon: Icon, end, disabled }) => {
                if (disabled) {
                    return (
                        <span key={label} className="tab tab-disabled">
                            {Icon && <Icon className="tab-icon" />}
                            <span className="tab-label">{label}</span>
                        </span>
                    )
                }
                return (
                    <NavLink
                        key={label}
                        to={to}
                        end={end}
                        className={({ isActive }) => `tab${isActive ? " tab-active" : ""}`}
                    >
                        {Icon && <Icon className="tab-icon" />}
                        <span className="tab-label">{label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}
