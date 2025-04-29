import { useState } from "react";
import axios from "axios";

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/admin/signup", formData);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 space-y-4 bg-white shadow-md rounded-md">
        <h2 className="text-xl font-bold text-center">Admin Signup</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 mt-1 border rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 mt-1 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
        </form>
        {message && <p className="text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default AdminSignup;
