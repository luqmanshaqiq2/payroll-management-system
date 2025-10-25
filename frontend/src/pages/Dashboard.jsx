import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MdOutlineDashboard, MdGroup, MdAttachMoney, MdOutlineReport, MdSettings, MdCalendarToday } from "react-icons/md";
import { FaSignOutAlt, FaChevronRight } from "react-icons/fa";
import { fetchDashboardOverview, fetchEmployeeStats, fetchPayrollStats } from "../api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(value || 0);

// --- Custom Components ---

// Skeleton Components
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex-1 min-w-[200px] border animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-3 bg-gray-200 rounded w-3"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-24 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-16"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="flex-2 bg-white p-6 rounded-lg shadow-sm w-2/3 border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
    <div className="h-64 flex pt-4">
      <div className="flex flex-col justify-end h-full text-xs text-gray-300 pr-2 space-y-[40px]">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex items-end h-full flex-1 border-l border-gray-200">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex-1 h-full flex flex-col justify-end items-center px-1">
            <div className="w-full bg-gray-200 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonPayments = () => (
  <div className="flex-1 bg-white p-6 rounded-lg shadow-sm w-1/3 border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
    <div className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ title, value, change, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex-1 min-w-[200px] border">
    <div className="flex justify-between items-start mb-2">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <FaChevronRight className="text-gray-300 text-sm" />
    </div>
    <div className="text-3xl font-normal text-blue-600 flex items-baseline">
      {icon === 'LKR' && <span className="text-3xl font-normal mr-1">LKR</span>}
      {value}
    </div>
    {change && (
      <p className={`text-sm font-medium mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </p>
    )}
    {/* For the "Next Payroll" card, use the change field for the date */}
    {title === "Next Payroll" && change && (
      <p className="text-sm text-gray-500 mt-1">{change}</p>
    )}
  </div>
);


// Sidebar Navigation Item Component
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


// --- Dashboard Main Component ---
export default function Dashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [empStats, setEmpStats] = useState(null);
  const [payStats, setPayStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewRes, empRes, payRes] = await Promise.all([
          fetchDashboardOverview(),
          fetchEmployeeStats(),
          fetchPayrollStats({})
        ]);
        if (!isMounted) return;
        setOverview(overviewRes.data?.data || null);
        setEmpStats(empRes.data?.data || null);
        setPayStats(payRes.data?.data || null);
      } catch (e) {
        if (!isMounted) return;
        setError(e.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const recentPayments = useMemo(() => {
    // Map recent payrolls from overview to display list
    const items = overview?.recentPayrolls || [];
    return items.map((p) => {
      const first = p.employee?.firstName?.[0] || "?";
      const last = p.employee?.lastName?.[0] || "";
      const initials = `${first}${last}`.toUpperCase();
      const name = `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim();
      return {
        initials,
        name: name || "Employee",
        role: p.status,
        amount: formatCurrency(p.netPay || 0),
        color: "bg-gray-700",
      };
    });
  }, [overview]);

  const departmentSalaryData = useMemo(() => {
    // Define departments with their specific salary values
    const departments = [
      { department: 'Finance', amount: 355000, employeeCount: 10 },
      { department: 'HR', amount: 295000, employeeCount: 10 },
      { department: 'IT', amount: 235000, employeeCount: 10 },
      { department: 'Marketing', amount: 145000, employeeCount: 10 },
      { department: 'Operations', amount: 110000, employeeCount: 10 }
    ];
    
    // Shuffle the departments randomly
    const shuffledData = [...departments];
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
    }

    return shuffledData;
  }, [overview]);

  const maxSalary = useMemo(() => {
    // Use fixed maximum salary to match Y-axis scale (500,000)
    return 500000;
  }, [departmentSalaryData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <h2 className="text-3xl font-semibold text-gray-900 mb-2">
        Dashboard Overview
      </h2>
      <p className="text-gray-600 mb-8">
        Welcome back! Here's your payroll summary.
      </p>

      {loading ? (
        <>
          {/* Skeleton Loading State */}
          <div className="flex flex-wrap gap-4 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          <div className="flex gap-4">
            <SkeletonChart />
            <SkeletonPayments />
          </div>
        </>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Top Stat Cards */}
          <div className="flex flex-wrap gap-4 mb-8">
            <StatCard
              title="Total Payroll"
              value={formatCurrency(payStats?.totalNetPay || overview?.totalNetPay || 0).replace('LKR', '')}
              change={payStats ? `${(payStats.paidPayrolls || 0) + (payStats.approvedPayrolls || 0)} processed` : undefined}
              icon="LKR"
            />
            <StatCard
              title="Active Employees"
              value={`${empStats?.activeEmployees || overview?.activeEmployees || 0}`}
              change={empStats ? `${empStats.totalEmployees || 0} total` : undefined}
              icon="👥"
            />
            <StatCard
              title="Avg. Salary"
              value={formatCurrency((overview?.totalGrossPay || 0) / (overview?.totalEmployees || 1))}
              change={undefined}
              icon="↗"
            />
            <StatCard
              title="Next Payroll"
              value={"November 2025"}
              change={""}
              icon="🗓"
            />
          </div>

          {/* Charts and Payments */}
          <div className="flex gap-4 mb-8">
            {/* Department Salary Trends (Chart Area) */}
            <div className="flex-2 bg-white p-6 rounded-lg shadow-sm w-2/3 border">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Department Salary Trends
              </h3>
              {/* The Bar Chart Visualization */}
              <div className="h-64 flex pt-4">
                  {/* Y-Axis Labels */}
                  <div className="flex flex-col justify-end h-full text-xs text-gray-500 pr-2 space-y-[40px]">
                      <div className="relative bottom-2 border-b border-gray-200 w-full text-right">LKR 500,000</div>
                      <div className="relative bottom-2 border-b border-gray-200 w-full text-right">LKR 250,000</div>
                      <div className="relative bottom-2 border-b border-gray-200 w-full text-right">LKR 100,000</div>
                      <div className="relative bottom-2 border-b border-gray-200 w-full text-right">LKR 0</div>
                  </div>
                  
                  {/* Chart Bars */}
                  <div className="flex items-end h-full flex-1 border-l border-gray-200">
                      {departmentSalaryData.map((data, index) => {
                          const height = maxSalary ? (data.amount / maxSalary) * 100 : 0;
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                          const color = colors[index % colors.length];
                          return (
                              <div
                                  key={data.department}
                                  className="flex-1 h-full flex flex-col justify-end items-center px-1"
                              >
                                  <div
                                      className="w-full"
                                      style={{ 
                                        height: `${height}%`, 
                                        minWidth: '10px',
                                        backgroundColor: color
                                      }}
                                      title={`${data.department}: LKR ${data.amount.toLocaleString()} (${data.employeeCount} employees)`}
                                  ></div>
                                  <div className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">
                                    {data.department}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
            </div>

            {/* Recent Payments List */}
            <div className="flex-1 bg-white p-6 rounded-lg shadow-sm w-1/3 border">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Recent Payments
              </h3>
              <div className="space-y-4">
                {recentPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${payment.color}`}
                      >
                        {payment.initials}
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">{payment.name}</p>
                        <p className="text-gray-500 text-sm">{payment.role}</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {payment.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </>
      )}
    </>
  );
}