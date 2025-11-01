import { useNavigate } from 'react-router-dom'
import '../css/Card.css'

export default function Card({children, portion, width, height, minHeight, padding, gap, borderRadius, changeOnHover, to}) {
    const classname = "glass-card" + (changeOnHover ? " card-hover" : "")
    const navigate = useNavigate()
    function redirect() {
        navigate(to)
    }
    const onclick = to ? redirect : null
    return (
        // if in a Row, can use proportion
        <div onClick={onclick} style={{flex: portion, width, minHeight, height, padding, borderRadius, gap}} className={classname    }>
            {children}
        </div>
    )
}