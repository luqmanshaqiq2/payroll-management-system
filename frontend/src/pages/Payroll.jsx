
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MdCheckCircle, MdVisibility, MdCheck, MdClose, MdPrint, MdDownload, MdEmail, MdArrowBack } from "react-icons/md";
import { fetchPayrollPreview, createBulkPayrollFromPreview, fetchEmployeeById, generateBulkPayslips } from "../api";

export default function Payroll() {
  const { id } = useParams(); // Get employee ID from URL params
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [totals, setTotals] = useState({});
  const [payPeriod, setPayPeriod] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  
  // Individual employee states
  const [employeeData, setEmployeeData] = useState(null);
  const [employeePayroll, setEmployeePayroll] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  
  // Payslip states
  const [showPayslips, setShowPayslips] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Get current date and calculate pay period
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Default pay period: 1st to 25th of current month
  const defaultPayPeriodStart = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultPayPeriodEnd = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-25`;
  
  const [payPeriodStart, setPayPeriodStart] = useState(defaultPayPeriodStart);
  const [payPeriodEnd, setPayPeriodEnd] = useState(defaultPayPeriodEnd);

  // Check if this is an individual employee view
  const isIndividualView = id !== undefined;

  // Fetch individual employee data
  const fetchEmployeeData = async () => {
    if (!id) return;
    
    try {
      setEmployeeLoading(true);
      setError('');
      
      const response = await fetchEmployeeById(id);
      
      if (response.data.success) {
        setEmployeeData(response.data.data.employee);
      } else {
        throw new Error("Failed to fetch employee data");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load employee data");
      console.error("Error loading employee data:", err);
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Load employee data on component mount if individual view
  useEffect(() => {
    if (isIndividualView) {
      fetchEmployeeData();
    }
  }, [id]);

  // Fetch payroll preview
  const fetchPreview = async () => {
    try {
      setPreviewLoading(true);
      setError('');

      const response = await fetchPayrollPreview({
        payPeriodStart,
        payPeriodEnd
      });
      
      console.log('=== PAYROLL API RESPONSE DEBUG ===');
      console.log('Full API response:', response.data);
      console.log('Payroll preview data:', response.data.data.payrollPreview);
      console.log('Payroll preview length:', response.data.data.payrollPreview?.length);
      console.log('=== END API RESPONSE DEBUG ===');
      
      let filteredPayrollData = response.data.data.payrollPreview || [];
      
      // Check if API returned any data at all
      if (!response.data.data.payrollPreview || response.data.data.payrollPreview.length === 0) {
        console.log('No payroll data returned from API for the selected period');
        setError('No payroll data available for the selected pay period. This could mean no employees have attendance records for this period.');
        setShowPreview(true);
        setPayrollData([]);
        setPreviewLoading(false);
        return;
      }
      
      // If this is an individual employee view, filter to show only that employee
      if (isIndividualView && employeeData) {
        console.log('=== PAYROLL FILTERING DEBUG ===');
        console.log('Employee data from API:', employeeData);
        console.log('Available payroll data:', response.data.data.payrollPreview);
        console.log('Employee ID from employeeData:', employeeData.employeeId);
        console.log('Employee ID from employeeData.id:', employeeData.id);
        
        // Try different possible field matches
        filteredPayrollData = response.data.data.payrollPreview.filter(emp => {
          console.log('--- Comparing payroll employee ---');
          console.log('Payroll emp.employeeId:', emp.employeeId);
          console.log('Payroll emp.id:', emp.id);
          console.log('Payroll emp.employeeName:', emp.employeeName);
          console.log('Target employeeData.employeeId:', employeeData.employeeId);
          console.log('Target employeeData.id:', employeeData.id);
          
          const match1 = emp.employeeId === employeeData.employeeId;
          const match2 = emp.id === employeeData.id;
          const match3 = emp.employeeId === employeeData.id;
          const match4 = emp.id === employeeData.employeeId;
          const match5 = emp.employeeName && employeeData.firstName && 
                        emp.employeeName.toLowerCase().includes(employeeData.firstName.toLowerCase());
          
          console.log('Match results:', { match1, match2, match3, match4, match5 });
          
          return match1 || match2 || match3 || match4 || match5;
        });
        
        console.log('Final filtered result:', filteredPayrollData);
        console.log('=== END FILTERING DEBUG ===');
        
        // If no match found, show all data for debugging
        if (filteredPayrollData.length === 0) {
          console.log('No specific employee match found, showing all payroll data for debugging');
          filteredPayrollData = response.data.data.payrollPreview;
          setError(`No payroll data found for ${employeeData.firstName} ${employeeData.lastName} (${employeeData.employeeId}). Showing all available payroll data for debugging.`);
        }
      }
      
      setPayrollData(filteredPayrollData);
      setTotals(response.data.data.totals);
      setPayPeriod(response.data.data.payPeriod);
      setShowPreview(true);
      
      console.log('Payroll preview data:', filteredPayrollData);
      console.log('Filtered employee data:', filteredPayrollData[0]);
      
      // Select the filtered employee(s) by default
      const employeeIds = filteredPayrollData.map(emp => emp.employeeId);
      setSelectedEmployees(new Set(employeeIds));
      
    } catch (err) {
      setError('Error fetching payroll preview');
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };


  // Create and approve payroll records
  const handleApprovePayroll = async () => {
    try {
      setLoading(true);
      setError('');
      
      const selectedEmployeeIds = Array.from(selectedEmployees);
      if (selectedEmployeeIds.length === 0) {
        alert('Please select at least one employee');
        return;
      }
      
      // Get selected employees' data
      const selectedEmployeesData = payrollData.filter(emp => 
        selectedEmployeeIds.includes(emp.employeeId)
      );
      
      console.log('Selected employees data:', selectedEmployeesData);
      console.log('First employee data:', selectedEmployeesData[0]);
      
      // Prepare bulk payroll data
      const bulkPayrollData = {
        payrollData: selectedEmployeesData,
        payPeriodStart: new Date(payPeriodStart).toISOString().split('T')[0],
        payPeriodEnd: new Date(payPeriodEnd).toISOString().split('T')[0],
        processedBy: 5 // Use existing admin ID
      };
      
      console.log('Creating bulk payroll with data:', bulkPayrollData);
      
      // Create bulk payroll records
      const response = await createBulkPayrollFromPreview(bulkPayrollData);
      
      if (response.data.success) {
        const employeeCount = response.data.data.totalCreated;
        const employeeName = isIndividualView && employeeData ? 
          `${employeeData.firstName} ${employeeData.lastName}` : 
          'employees';
        
        alert(`Payroll record created and approved successfully for ${employeeName}`);
        
        // Show any errors if they occurred
        if (response.data.data.errors && response.data.data.errors.length > 0) {
          console.warn('Some payroll records had issues:', response.data.data.errors);
        }
        
        // Refresh the preview
        await fetchPreview();
      } else {
        setError('Failed to create payroll records');
      }
      
    } catch (err) {
      // Check if it's a duplicate payroll error
      if (err.response && err.response.data && err.response.data.message === 'Payroll for this month has already been processed') {
        alert('Payroll for this month has already been processed');
      } else {
        setError('Error creating payroll records');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  // Select all employees
  const selectAllEmployees = () => {
    const allIds = payrollData.map(emp => emp.employeeId);
    setSelectedEmployees(new Set(allIds));
  };

  // Deselect all employees
  const deselectAllEmployees = () => {
    setSelectedEmployees(new Set());
  };

  // Generate payslips for the current pay period
  const generatePayslips = async () => {
    try {
      setPayslipLoading(true);
      setError('');

      const response = await generateBulkPayslips({
        payPeriodStart,
        payPeriodEnd
      });
      
      if (response.data.success) {
        setPayslips(response.data.data.payslips);
        setShowPayslips(true);
      } else {
        setError('Failed to generate payslips');
      }
      
    } catch (err) {
      setError('Error generating payslips');
      console.error(err);
    } finally {
      setPayslipLoading(false);
    }
  };

  // Print payslip
  const printPayslip = (payslip) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePayslipHTML(payslip));
    printWindow.document.close();
    printWindow.print();
  };

  // Generate payslip HTML
  const generatePayslipHTML = (payslip) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${payslip.employee.firstName} ${payslip.employee.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .company-info { margin-bottom: 20px; }
          .employee-info { margin-bottom: 20px; }
          .payroll-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .earnings, .deductions { width: 48%; }
          .summary { border-top: 2px solid #333; padding-top: 10px; text-align: right; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .amount { text-align: right; }
          .attendance-info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYSLIP</h1>
          <p>Pay Period: ${payslip.payroll.payPeriodStart} to ${payslip.payroll.payPeriodEnd}</p>
        </div>
        
        <div class="company-info">
          <h3>Company Name</h3>
          <p>Address Line 1<br>Address Line 2</p>
        </div>
        
        <div class="employee-info">
          <h3>Employee Information</h3>
          <p><strong>Name:</strong> ${payslip.employee.firstName} ${payslip.employee.lastName}</p>
          <p><strong>Employee ID:</strong> ${payslip.employee.employeeId}</p>
          <p><strong>Department:</strong> ${payslip.employee.department}</p>
          <p><strong>Position:</strong> ${payslip.employee.position}</p>
        </div>
        
        <div class="attendance-info">
          <h3>Attendance Summary</h3>
          <p><strong>Total Days:</strong> ${payslip.attendance.totalDays}</p>
          <p><strong>Present Days:</strong> ${payslip.attendance.presentDays}</p>
          <p><strong>Total Hours:</strong> ${payslip.attendance.totalHours}</p>
          <p><strong>Overtime Hours:</strong> ${payslip.attendance.overtimeHours}</p>
        </div>
        
        <div class="payroll-details">
          <div class="earnings">
            <h3>Earnings</h3>
            <table>
              <tr><td>Basic Salary</td><td class="amount">LKR ${payslip.earnings.basicSalary.toLocaleString()}</td></tr>
              <tr><td>Overtime Pay</td><td class="amount">LKR ${payslip.earnings.overtimePay.toLocaleString()}</td></tr>
              <tr><td><strong>Gross Pay</strong></td><td class="amount"><strong>LKR ${payslip.earnings.grossPay.toLocaleString()}</strong></td></tr>
            </table>
          </div>
          
          <div class="deductions">
            <h3>Deductions</h3>
            <table>
              <tr><td>Tax</td><td class="amount">LKR ${payslip.deductions.tax.toLocaleString()}</td></tr>
              <tr><td>EPF</td><td class="amount">LKR ${payslip.deductions.epf.toLocaleString()}</td></tr>
              <tr><td><strong>Total Deductions</strong></td><td class="amount"><strong>LKR ${payslip.deductions.total.toLocaleString()}</strong></td></tr>
            </table>
          </div>
        </div>
        
        <div class="summary">
          <h2>Net Pay: LKR ${payslip.netPay.toLocaleString()}</h2>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
          <p>This payslip is computer generated and does not require a signature.</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Individual employee view
  if (isIndividualView) {
    return (
      <>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MdArrowBack className="text-lg" />
              Back
            </button>
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-1">Employee Payroll</h2>
              <p className="text-gray-600">View and manage payroll for individual employee.</p>
            </div>
          </div>
        </div>

        {employeeLoading ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employee data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : employeeData ? (
          <div className="space-y-6">
            {/* Employee Information Card */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xl font-bold">
                  {employeeData.firstName?.[0]}{employeeData.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {employeeData.firstName} {employeeData.lastName}
                  </h3>
                  <p className="text-gray-600">{employeeData.email}</p>
                  <p className="text-sm text-gray-500">ID: {employeeData.employeeId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{employeeData.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{employeeData.position || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary</label>
                  <p className="text-gray-900 font-semibold">LKR {employeeData.salary?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pay Period Selection for Individual Employee */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Period Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start</label>
                  <input
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End</label>
                  <input
                    type="date"
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={fetchPreview}
                  disabled={previewLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  <MdVisibility className="text-lg" />
                  {previewLoading ? 'Loading...' : 'Preview Payroll'}
                </button>
              </div>
            </div>

            {/* Individual Employee Payroll Preview */}
            {showPreview && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Preview</h3>
                
                {payrollData.length > 0 ? (
                  payrollData.map((employee, index) => (
                  <div key={employee.employeeId} className="bg-gray-50 rounded-lg p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-700 text-white flex items-center justify-center text-lg font-bold">
                          {employee.employeeName?.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{employee.employeeName}</h4>
                          <p className="text-sm text-gray-600">ID: {employee.employeeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-green-600">
                        <MdCheckCircle className="text-lg mr-1" />
                        <span className="font-medium">Ready</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Hours Worked</div>
                        <div className="text-lg font-semibold text-gray-900">{employee.hoursWorked}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Overtime</div>
                        <div className="text-lg font-semibold text-gray-900">{employee.overtimeHours}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Gross Pay</div>
                        <div className="text-lg font-semibold text-green-600">LKR {parseFloat(employee.grossPay).toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Net Pay</div>
                        <div className="text-lg font-semibold text-blue-600">LKR {parseFloat(employee.netPay).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">EPF</div>
                        <div className="text-sm text-gray-900">
                          {employee.isIntern ? 'N/A' : `LKR ${parseFloat(employee.epf).toLocaleString()}`}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Tax</div>
                        <div className="text-sm text-gray-900">
                          {employee.isIntern ? 'N/A' : `LKR ${parseFloat(employee.tax).toLocaleString()}`}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Role</div>
                        <div className="text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            employee.isIntern 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {employee.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Position</div>
                        <div className="text-sm text-gray-900">{employee.position || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Data Found</h3>
                    <p className="text-gray-600 mb-4">
                      No payroll data found for {employeeData?.firstName} {employeeData?.lastName} in the selected pay period.
                    </p>
                    <p className="text-sm text-gray-500">
                      This could mean:
                    </p>
                    <ul className="text-sm text-gray-500 mt-2 text-left max-w-md mx-auto">
                      <li>• No attendance records for this period</li>
                      <li>• Employee is not active in the system</li>
                      <li>• Pay period dates need adjustment</li>
                    </ul>
                  </div>
                )}

                {/* Action Buttons for Individual Employee */}
                {payrollData.length > 0 && (
                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={handleApprovePayroll}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <MdCheck className="text-xl" />
                      {loading ? 'Processing...' : 'Process Payroll'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </>
    );
  }

  // Bulk payroll view (original functionality)
  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 mb-1">Bulk Payroll Processing</h2>
        <p className="text-gray-600">Process payroll for all employees at once with automated calculations.</p>
      </div>

      {/* Pay Period Selection */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Period Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start</label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End</label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchPreview}
            disabled={previewLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
          >
            <MdVisibility className="text-lg" />
            {previewLoading ? 'Loading...' : 'Preview Payroll'}
          </button>
          <button
            onClick={generatePayslips}
            disabled={payslipLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
          >
            <MdDownload className="text-lg" />
            {payslipLoading ? 'Generating...' : 'View Payslips'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Payroll Preview Table */}
      {showPreview && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payroll Preview</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllEmployees}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Select All
              </button>
              <button
                onClick={deselectAllEmployees}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Deselect All
              </button>
            </div>
                </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.size === payrollData.length && payrollData.length > 0}
                      onChange={() => selectedEmployees.size === payrollData.length ? deselectAllEmployees() : selectAllEmployees()}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPF</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.map((employee, index) => (
                  <tr key={employee.employeeId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.employeeId)}
                        onChange={() => toggleEmployeeSelection(employee.employeeId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.employeeId}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employeeName}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.isIntern 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.position || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.hoursWorked}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.overtimeHours}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      LKR {parseFloat(employee.grossPay).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.isIntern ? '-' : `LKR ${parseFloat(employee.epf).toLocaleString()}`}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.isIntern ? '-' : `LKR ${parseFloat(employee.tax).toLocaleString()}`}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      LKR {parseFloat(employee.netPay).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="flex items-center text-green-600">
                        <MdCheckCircle className="text-lg mr-1" />
                        Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>

          {/* Totals Footer */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Employees</div>
                <div className="text-2xl font-bold text-gray-900">{totals.totalEmployees}</div>
                </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Gross Pay</div>
                <div className="text-2xl font-bold text-green-600">LKR {parseFloat(totals.totalGross).toLocaleString()}</div>
                </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Deductions</div>
                <div className="text-2xl font-bold text-red-600">LKR {parseFloat(totals.totalDeductions).toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Net Pay</div>
                <div className="text-2xl font-bold text-blue-600">LKR {parseFloat(totals.totalNet).toLocaleString()}</div>
              </div>
            </div>
          </div>
 
          {/* Action Buttons */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleApprovePayroll}
              disabled={loading || selectedEmployees.size === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <MdCheck className="text-xl" />
              {loading ? 'Approving...' : 'Approve & Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Payslips Section */}
      {showPayslips && (
        <div className="bg-white border rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Payslips</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPayslips(false)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslips.map((payslip, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payslip.employee.firstName} {payslip.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{payslip.employee.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payslip.employee.department}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      LKR {payslip.netPay.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => printPayslip(payslip)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Print Payslip"
                        >
                          <MdPrint className="text-lg" />
                        </button>
                        <button
                          onClick={() => setSelectedPayslip(payslip)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Preview Payslip"
                        >
                          <MdVisibility className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payslip Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Payslips</div>
                <div className="text-2xl font-bold text-gray-900">{payslips.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Net Pay</div>
                <div className="text-2xl font-bold text-green-600">
                  LKR {payslips.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Pay Period</div>
                <div className="text-lg font-bold text-blue-600">
                  {payPeriodStart} to {payPeriodEnd}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Preview Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payslip Preview - {selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName}</h3>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: generatePayslipHTML(selectedPayslip) }} />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => printPayslip(selectedPayslip)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MdPrint className="text-lg" />
                Print
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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