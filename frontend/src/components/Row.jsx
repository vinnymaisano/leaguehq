import '../css/Row.css'

export default function Row({children, height, width, center}) {
    return (
    <div className="row" style={{minHeight: height, width, justifyContent: (center ? "center" : "")}}>
        {children}
    </div>
    )
}