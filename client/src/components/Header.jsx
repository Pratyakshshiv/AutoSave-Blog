import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

const Header = () => {
  const { setUserInfo, userInfo } = useContext(UserContext);
  //Get User Logged in status
  useEffect(() => {
    axios.get("/profile").then((response) => {
      setUserInfo(response.data);
    });
  }, []);
  // Handle Logout
  const logout = () => {
    axios.post("/logout");
    setUserInfo(null);
  };

  const username = userInfo?.username;
  return (
    <header>
      <Link to="/" className="logo">
        MyBlog
      </Link>
      <nav>
        {/* If logged in show logout and create post Button */}
        {username && (
          <>
            <Link to="/create">Create new post</Link>
            <a onClick={logout}>Logout ({username})</a>
          </>
        )}
        {/* If not logged in show Login and Register Button */}
        {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
