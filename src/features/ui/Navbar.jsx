import { Link, NavLink } from "react-router";
import "../styles/navbar.css";
import {
  FaHome,
  FaBoxes,
  FaThLarge,
  FaFileInvoiceDollar,
  FaReceipt,
} from "react-icons/fa";

export function Navbar() {
  // const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <nav id="nav">
      <a href="#" id="nav-logo">
        BizFlow
      </a>

      <ul id="nav-ul">
        {/* <NavLink
          className="list-item "
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#5c3b23e6", color: "#fff" }
              : { color: "black" }
          }
          to="/"
        >
          <div className="list-item-sub-container">
            <FaHome style={{ marginRight: 8 }} /> <span>DashBoard</span>
          </div>
        </NavLink> */}
        <NavLink
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#5c3b23e6", color: "#fff" }
              : { color: "black" }
          }
          className="list-item"
          to="/"
          // to="/inventory"
        >
          <div className="list-item-sub-container">
            <FaBoxes style={{ marginRight: 8 }} />
            <span>Inventory</span>
          </div>
        </NavLink>
        <NavLink
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#5c3b23e6", color: "#fff !important" }
              : { color: "black" }
          }
          className="list-item"
          to="/productCatalog"
        >
          <div className="list-item-sub-container">
            <FaThLarge style={{ marginRight: 8 }} />
            <span>ProductCatalog</span>
          </div>
        </NavLink>
        <NavLink
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#5c3b23e6", color: "#fff" }
              : { color: "black" }
          }
          className="list-item"
          to="/GenerateBill"
        >
          <div className="list-item-sub-container">
            <FaFileInvoiceDollar style={{ marginRight: 8 }} />
            <span>Generate Bill</span>
          </div>
        </NavLink>
        <NavLink
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#5c3b23e6", color: "#fff" }
              : { color: "black" }
          }
          className="list-item"
          to="/viewBills"
        >
          <div className="list-item-sub-container">
            <FaReceipt style={{ marginRight: 8 }} />
            <span>Your Bills</span>
          </div>
        </NavLink>
      </ul>
    </nav>
  );
}
