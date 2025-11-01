import '../css/RosterHeading.css'
import { useMemo } from 'react'

export default function RosterHeading({teams, selectedRosterID, setSelectedRosterID, max_year}) {
    const league_year = new Date().getFullYear()

    const years = useMemo(() => {
        const y  = []

        for (let i = league_year; i <= max_year+1; i++) {
            y.push(i)
        }
        return y
    }, [max_year])
    
    const grid_style = useMemo(() => ({
        display: 'grid',
        alignItems: "center",
        gridTemplateColumns: `40px 60px 200px 80px 100px ${'80px '.repeat(max_year - league_year + 2).trim()}`,
        gap: '10px'
      }), [years]);

    function change_team(e) {
        setSelectedRosterID(parseInt(e.target.value))
    }
    
    return (
        <div className="heading" style={grid_style}>
            
            <div className="team_name">
                <select className="team" onChange={change_team} value={selectedRosterID}>
                    {teams?.map(team => (
                        <option key={team.roster_id} value={team.roster_id}>
                            {team.name}
                        </option>
                    ))}
                </select>
            </div>

            <span className="col_header">Age</span>
            <span className="col_header">Re-signable</span>
            
            {years.map(year => (
                <span key={year} className="col_header">{year}</span>
            ))}
        </div>
    )
}