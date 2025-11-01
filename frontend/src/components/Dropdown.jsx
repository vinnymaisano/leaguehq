export default function DropDown({options}) {
    const [value, setValue] = useState(options[0])
    function change() {

    }

    return (
        <select>
            {options.map([val, text] => (
                <option key={val} value={val}>
                    {text}
                </option>
            ))}
        </select>
    )
}