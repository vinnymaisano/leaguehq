import Card from "./Card";
import "../css/SettingCard.css"
import { FaAngleRight } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function SettingCard({children, icon: Icon, to}) {
    const width = "750px"
    const height = "50px"

    return (
        <Link to={to}>
            <Card width={width} padding={"5px"} height={"50px"} changeOnHover={true}>
                    <div className="space-between">
                        <div className="horizontal-flex">
                            {Icon && (
                                <div className="icon-container">
                                    <Icon className="nav-icon"/>
                                </div>
                                )
                            }
                            <div className="setting-name">{children}</div>
                        </div>

                        <div className="center-vertical">
                            <FaAngleRight/>
                        </div>
                    </div>
            </Card>
        </Link>
    )
}