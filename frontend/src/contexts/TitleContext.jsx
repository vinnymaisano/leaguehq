import { createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TitleContext = createContext()

export function TitleProvider({ children }) {
  const location = useLocation()

  useEffect(() => {
    let page = ""
    const pathname = location.pathname
    // let LeagueContext handle league routes
    if (pathname.includes("league")) return

    if (pathname.includes("login")) {
      page = "Login"
    } else if (pathname.includes("register")) {
      page = "Register"
    } else if (pathname.includes("create")) {
      page = "Create League"
    } else if (pathname.includes("account")) {
      page = "Account"
    } else if (pathname.includes("purchases")) {
      page = "Purchases"
    } else if (pathname.includes("import")) {
      page = "Import League"
    } else if (pathname.includes("home")) {
      page = "My Leagues"
    }
    document.title = `${page ? `${page} |` : ""} LeagueHQ`
  }, [location.pathname])

  return (
    <TitleContext.Provider value={{}}>
      {children}
    </TitleContext.Provider>
  )
}

// Custom hook for easier access
export function useTitle() {
  return useContext(TitleContext)
}
