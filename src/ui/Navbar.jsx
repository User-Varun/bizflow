import { NavLink } from "react-router";
import "../styles/navbar.css";
import {
  FaHome,
  FaBoxes,
  FaThLarge,
  FaUsers,
  FaFileInvoiceDollar,
  FaReceipt,
  FaFileArchive,
} from "react-icons/fa";
import { UserProfile } from "./UserProfile";

export function Navbar() {
  return (
    <nav id="nav">
      <NavLink to="/" id="nav-logo">
        BizFlow
      </NavLink>

      <ul id="nav-ul">
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/"
        >
          <div className="list-item-sub-container">
            <FaHome style={{ marginRight: 8 }} /> <span>DashBoard</span>
          </div>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          // to="/"
          to="/inventory"
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
          to="/dealers"
        >
          <div className="list-item-sub-container">
            <FaUsers style={{ marginRight: 8 }} />
            <span>Dealers</span>
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
        <NavLink
          className={({ isActive }) =>
            isActive ? "list-item nav-link-active" : "nav-link-inactive"
          }
          to="/reports"
        >
          <div className="list-item-sub-container">
            <FaFileArchive style={{ marginRight: 8 }} />
            <span>Reports</span>
          </div>
        </NavLink>
      </ul>

      <UserProfile />
    </nav>
  );
}
