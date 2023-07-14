import "./App.css";
import Layout from "./components/Layout";
import Post from "./components/Post";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";
import { UserContextProvider } from "./components/UserContext";
import CreatePost from "./pages/CreatePost";
import IndexPage from "./pages/IndexPage";
import PostPage from "./pages/PostPage";
import EditPost from "./pages/EditPost";
axios.defaults.baseURL = "http://127.0.0.1:4000";
axios.defaults.withCredentials = true;
function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/post/:id" element={<PostPage />} />
        </Route>
      </Routes>
    </UserContextProvider>
  );
}

export default App;
