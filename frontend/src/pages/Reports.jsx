import { useState, useEffect } from "react";
import { 
  MdOutlineReport, 
  MdDownload, 
  MdDelete, 
  MdVisibility, 
  MdDateRange,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdAttachMoney,
  MdGroup,
  MdAccessTime,
  MdTrendingUp,
  MdFileDownload,
  MdCalendarToday
} from "react-icons/md";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  generatePayrollSummaryReport, 
  generateAttendanceSummaryReport, 
  generateEmployeeSummaryReport,
  fetchAllReports,
  fetchReportById,
  deleteReport
} from "../api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportType, setReportType] = useState("payroll_summary");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    department: "",
    status: "",
    employeeId: ""
  });

  // Fetch all reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetchAllReports();
      setReports(response.data.data.reports || []);
    } catch (err) {
      setError("Failed to fetch reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type, reportFilters) => {
    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      let response;
      switch (type) {
        case "payroll_summary":
          response = await generatePayrollSummaryReport(reportFilters);
          break;
        case "attendance_summary":
          response = await generateAttendanceSummaryReport(reportFilters);
          break;
        case "employee_summary":
          response = await generateEmployeeSummaryReport(reportFilters);
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (response.data.success) {
        setSuccess("Report generated successfully!");
        await fetchReports(); // Refresh the reports list
        setShowGenerateModal(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = () => {
    const reportFilters = {
      ...filters,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      department: filters.department || undefined,
      status: filters.status || undefined,
      employeeId: filters.employeeId || undefined
    };

    generateReport(reportType, reportFilters);
  };

  const viewReport = async (reportId) => {
    try {
      const response = await fetchReportById(reportId);
      setSelectedReport(response.data.data.report);
      setShowReportModal(true);
    } catch (err) {
      setError("Failed to fetch report details");
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport(reportId);
        setSuccess("Report deleted successfully!");
        await fetchReports();
      } catch (err) {
        setError("Failed to delete report");
        console.error(err);
      }
    }
  };

  const createTestReport = () => {
    // Create a test report with sample data to test the rendering
    const testReport = {
      id: 'test-' + Date.now(),
      title: 'Test Payroll Report',
      description: 'Test report with sample data',
      reportType: 'payroll_summary',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      reportData: {
        payrolls: [
          {
            id: 1,
            employee: {
              id: 1,
              employeeId: 'EMP001',
              firstName: 'John',
              lastName: 'Doe',
              department: 'Engineering',
              position: 'Developer'
            },
            grossPay: 50000,
            netPay: 45000,
            totalDeductions: 5000,
            status: 'approved'
          },
          {
            id: 2,
            employee: {
              id: 2,
              employeeId: 'EMP002',
              firstName: 'Jane',
              lastName: 'Smith',
              department: 'Marketing',
              position: 'Manager'
            },
            grossPay: 60000,
            netPay: 54000,
            totalDeductions: 6000,
            status: 'approved'
          }
        ],
        summary: {
          totalEmployees: 2,
          totalGrossPay: 110000,
          totalNetPay: 99000,
          totalDeductions: 11000
        }
      }
    };

    setSelectedReport(testReport);
    setShowReportModal(true);
  };

  const exportReport = (report, format = 'csv') => {
    // Enhanced export functionality with proper data handling
    // Parse the JSON string if it's a string, otherwise use as is
    const data = typeof report.reportData === 'string' 
      ? JSON.parse(report.reportData) 
      : report.reportData;
    let content = "";
    let filename = "";
    let mimeType = "";
    
    if (report.reportType === "payroll_summary") {
      // Handle payroll summary report data structure from backend
      const payrolls = data.payrolls || [];
      
      if (format === 'excel') {
        // Excel export using xlsx
        const worksheetData = [
          ['Employee ID', 'Employee Name', 'Department', 'Position', 'Gross Pay', 'Net Pay', 'Deductions', 'Status', 'Pay Period Start', 'Pay Period End']
        ];
        
        if (Array.isArray(payrolls) && payrolls.length > 0) {
          payrolls.forEach(payroll => {
            const employeeId = payroll.employee?.employeeId || 'N/A';
            const employeeName = payroll.employee ? 
              `${payroll.employee.firstName || ''} ${payroll.employee.lastName || ''}`.trim() :
              'N/A';
            const department = payroll.employee?.department || 'N/A';
            const position = payroll.employee?.position || 'N/A';
            const grossPay = payroll.grossPay || 0;
            const netPay = payroll.netPay || 0;
            const deductions = payroll.totalDeductions || 0;
            const status = payroll.status || 'Unknown';
            const payPeriodStart = payroll.payPeriod?.start || 'N/A';
            const payPeriodEnd = payroll.payPeriod?.end || 'N/A';
            
            worksheetData.push([
              employeeId, employeeName, department, position, grossPay, netPay, deductions, status, payPeriodStart, payPeriodEnd
            ]);
          });
        }
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Summary');
        
        // Add summary sheet
        if (data.summary) {
          const summaryData = [
            ['Metric', 'Value'],
            ['Total Records', data.summary.totalRecords || 0],
            ['Total Gross Pay', data.summary.totalGrossPay || 0],
            ['Total Net Pay', data.summary.totalNetPay || 0],
            ['Total Deductions', data.summary.totalDeductions || 0],
            ['Average Gross Pay', data.summary.averageGrossPay || 0],
            ['Average Net Pay', data.summary.averageNetPay || 0]
          ];
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        }
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        saveAs(blob, filename);
        return;
      } else if (format === 'csv') {
        content = "Employee ID,Employee Name,Department,Position,Gross Pay,Net Pay,Deductions,Status,Pay Period Start,Pay Period End\n";
        mimeType = 'text/csv';
        filename = `${report.title.replace(/\s+/g, '_')}.csv`;
        
        if (Array.isArray(payrolls) && payrolls.length > 0) {
          payrolls.forEach(payroll => {
            const employeeId = payroll.employee?.employeeId || 'N/A';
            const employeeName = payroll.employee ? 
              `${payroll.employee.firstName || ''} ${payroll.employee.lastName || ''}`.trim() :
              'N/A';
            const department = payroll.employee?.department || 'N/A';
            const position = payroll.employee?.position || 'N/A';
            const grossPay = payroll.grossPay || 0;
            const netPay = payroll.netPay || 0;
            const deductions = payroll.totalDeductions || 0;
            const status = payroll.status || 'Unknown';
            const payPeriodStart = payroll.payPeriod?.start || 'N/A';
            const payPeriodEnd = payroll.payPeriod?.end || 'N/A';
            
            content += `"${employeeId}","${employeeName}","${department}","${position}","${grossPay}","${netPay}","${deductions}","${status}","${payPeriodStart}","${payPeriodEnd}"\n`;
          });
        } else {
          content += "No payroll data available\n";
        }
      } else {
        // JSON format for Excel-like structure
        content = JSON.stringify({
          reportType: report.reportType,
          title: report.title,
          generatedAt: report.generatedAt,
          summary: data.summary,
          data: payrolls
        }, null, 2);
        mimeType = 'application/json';
        filename = `${report.title.replace(/\s+/g, '_')}.json`;
      }
    } else if (report.reportType === "attendance_summary") {
      // Handle attendance summary report data structure from backend
      const attendances = data.attendances || [];
      
      if (format === 'excel') {
        // Excel export using xlsx
        const worksheetData = [
          ['Employee ID', 'Employee Name', 'Department', 'Position', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Approved']
        ];
        
        if (Array.isArray(attendances) && attendances.length > 0) {
          attendances.forEach(attendance => {
            const employeeId = attendance.employee?.employeeId || 'N/A';
            const employeeName = attendance.employee ? 
              `${attendance.employee.firstName || ''} ${attendance.employee.lastName || ''}`.trim() :
              'N/A';
            const department = attendance.employee?.department || 'N/A';
            const position = attendance.employee?.position || 'N/A';
            const date = attendance.date || 'N/A';
            const checkIn = attendance.checkIn || 'N/A';
            const checkOut = attendance.checkOut || 'N/A';
            const totalHours = attendance.totalHours || 'N/A';
            const status = attendance.status || 'Unknown';
            const isApproved = attendance.isApproved ? 'Yes' : 'No';
            
            worksheetData.push([
              employeeId, employeeName, department, position, date, checkIn, checkOut, totalHours, status, isApproved
            ]);
          });
        }
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary');
        
        // Add summary sheet
        if (data.summary) {
          const summaryData = [
            ['Metric', 'Value'],
            ['Total Records', data.summary.totalRecords || 0],
            ['Present Count', data.summary.presentCount || 0],
            ['Absent Count', data.summary.absentCount || 0],
            ['Late Count', data.summary.lateCount || 0],
            ['Attendance Rate (%)', data.summary.attendanceRate || 0],
            ['Total Hours', data.summary.totalHours || 0],
            ['Average Hours Per Day', data.summary.averageHoursPerDay || 0]
          ];
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        }
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        saveAs(blob, filename);
        return;
      } else if (format === 'csv') {
        content = "Employee ID,Employee Name,Department,Position,Date,Check In,Check Out,Total Hours,Status,Approved\n";
        mimeType = 'text/csv';
        filename = `${report.title.replace(/\s+/g, '_')}.csv`;
        
        if (Array.isArray(attendances) && attendances.length > 0) {
          attendances.forEach(attendance => {
            const employeeId = attendance.employee?.employeeId || 'N/A';
            const employeeName = attendance.employee ? 
              `${attendance.employee.firstName || ''} ${attendance.employee.lastName || ''}`.trim() :
              'N/A';
            const department = attendance.employee?.department || 'N/A';
            const position = attendance.employee?.position || 'N/A';
            const date = attendance.date || 'N/A';
            const checkIn = attendance.checkIn || 'N/A';
            const checkOut = attendance.checkOut || 'N/A';
            const totalHours = attendance.totalHours || 'N/A';
            const status = attendance.status || 'Unknown';
            const isApproved = attendance.isApproved ? 'Yes' : 'No';
            
            content += `"${employeeId}","${employeeName}","${department}","${position}","${date}","${checkIn}","${checkOut}","${totalHours}","${status}","${isApproved}"\n`;
          });
        } else {
          content += "No attendance data available\n";
        }
      } else {
        // JSON format for Excel-like structure
        content = JSON.stringify({
          reportType: report.reportType,
          title: report.title,
          generatedAt: report.generatedAt,
          summary: data.summary,
          data: attendances
        }, null, 2);
        mimeType = 'application/json';
        filename = `${report.title.replace(/\s+/g, '_')}.json`;
      }
    } else if (report.reportType === "employee_summary") {
      // Handle employee summary report data structure from backend
      const employees = data.employees || [];
      
      if (format === 'excel') {
        // Excel export using xlsx
        const worksheetData = [
          ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Salary', 'Employment Type', 'Status', 'Hire Date']
        ];
        
        if (Array.isArray(employees) && employees.length > 0) {
          employees.forEach(employee => {
            const employeeId = employee.employeeId || 'N/A';
            const firstName = employee.firstName || 'N/A';
            const lastName = employee.lastName || 'N/A';
            const email = employee.email || 'N/A';
            const department = employee.department || 'N/A';
            const position = employee.position || 'N/A';
            const salary = employee.salary || 0;
            const employmentType = employee.employmentType || 'N/A';
            const status = employee.status || 'Unknown';
            const hireDate = employee.hireDate || 'N/A';
            
            worksheetData.push([
              employeeId, firstName, lastName, email, department, position, salary, employmentType, status, hireDate
            ]);
          });
        }
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Summary');
        
        // Add summary sheet
        if (data.summary) {
          const summaryData = [
            ['Metric', 'Value'],
            ['Total Employees', data.summary.totalEmployees || 0],
            ['Active Employees', data.summary.activeEmployees || 0],
            ['Inactive Employees', data.summary.inactiveEmployees || 0],
            ['Average Salary', data.summary.averageSalary || 0]
          ];
          
          // Add department breakdown
          if (data.summary.departmentBreakdown) {
            summaryData.push(['', '']);
            summaryData.push(['Department Breakdown', '']);
            Object.entries(data.summary.departmentBreakdown).forEach(([dept, count]) => {
              summaryData.push([dept, count]);
            });
          }
          
          // Add employment type breakdown
          if (data.summary.employmentTypeBreakdown) {
            summaryData.push(['', '']);
            summaryData.push(['Employment Type Breakdown', '']);
            Object.entries(data.summary.employmentTypeBreakdown).forEach(([type, count]) => {
              summaryData.push([type, count]);
            });
          }
          
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        }
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        saveAs(blob, filename);
        return;
      } else if (format === 'csv') {
        content = "Employee ID,First Name,Last Name,Email,Department,Position,Salary,Employment Type,Status,Hire Date\n";
        mimeType = 'text/csv';
        filename = `${report.title.replace(/\s+/g, '_')}.csv`;
        
        if (Array.isArray(employees) && employees.length > 0) {
          employees.forEach(employee => {
            const employeeId = employee.employeeId || 'N/A';
            const firstName = employee.firstName || 'N/A';
            const lastName = employee.lastName || 'N/A';
            const email = employee.email || 'N/A';
            const department = employee.department || 'N/A';
            const position = employee.position || 'N/A';
            const salary = employee.salary || 0;
            const employmentType = employee.employmentType || 'N/A';
            const status = employee.status || 'Unknown';
            const hireDate = employee.hireDate || 'N/A';
            
            content += `"${employeeId}","${firstName}","${lastName}","${email}","${department}","${position}","${salary}","${employmentType}","${status}","${hireDate}"\n`;
          });
        } else {
          content += "No employee data available\n";
        }
      } else {
        // JSON format for Excel-like structure
        content = JSON.stringify({
          reportType: report.reportType,
          title: report.title,
          generatedAt: report.generatedAt,
          summary: data.summary,
          data: employees
        }, null, 2);
        mimeType = 'application/json';
        filename = `${report.title.replace(/\s+/g, '_')}.json`;
      }
    } else {
      // Fallback for unknown report types
      if (format === 'csv') {
        content = "Report Type,Title,Description,Generated At,Status\n";
        content += `"${report.reportType}","${report.title}","${report.description}","${report.generatedAt}","${report.status}"\n`;
        mimeType = 'text/csv';
        filename = `${report.title.replace(/\s+/g, '_')}.csv`;
      } else {
        content = JSON.stringify({
          reportType: report.reportType,
          title: report.title,
          description: report.description,
          generatedAt: report.generatedAt,
          status: report.status,
          reportData: data
        }, null, 2);
        mimeType = 'application/json';
        filename = `${report.title.replace(/\s+/g, '_')}.json`;
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case "payroll_summary":
        return <MdAttachMoney className="text-green-600" />;
      case "attendance_summary":
        return <MdAccessTime className="text-blue-600" />;
      case "employee_summary":
        return <MdGroup className="text-purple-600" />;
      default:
        return <MdOutlineReport className="text-gray-600" />;
    }
  };

  const getReportTypeName = (type) => {
    switch (type) {
      case "payroll_summary":
        return "Payroll Summary";
      case "attendance_summary":
        return "Attendance Summary";
      case "employee_summary":
        return "Employee Summary";
      default:
        return "Unknown Report";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderReportData = (report) => {
    if (!report.reportData) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>No data available for this report</p>
        </div>
      );
    }

    const { reportType } = report;
    // Parse the JSON string if it's a string, otherwise use as is
    const reportData = typeof report.reportData === 'string' 
      ? JSON.parse(report.reportData) 
      : report.reportData;

    switch (reportType) {
      case "payroll_summary":
        return renderPayrollSummaryTable(reportData);
      case "attendance_summary":
        return renderAttendanceSummaryTable(reportData);
      case "employee_summary":
        return renderEmployeeSummaryTable(reportData);
      default:
        return (
          <div className="p-6">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderPayrollSummaryTable = (data) => {
    // Use the correct data structure from backend
    const payrolls = data.payrolls || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payrolls.map((payroll, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payroll.employee?.firstName} {payroll.employee?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{payroll.employee?.employeeId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payroll.employee?.department || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payroll.employee?.position || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="text-sm">
                    {payroll.payPeriod?.start ? new Date(payroll.payPeriod.start).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {payroll.payPeriod?.end ? new Date(payroll.payPeriod.end).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  LKR {parseFloat(payroll.grossPay || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  LKR {parseFloat(payroll.totalDeductions || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  LKR {parseFloat(payroll.netPay || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    payroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                    payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payroll.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payrolls.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>No payroll data found for the selected period</p>
          </div>
        )}
      </div>
    );
  };

  const renderAttendanceSummaryTable = (data) => {
    // Use the correct data structure from backend
    const attendances = data.attendances || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.map((attendance, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {attendance.employee?.firstName} {attendance.employee?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{attendance.employee?.employeeId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {attendance.employee?.department || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {attendance.date ? new Date(attendance.date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {attendance.checkIn || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {attendance.checkOut || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {attendance.totalHours || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                    attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                    attendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {attendance.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    attendance.isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {attendance.isApproved ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendances.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>No attendance data found for the selected period</p>
          </div>
        )}
      </div>
    );
  };

  const renderEmployeeSummaryTable = (data) => {
    // Use the correct data structure from backend
    const employees = data.employees || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.employeeId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{employee.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.department || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.position || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  LKR {parseFloat(employee.salary || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.employmentType || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' :
                    employee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>No employee data found</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-gray-600">Generate and manage payroll analytics and summaries.</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="text-lg" />
            Generate Report
          </button>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <MdRefresh className="text-lg" />
            Refresh
          </button>
          <button
            onClick={createTestReport}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="text-lg" />
            Test Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white border rounded-lg">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MdOutlineReport className="text-4xl mx-auto mb-2 text-gray-300" />
            <p>No reports generated yet</p>
            <p className="text-sm">Click "Generate Report" to create your first report</p>
          </div>
        ) : (
          <div className="divide-y">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getReportTypeIcon(report.reportType)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-500">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Generated: {new Date(report.generatedAt).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewReport(report.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Report"
                    >
                      <MdVisibility className="text-lg" />
                    </button>
                    <div className="relative group">
                      <button
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Export Report"
                      >
                        <MdFileDownload className="text-lg" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => exportReport(report, 'excel')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as Excel
                          </button>
                          <button
                            onClick={() => exportReport(report, 'csv')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as CSV
                          </button>
                          <button
                            onClick={() => exportReport(report, 'json')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as JSON
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Report"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="payroll_summary">Payroll Summary</option>
                  <option value="attendance_summary">Attendance Summary</option>
                  <option value="employee_summary">Employee Summary</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  placeholder="e.g., Engineering, HR"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status (Optional)</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdDelete className="text-xl" />
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-500">
              Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Report Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedReport.reportData?.summary && Object.entries(selectedReport.reportData.summary).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Report Data</h4>
              <div className="bg-white border rounded-lg overflow-hidden">
                {renderReportData(selectedReport)}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportReport(selectedReport, 'excel')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                >
                  <MdFileDownload className="text-lg" />
                  Export Excel
                </button>
                <button
                  onClick={() => exportReport(selectedReport, 'csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  <MdFileDownload className="text-lg" />
                  Export CSV
                </button>
                <button
                  onClick={() => exportReport(selectedReport, 'json')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                >
                  <MdFileDownload className="text-lg" />
                  Export JSON
                </button>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


