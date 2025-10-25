import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  // Get the current authentication state
  const { authData } = useContext(AuthContext);

  // If authData is null (no token/not logged in), redirect to the login page
  if (!authData) {
    // replace=true prevents the user from navigating back to the protected page 
    // with the browser's back button after being redirected.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children (the Dashboard)
  return children;
}