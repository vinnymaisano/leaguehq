import '../css/MainPanel.css'

export default function MainPanel({children, fill, className}) {
    const classes = ["mainpanel", fill ? "fill" : "", className || ""].filter(Boolean).join(" ")
    return (
        <div className={classes}>
            {children}
        </div>
    )
}