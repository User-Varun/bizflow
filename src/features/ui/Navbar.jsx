import { Link, NavLink } from "react-router";
import "../styles/navbar.css";
import {
  FaHome,
  FaBoxes,
  FaThLarge,
  FaFileInvoiceDollar,
  FaReceipt,
} from "react-icons/fa";
import { UserProfile } from "./UserProfile";

export function Navbar() {
  return (
    <nav id="nav">
      <NavLink to="/" id="nav-logo">
        BizFlow
      </NavLink>

      <ul id="nav-ul">
        {/* <NavLink
           className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/"
        >
          <div className="list-item-sub-container">
            <FaHome style={{ marginRight: 8 }} /> <span>DashBoard</span>
          </div>
        </NavLink> */}
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/"
          // to="/inventory"
        >
          <div className="list-item-sub-container">
            <FaBoxes style={{ marginRight: 8 }} />
            <span>Inventory</span>
          </div>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/productCatalog"
        >
          <div className="list-item-sub-container">
            <FaThLarge style={{ marginRight: 8 }} />
            <span>ProductCatalog</span>
          </div>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/GenerateBill"
        >
          <div className="list-item-sub-container">
            <FaFileInvoiceDollar style={{ marginRight: 8 }} />
            <span>Generate Bill</span>
          </div>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/viewBills"
        >
          <div className="list-item-sub-container">
            <FaReceipt style={{ marginRight: 8 }} />
            <span>Your Bills</span>
          </div>
        </NavLink>
      </ul>

      <UserProfile />
    </nav>
  );
}
