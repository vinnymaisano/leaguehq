import "../css/BudgetBar.css"
import { useState, useEffect } from "react"
import Card from "./Card"

export default function BudgetBar({children, used, total, year}) {
    const [animatedWidth, setAnimatedWidth] = useState(0)
    //const percentage = Math.min((used/total) * 100, 100)
    const portion = (used / total)
    const percentage = Math.min(portion * 100, 100)

    const over_budget = (used > total)

    let used_color;
    if (percentage <= 65) {
        used_color = "rgb(0, 130, 0)"
    } else if (percentage <= 75) {
        used_color = "rgb(0, 180, 0)"
    } else if (percentage <= 85) {
        used_color = "rgb(255, 206, 72)"
    } else if (percentage <= 90) {
        used_color = "rgb(255, 153, 0)"
    } else {
        used_color = "rgb(140, 0, 0)"
    }

    useEffect(() => {
        requestAnimationFrame(() => {
            setAnimatedWidth(percentage)
        })
    }, [percentage])

    return (
        <Card width={"100%"} padding={"15px"} borderRadius={"20px"}>
            <div className="year">{year}</div>
            <div style={{backgroundColor: used_color}} className="budgetbar">

                <div style={{
                    width: `${animatedWidth}%`,
                    borderRadius: (portion >= 1) ? "3px" : ""
                    }} className="budget-used" />

                <div style={{
                    width: `${100-percentage}%`,
                    }} className="budget-free" />
            </div>
            <div className="space-between-budget" style={{color: over_budget ? "rgb(105, 0, 0)" : "black", fontWeight: over_budget ? "600" : "400"}}>
                <div>{`$${used} / $${total}`}</div>
                <div>{`Available: $${total - used}`}</div>
            </div>
        </Card>
    )
}