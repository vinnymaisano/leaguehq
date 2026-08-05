import { useEffect, useState } from "react"
import { LuSun, LuMoon } from "react-icons/lu"
import "../css/ThemeToggle.css"

export default function ThemeToggle() {
    const [theme, setTheme] = useState(
        () => document.documentElement.getAttribute("data-theme") || "light"
    )

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const is_dark = theme === "dark"

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(is_dark ? "light" : "dark")}
            aria-label={is_dark ? "Switch to light mode" : "Switch to dark mode"}
            title={is_dark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {is_dark ? <LuSun /> : <LuMoon />}
        </button>
    )
}
