import React, { useState } from "react";
import "./Login.css";
import Admin from './Images/Admin.svg'
import { useNavigate } from "react-router-dom";
import Header from '../Home/Header/Header';

export default function AdminLogin() {
  const [User, setUser] = useState("");
  const [Password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr('');
    setErrors({});

    // Basic validation
    if (!User.trim()) {
      setErrors({ User: "Username is required" });
      setIsLoading(false);
      return;
    }
    if (!Password.trim()) {
      setErrors({ password: "Password is required" });
      setIsLoading(false);
      return;
    }

    const data = { username: User, password: Password };

    try {
      const response = await fetch(`https://shiksharthee.onrender.com/api/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        setErr(responseData.message || "Login failed");
        setIsLoading(false);
        return;
      }

      if (responseData.data && responseData.data.admin) {
        const userid = responseData.data.admin._id;
        if (!userid) {
          setErr("Invalid user ID received");
          setIsLoading(false);
          return;
        }

        // Store token and navigate
        localStorage.setItem("Accesstoken", responseData.data.Accesstoken);
        navigate(`/admin/${userid}`);
      } else {
        setErr("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErr("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header/>
      <section className="main">
        <div className="img-3">
          <img src={Admin} width={500} alt="" />
        </div>
        <div className="container py-5">
          <div className="para1">
            <h2>WELCOME BACK!</h2>
          </div>

          <div className="para">
            <h5>Please Log Into Your Account.</h5>
          </div>

          <div className="form">
            <form onSubmit={handleSubmit}>
              <div className="input-1">
                <input
                  type="text"
                  placeholder="User name"
                  className="input-0"
                  value={User}
                  onChange={(e) => setUser(e.target.value)}
                />
                {errors.User && (
                  <div className="error-message">{errors.User}</div>
                )}
              </div>
              <div className="input-2">
                <input
                  type="password"
                  placeholder="Password"
                  className="input-0"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
              </div>

              <div className="btns">
                <button 
                  type="submit" 
                  className="btns-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </button>
              </div>
              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}
              {err && (
                <div className="error-message">{err}</div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
