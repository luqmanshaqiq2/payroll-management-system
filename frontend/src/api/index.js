import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchDashboardOverview = () => api.get("/dashboard");
export const fetchEmployeeStats = () => api.get("/employees/stats");
export const fetchPayrollStats = (params) => api.get("/payroll/stats", { params });

// Employee API functions
export const fetchEmployees = (params) => api.get("/employees", { params });
export const fetchEmployeeById = (id) => api.get(`/employees/${id}`);
export const fetchEmployeeByEmployeeId = (employeeId) => api.get(`/employees/employee-id/${employeeId}`);
export const createEmployee = (data) => api.post("/employees", data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id, password) => api.delete(`/employees/${id}`, { data: { password } });

// Attendance API functions
export const fetchAttendance = (params) => api.get("/attendance", { params });
export const fetchAttendanceById = (id) => api.get(`/attendance/${id}`);
export const createAttendance = (data) => api.post("/attendance", data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const approveAttendance = (id, data) => api.patch(`/attendance/${id}/approve`, data);
export const fetchAttendanceStats = (params) => api.get("/attendance/stats", { params });
export const fetchMonthlySummary = (params) => api.get("/attendance/monthly-summary", { params });

// Payroll API functions
export const fetchPayrollPreview = (params) => api.get("/payroll/bulk/preview", { params });
export const generateBulkPayroll = (data) => api.post("/payroll/bulk/generate", data);
export const approveBulkPayroll = (data) => api.post("/payroll/bulk/approve", data);
export const createBulkPayrollFromPreview = (data) => api.post("/payroll/bulk/create", data);
export const createPayroll = (data) => api.post("/payroll", data);

// Payslip API functions
export const generatePayslip = (payrollId) => api.get(`/payroll/payslip/${payrollId}`);
export const generateBulkPayslips = (data) => api.post("/payroll/payslips/bulk", data);

// Reports API functions
export const generatePayrollSummaryReport = (data) => api.post("/reports/payroll-summary", data);
export const generateAttendanceSummaryReport = (data) => api.post("/reports/attendance-summary", data);
export const generateEmployeeSummaryReport = (data) => api.post("/reports/employee-summary", data);
export const fetchAllReports = (params) => api.get("/reports", { params });
export const fetchReportById = (id) => api.get(`/reports/${id}`);
export const deleteReport = (id) => api.delete(`/reports/${id}`);

// Admin profile API functions
export const getCurrentAdmin = () => api.get("/admin/profile");
export const updateAdminProfile = (data) => api.put("/admin/profile", data);
export const uploadProfilePhoto = (formData) => api.post("/admin/profile/photo", formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export default api;


