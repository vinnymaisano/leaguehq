import '../css/RosterHeading.css'
import { useMemo } from 'react'

export default function ContractHeading({teams, position, setPosition, max_year}) {
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
        gridTemplateColumns: `40px 60px 200px 80px 100px ${'80px '.repeat(years.length).trim()}`,
        gap: '10px'
      }), [years]);

    function change_position(e) {
        setPosition(e.target.value)
    }
    
    return (
        <div className="heading" style={grid_style}>
            <div className="team_name">
                <select className="team" value={position} onChange={change_position}>
                    <option key={"all"} value={"all"}>All</option>
                    <option key={"QB"} value={"QB"}>QB</option>
                    <option key={"RB"} value={"RB"}>RB</option>
                    <option key={"WR"} value={"WR"}>WR</option>
                    <option key={"TE"} value={"TE"}>TE</option>
                    <option key={"FA"} value={"FA"}>Pending free agents</option>
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