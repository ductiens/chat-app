import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token")); //Lưu token xác thực từ localStorage
  const [authUser, setAuthUser] = useState(null); // Lưu thông tin người dùng đã đăng nhập (VD: { _id, fullName, email, bio })
  const [onlineUsers, setOnlineUsers] = useState([]); // Danh sách người dùng đang online
  const [socket, setSocket] = useState(null); //Kết nối socket

  // Check if user is authenticated and if so, set the user data and connect to socket
  //checkAuth để kiểm tra xem người dùng đã xác thực hay chưa và thiết lập dữ liệu người dùng cùng kết nối socket nếu thành công
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    // state: Chuỗi xác định loại yêu cầu ("login" hoặc "signup").
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData); //(ví dụ: { _id, fullName, email, bio }).
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Logout function to handle user logout and socket disconnection
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    socket.disconnect();
  };

  // Update profile function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Connect socket function to handle socket connection and online users update
  //hàm connectSocket để thiết lập kết nối WebSocket và cập nhật danh sách người dùng online.
  const connectSocket = (userData) => {
    //userData: Thông tin người dùng (ví dụ: { _id, fullName }) để gửi qua socket
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      // await axios.post(backendUrl + "/api/cart/add", { itemId, size }, { headers: { token } });
      axios.defaults.headers.common["token"] = token; //header có tên token với giá trị là data.token (token xác thực) vào tất cả các yêu cầu HTTP gửi đi bởi axios
    }
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    // token,
    // setToken,
    // setAuthUser,
    // setOnlineUsers,
    // setSocket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
