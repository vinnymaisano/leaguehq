import Card from "./Card"

const formatDateTime = (date) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString("en-US");
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${dateStr} at ${timeStr}`;
}

export default function SubCard({sub}) {
    return (
        <Card width={"100%"} key={sub.year}>
            <div className="league-name">{sub.league_name && `${sub.league_name} - `} {sub.season} season</div>
            <div>Sleeper league ID: {sub.sleeper_league_id}</div>
            <div>Purchased by: {sub?.purchased_by?.username || "deleted-user"}</div>
            <div>Total: ${sub.price}.00</div>
            <div>Date purchased: {formatDateTime(new Date(sub.purchased_at))}</div>
        </Card>
    )
}