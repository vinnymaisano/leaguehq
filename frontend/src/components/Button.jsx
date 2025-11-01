import {Link} from "react-router-dom"
import '../css/Button.css'

export default function Button({children, href, icon: Icon, active, disabled}) {
    const classname = active ? "button active-route" : "button"

    if (disabled) {
      return (
        <div className={classname}>
          {Icon && <Icon className="icon" />}
          <span className="button-text">{children}</span>
        </div>
      )
    }
  
    return (
      <Link to={href} className="button-link">
        <div className={classname}>
          {Icon && <Icon className="icon" />}
          <span className="button-text">{children}</span>
        </div>
      </Link>
    )
}