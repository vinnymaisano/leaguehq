import '../css/InputInfo.css'

export default function InputInfo({children, description}) {
    return (
        <div className="input-info" title={description}>{children}</div>
    )
}