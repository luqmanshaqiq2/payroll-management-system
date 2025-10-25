import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuthData } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!username.trim()) {
      setError("Username or email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      // Determine if input is email or username
      const isEmail = username.includes('@');
      const requestData = isEmail 
        ? { email: username, password }
        : { username: username, password };

      const res = await axios.post("http://localhost:3000/api/v1/admin/login", requestData);

      // backend returns { success, message, data: { admin, token } }
      const payload = res.data.data;
      setAuthData(payload);                   // store admin + token object
      localStorage.setItem("token", payload.token);
      navigate("/dashboard");
    } catch (err) {
      console.error('[Login] error response ->', err.response?.data || err.message);
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        setError(validationErrors);
      } else {
        setError(err.response?.data?.message || "Login failed. Try again.");
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-8">
        <div className="text-center">
          <img 
            src="/img/payroll-banner.jpg" 
            alt="Payroll Management System" 
            className="max-w-md w-full h-auto rounded-lg shadow-lg"
          />
          <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Payroll Management</h1>
          <p className="text-gray-600 text-lg">Streamline your payroll processes</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/img/paypoint-logo.png" 
              alt="PayPoint Logo" 
              className="h-20 w-auto mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Username or Email</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </form>

          <p className="text-gray-600 text-sm text-center mt-6">
            New here?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Register as new admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
