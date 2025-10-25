import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEmployeeById, updateEmployee } from "../api";

export default function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    hireDate: "",
    department: "",
    position: "",
    salary: "",
    employmentType: "full_time",
    status: "active",
    bankAccount: "",
    taxId: "",
    emergencyContact: "",
  });

  const requiredFields = [
    "employeeId",
    "firstName",
    "lastName",
    "email",
    "hireDate",
    "department",
    "position",
    "salary",
  ];

  // Load employee data on component mount
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchEmployeeById(id);
        
        if (response.data.success) {
          const employee = response.data.data.employee;
          setForm({
            employeeId: employee.employeeId || "",
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            email: employee.email || "",
            phone: employee.phone || "",
            address: employee.address || "",
            dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : "",
            hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : "",
            department: employee.department || "",
            position: employee.position || "",
            salary: employee.salary || "",
            employmentType: employee.employmentType || "full_time",
            status: employee.status || "active",
            bankAccount: employee.bankAccount || "",
            taxId: employee.taxId || "",
            emergencyContact: employee.emergencyContact || "",
          });
        } else {
          throw new Error("Failed to fetch employee");
        }
      } catch (err) {
        console.error("Error loading employee:", err);
        setError(err?.response?.data?.message || err?.message || "Failed to load employee");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    for (const field of requiredFields) {
      if (!String(form[field] || "").trim()) {
        return `${field} is required`;
      }
    }
    if (!form.employeeId.trim()) return "Employee ID is required";
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.hireDate.trim()) return "Hire date is required";
    if (!form.department.trim()) return "Department is required";
    if (!form.position.trim()) return "Position is required";
    if (!form.salary || form.salary === "") return "Salary is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Invalid email";
    }
    if (form.employeeId.length > 20) return "employeeId max length is 20";
    if (form.firstName.length > 50) return "firstName max length is 50";
    if (form.lastName.length > 50) return "lastName max length is 50";
    if (form.email.length > 100) return "email max length is 100";
    if (form.department.length > 50) return "department max length is 50";
    if (form.position.length > 50) return "position max length is 50";
    if (form.phone && form.phone.length > 20) return "phone max length is 20";
    if (form.taxId && form.taxId.length > 20) return "taxId max length is 20";
    if (form.bankAccount && form.bankAccount.length > 50) return "bankAccount max length is 50";
    const salaryNumber = Number(form.salary);
    if (!Number.isFinite(salaryNumber) || salaryNumber <= 0) return "Salary must be a positive number";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
        dateOfBirth: form.dateOfBirth || null,
        hireDate: form.hireDate,
      };
      console.log("Updating employee with payload:", payload);
      await updateEmployee(id, payload);
      
      // Close the window and refresh the parent window
      window.close();
      if (window.opener) {
        window.opener.location.reload();
      }
    } catch (err) {
      console.error("Error updating employee:", err);
      console.error("Error response:", err?.response?.data);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to update employee";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center">Loading employee data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Employee</h1>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Employee ID *</label>
          <input name="employeeId" value={form.employeeId} onChange={handleChange} maxLength={20} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} maxLength={100} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} maxLength={50} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} maxLength={50} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} maxLength={20} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={2} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hire Date *</label>
          <input type="date" name="hireDate" value={form.hireDate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Department *</label>
          <input name="department" value={form.department} onChange={handleChange} maxLength={50} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Position *</label>
          <input name="position" value={form.position} onChange={handleChange} maxLength={50} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salary (LKR) *</label>
          <input type="number" step="0.01" name="salary" value={form.salary} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Employment Type</label>
          <select name="employmentType" value={form.employmentType} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bank Account</label>
          <input name="bankAccount" value={form.bankAccount} onChange={handleChange} maxLength={50} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax ID</label>
          <input name="taxId" value={form.taxId} onChange={handleChange} maxLength={20} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Emergency Contact</label>
          <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} maxLength={100} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50">
            {submitting ? "Updating..." : "Update Employee"}
          </button>
          <button type="button" onClick={() => window.close()} className="border px-4 py-2 rounded">Close</button>
        </div>
      </form>
    </div>
  );
}
