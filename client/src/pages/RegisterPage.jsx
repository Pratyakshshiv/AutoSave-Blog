import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";
const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const register = async (ev) => {
    ev.preventDefault();
    if (!username || !password) {
      return toast.warn("Enter username and Password");
    }
    const { data } = await axios.post("/register", {
      username,
      password,
    });
    console.log(data);
    if (data?.username) {
      toast.success("Registration Successfull");
      setRedirect(true);
    } else if (data === "Username Already Present") {
      toast.error("Username already present");
    }
  };
  if (redirect) {
    return <Navigate to={"/login"} />;
  }
  return (
    <form className="register" onSubmit={register}>
      <h1>Register</h1>
      <input
        type="text"
        placeholder="username"
        value={username}
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
      />
      <button>Register</button>
      <ToastContainer />
    </form>
  );
};

export default RegisterPage;
