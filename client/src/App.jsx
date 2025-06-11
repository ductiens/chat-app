import { Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const App = () => {
  const { authUser } = useContext(AuthContext); //sử dụng authUser để quyết định điều hướng (routing) giữa các trang

  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain">
      <Toaster />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;
