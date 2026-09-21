import { useState, useEffect } from "react";
import { Links, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import './AdminLogin.css'
import React from 'react'
import { LogInIcon, LogOutIcon } from "lucide-react";
import { Link } from "react-router-dom";

const AdminLogin = () => {
    const navigate = useNavigate();
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState("");
      const [loading, setLoading] = useState(false);
    
      // Already logged in? Skip the login page.
      useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) navigate("/admin/home", { replace: true });
        });
      }, [navigate]);
    
      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
    
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
    
        if (error) {
          setError("Incorrect email or password. Try again.");
          return;
        }
        navigate("/admin/home", { replace: true });
      };
  return (
    <div className='admin-login'>
      <form onSubmit={handleLogin} action="" className="login">
        <div className="admin-header">
            <h1>Admin Login</h1>
        </div>

        <div className="login-form">
          <div className="login-email">
            <h2>Email</h2>
          <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

          </div>

          
        <div className="login-password">
          <h2>Password</h2>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        </div>


        <div className="bttn">
          <button type="submit" disabled={loading}>
          <LogInIcon /><p>{loading ? "Logging in..." : "Log in"}</p>
        </button>

        <Link to="/" className="link">
        <button>
          <LogOutIcon/><p>Back to Home</p>
        </button>
        </Link>
        </div>

        

        
         
        

        {error && <p className="login-error">{error}</p>}

        </div>
      </form>
    </div>
  )
}

export default AdminLogin
