import "../css/Spinner.css"

export default function Spinner({size="36px"}) {
    return (
        <div style={{
            height: size, 
            width: size
        }}
        className="spinner">

        </div>
    )
}