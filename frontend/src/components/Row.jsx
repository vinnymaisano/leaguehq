import '../css/Row.css'

export default function Row({children, height, width, center, align}) {
    return (
    <div className="row" style={{minHeight: height, width, justifyContent: (center ? "center" : ""), alignItems: align}}>
        {children}
    </div>
    )
}