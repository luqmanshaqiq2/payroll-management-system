import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { MdSearch, MdMoreVert, MdAdd, MdClose, MdWarning } from "react-icons/md";
import { fetchEmployees, fetchEmployeeById, deleteEmployee } from "../api";

const NavItem = ({ icon: Icon, label, isActive = false, onClick }) => (
  <button
    className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${
      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`}
    onClick={onClick}
  >
    <Icon className="text-xl" />
    <span className="font-medium">{label}</span>
  </button>
);

function getInitials(firstName = "", lastName = "") {
  const first = firstName.trim()[0] || "?";
  const last = lastName.trim()[0] || "";
  return `${first}${last}`.toUpperCase();
}

export default function Employees() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Get the current page and search parameters
        const params = {
          page: 1,
          limit: 10,
          search: search.trim()
        };

        const response = await fetchEmployees(params);
        
        if (!isMounted) return;
        
        if (response.data.success) {
          setEmployees(response.data.data.employees);
        } else {
          throw new Error("Failed to fetch employees");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to load employees");
        console.error("Error loading employees:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEmployees();
    return () => { isMounted = false; };
  }, [search]);

  // Close menu on outside click or Escape
  useEffect(() => {
    const handleClick = (e) => {
      if (openMenuId == null) return;
      const root = e.target.closest('[data-menu-root-id]');
      const clickedId = root?.getAttribute('data-menu-root-id');
      if (String(clickedId) !== String(openMenuId)) {
        setOpenMenuId(null);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
        if (selectedEmployee) {
          closeModal();
        }
        if (deleteConfirm) {
          cancelDelete();
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenuId, selectedEmployee, deleteConfirm]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  }, [search, employees]);

  const formatCurrency = (v) => new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(v || 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleViewDetails = async (employeeId) => {
    try {
      setModalLoading(true);
      setOpenMenuId(null);
      const response = await fetchEmployeeById(employeeId);
      
      if (response.data.success) {
        setSelectedEmployee(response.data.data.employee);
      } else {
        throw new Error("Failed to fetch employee details");
      }
    } catch (err) {
      console.error("Error loading employee details:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load employee details");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (employee) => {
    setDeleteConfirm(employee);
    setDeletePassword("");
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!deletePassword.trim()) {
      setError("Please enter your admin password to confirm deletion");
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");
      await deleteEmployee(deleteConfirm.id, deletePassword);
      
      // Remove employee from local state
      setEmployees(prev => prev.filter(emp => emp.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setDeletePassword("");
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to delete employee");
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
    setDeletePassword("");
    setError("");
  };

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-1">Employee Management</h2>
          <p className="text-gray-600">Manage your team and their payroll information.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm" onClick={() => window.open('/employees/new', '_blank') }>
          <MdAdd className="text-xl" />
          <span className="font-medium">Add Employee</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td className="px-6 py-4 text-sm text-gray-500" colSpan={6}>Loading...</td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td className="px-6 py-4 text-sm text-red-600" colSpan={6}>{error}</td>
              </tr>
            )}
            {!loading && !error && filtered.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm font-bold">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatCurrency(emp.salary)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    emp.status === 'active' ? 'bg-green-100 text-green-800' :
                    emp.status === 'inactive' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="relative inline-block" data-menu-root-id={emp.id}>
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                      }}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === emp.id}
                    >
                      <MdMoreVert />
                    </button>
                    {openMenuId === emp.id && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 flex flex-col"
                      >
                        <button className="block w-full text-left px-4 py-2 text-sm bg-blue-600 text-white font-medium" onClick={() => handleViewDetails(emp.id)}>View Details</button>
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50" onClick={() => {
                          setOpenMenuId(null);
                          window.open(`/employees/edit/${emp.id}`, '_blank');
                        }}>Edit Employee</button>
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50" onClick={() => {
                          setOpenMenuId(null);
                          window.open(`/payroll/${emp.id}`, '_blank');
                        }}>View Payroll</button>
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600" onClick={() => handleDeleteEmployee(emp)}>Remove</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500 text-center" colSpan={6}>No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur effect */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Employee Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading employee details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Employee Header */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xl font-bold">
                      {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </h4>
                      <p className="text-gray-600">{selectedEmployee.email}</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${
                        selectedEmployee.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedEmployee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Employee Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Employee ID</label>
                          <p className="text-gray-900">{selectedEmployee.employeeId || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{selectedEmployee.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-gray-900">
                            {selectedEmployee.dateOfBirth ? 
                              new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Address</label>
                          <p className="text-gray-900">{selectedEmployee.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 border-b pb-2">Employment Information</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Department</label>
                          <p className="text-gray-900">{selectedEmployee.department || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Position</label>
                          <p className="text-gray-900">{selectedEmployee.position || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Hire Date</label>
                          <p className="text-gray-900">
                            {selectedEmployee.hireDate ? 
                              new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Employment Type</label>
                          <p className="text-gray-900 capitalize">
                            {selectedEmployee.employmentType?.replace('_', ' ') || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 border-b pb-2">Financial Information</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Salary</label>
                          <p className="text-gray-900 font-semibold text-lg">
                            {formatCurrency(selectedEmployee.salary)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Bank Account</label>
                          <p className="text-gray-900">{selectedEmployee.bankAccount || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tax ID</label>
                          <p className="text-gray-900">{selectedEmployee.taxId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 border-b pb-2">Emergency Contact</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                          <p className="text-gray-900">{selectedEmployee.emergencyContact || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeModal();
                  window.open(`/employees/edit/${selectedEmployee.id}`, '_blank');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur effect */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={cancelDelete}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <MdWarning className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Delete Employee</h3>
              </div>
              <button
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm font-bold">
                    {getInitials(deleteConfirm.firstName, deleteConfirm.lastName)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {deleteConfirm.firstName} {deleteConfirm.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{deleteConfirm.email}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MdWarning className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Warning: This action cannot be undone
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You are about to permanently delete this employee and all associated data. 
                          This action cannot be reversed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your admin password to confirm deletion:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading || !deletePassword.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete Employee"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


