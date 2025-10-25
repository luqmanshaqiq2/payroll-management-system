import { useState, useEffect } from 'react';
import { MdCalendarToday, MdAccessTime, MdPerson, MdWork, MdCheckCircle, MdCancel, MdEventAvailable, MdEventBusy, MdTimer, MdTrendingUp } from 'react-icons/md';
import { fetchMonthlySummary } from '../api';

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState({
    totalWorkingDays: 0,
    daysPresent: 0,
    daysAbsent: 0,
    paidLeaves: 0,
    unpaidLeaves: 0,
    overtimeHours: 0,
    attendancePercentage: 0
  });

  // Function to calculate summary data from attendance records
  const calculateSummaryData = (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        totalWorkingDays: 0,
        daysPresent: 0,
        daysAbsent: 0,
        paidLeaves: 0,
        unpaidLeaves: 0,
        overtimeHours: 0,
        attendancePercentage: 0
      };
    }

    // Get unique dates from attendance records to calculate working days
    const uniqueDates = [...new Set(attendanceRecords.map(record => record.date))];
    const totalWorkingDays = uniqueDates.length;

    // Count different statuses
    let daysPresent = 0;
    let daysAbsent = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let overtimeHours = 0;

    attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'Present':
          daysPresent++;
          // Calculate overtime hours (assuming 8 hours is normal, anything over is overtime)
          if (record.checkIn && record.checkOut) {
            const checkInTime = new Date(`2000-01-01T${record.checkIn}`);
            const checkOutTime = new Date(`2000-01-01T${record.checkOut}`);
            const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            if (workHours > 8) {
              overtimeHours += workHours - 8;
            }
          }
          break;
        case 'Late':
          daysPresent++; // Late is still considered present
          break;
        case 'Absent':
          daysAbsent++;
          break;
        case 'Leave':
          // You might want to differentiate between paid and unpaid leaves
          // For now, assuming all leaves are paid
          paidLeaves++;
          break;
        default:
          break;
      }
    });

    // Calculate attendance percentage
    const totalDays = daysPresent + daysAbsent + paidLeaves + unpaidLeaves;
    const attendancePercentage = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;

    return {
      totalWorkingDays,
      daysPresent,
      daysAbsent,
      paidLeaves,
      unpaidLeaves,
      overtimeHours: Math.round(overtimeHours * 100) / 100, // Round to 2 decimal places
      attendancePercentage
    };
  };

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchMonthlySummary({
          selectedDate: selectedDate
        });
        
        if (response.data.success) {
          setAttendanceData(response.data.data.dailyAttendance || []);
        } else {
          setError('Failed to fetch attendance data');
          setAttendanceData([]);
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedDate]);

  // Update summary data whenever attendance data changes
  useEffect(() => {
    const newSummaryData = calculateSummaryData(attendanceData);
    setSummaryData(newSummaryData);
  }, [attendanceData]);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-semibold text-gray-900 mb-2">
        Attendance Management
      </h2>
      <p className="text-gray-600 mb-8">
        View and track employee attendance records
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      {/* Monthly/Summary View */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          📊 Monthly Summary View
        </h3>
        <p className="text-gray-600 mb-6">
          Summarized data for easy payroll calculation
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Total Working Days */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdWork className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Working Days</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.totalWorkingDays}</p>
              </div>
            </div>
          </div>

          {/* Days Present */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MdCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Days Present</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.daysPresent}</p>
              </div>
            </div>
          </div>

          {/* Days Absent */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <MdCancel className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Days Absent</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.daysAbsent}</p>
              </div>
            </div>
          </div>

          {/* Paid Leaves */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MdEventAvailable className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Leaves</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.paidLeaves}</p>
              </div>
            </div>
          </div>

          {/* Unpaid Leaves */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MdEventBusy className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpaid Leaves</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.unpaidLeaves}</p>
              </div>
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MdTimer className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.overtimeHours}</p>
              </div>
            </div>
          </div>

          {/* Attendance Percentage */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MdTrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance %</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryData.attendancePercentage}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Daily Attendance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No attendance records found for the selected date
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {record.employeeName && record.employeeName[0] ? record.employeeName[0].toUpperCase() : '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.employeeName || 'Unknown Employee'}</div>
                            <div className="text-sm text-gray-500">{record.employeeId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkIn || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkOut || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'Late'
                            ? 'bg-yellow-100 text-yellow-800'
                            : record.status === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : record.status === 'Leave'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
