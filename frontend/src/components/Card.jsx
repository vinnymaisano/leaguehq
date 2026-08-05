import { useNavigate } from 'react-router-dom'
import '../css/Card.css'

export default function Card({children, portion, width, minWidth, maxWidth, height, minHeight, padding, gap, borderRadius, changeOnHover, table, to}) {
    // `table` renders the contained "table-card" look (rounded, bordered, divided rows)
    const classname = table ? "table-card" : (changeOnHover ? "glass-card card-hover" : "glass-card")
    const navigate = useNavigate()
    function redirect() {
        navigate(to)
    }
    const onclick = to ? redirect : null
    return (
        // if in a Row, can use proportion
        <div onClick={onclick} style={{flex: portion, width, minWidth, maxWidth, minHeight, height, padding, borderRadius, gap}} className={classname}>
            {children}
        </div>
    )
}