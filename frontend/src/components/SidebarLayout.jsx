import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { MdOutlineDashboard, MdGroup, MdAttachMoney, MdOutlineReport, MdSettings, MdCalendarToday } from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";

const NavItem = ({ icon: Icon, label, isActive = false, onClick }) => (
  <button
    className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`}
    onClick={onClick}
  >
    <Icon className="text-xl" />
    <span className="font-medium">{label}</span>
  </button>
);

export default function SidebarLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col justify-between p-4 fixed h-full">
        <div>
          <div className="mb-8">
            <img 
              src="/img/paypoint-logo.png" 
              alt="PayPoint Logo" 
              className="h-25 w-50"
            />
            <p className="text-sm text-gray-400 ml-3">Payroll Management System</p>
          </div>
          <nav className="space-y-1">
            <NavItem icon={MdOutlineDashboard} label="Dashboard" isActive={location.pathname === "/dashboard"} onClick={() => navigate('/dashboard')} />
            <NavItem icon={MdGroup} label="Employees" isActive={location.pathname === "/employees"} onClick={() => navigate('/employees')} />
            <NavItem icon={MdCalendarToday} label="Attendance" isActive={location.pathname === "/attendance"} onClick={() => navigate('/attendance')} />
            <NavItem icon={MdAttachMoney} label="Payroll" isActive={location.pathname === "/payroll"} onClick={() => navigate('/payroll')} />
            <NavItem icon={MdOutlineReport} label="Reports" isActive={location.pathname === "/reports"} onClick={() => navigate('/reports')} />
          </nav>
        </div>
        <div className="space-y-1">
          <NavItem icon={MdSettings} label="Settings" onClick={() => navigate('/settings')} />
          <NavItem icon={FaSignOutAlt} label="Logout" onClick={logout} />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
