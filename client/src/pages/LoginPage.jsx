import axios from "axios";
import React, { useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const { setUserInfo } = useContext(UserContext);
  const login = async (ev) => {
    ev.preventDefault();
    if (!username || !password) {
      return toast.warn("Enter username and Password");
    }
    const { data } = await axios.post("/login", { username, password });
    if (data?.id) {
      toast.success("Logged in Successfully");
      setUserInfo(data);
      setRedirect(true);
    } else {
      toast.error(data);
    }
  };
  if (redirect) {
    return <Navigate to={"/"} />;
  }
  return (
    <form className="login" onSubmit={login}>
      <h1>Login</h1>
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
      <button>Login</button>
      <ToastContainer />
    </form>
  );
};

export default LoginPage;
