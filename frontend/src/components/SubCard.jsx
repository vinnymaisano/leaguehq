const formatDateTime = (date) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString("en-US");
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${dateStr} at ${timeStr}`;
}

export default function SubCard({sub}) {
    return (
        <div className="table-row">
            <div className="league-row-main">
                <div className="league-name">{sub.league_name && `${sub.league_name} - `} {sub.season} season</div>
                <div className="league-meta">Sleeper league ID: {sub.sleeper_league_id}</div>
                <div className="league-meta">Purchased by: {sub?.purchased_by?.username || "deleted-user"}</div>
                <div className="league-meta">Total: ${sub.price}.00</div>
                <div className="league-meta">Date purchased: {formatDateTime(new Date(sub.purchased_at))}</div>
            </div>
        </div>
    )
}