import {Link} from "react-router-dom"
import "../css/HeaderButton.css"

export default function HeaderButton({children, to, background, state, onClick}) {
    
    const className = `header-button ${background ? " with-background" : ""}`
    
    if (to) {
        return (
            <Link to={to} state={state} onClick={onClick}>
                <div className={className}>{children}</div>
            </Link>
        )
    } else {
        return (
            <div className={className} onClick={onClick}>
                {children}
            </div>
        )
    }
}