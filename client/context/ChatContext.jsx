import { createContext, useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]); //danh sách tin nhắn ({ _id, senderId, text, image, createdAt })
  const [users, setUsers] = useState([]); //danh sách người dùng (ví dụ: _id, fullName, profilePic)
  const [selectedUser, setSelectedUser] = useState(null); //người dùng đang được chọn để chat ({ _id, fullName, profilePic, bio })
  const [unseenMessage, setUnseenMessage] = useState({}); //số lượng tin nhắn chưa đọc từ mỗi người dùng ({ "user1_id": 2, "user2_id": 1 })

  const { axios, socket } = useContext(AuthContext);

  //function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessage(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to get messages for selected users
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to send messages for selected users (gửi tin nhắn mới đến người dùng được chọn)
  const sendMessages = async (messageData) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to subscribe to messages for selected users (lắng nghe tin nhắn mới qua socket)
  const subscribeToMessages = async (messageData) => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      //newMessage: Object chứa thông tin tin nhắn mới (ví dụ: { _id, senderId, text, receiverId, seen, createdAt })
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } 
      //Xử lý tin nhắn từ người dùng khác (không phải selectedUser). nó là tin nhắn chưa đọc từ người khác
      else {
        setUnseenMessage((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  //function to unsubscribe from messages (hủy lắng nghe sự kiện newMessage)
  const unsubscribeFromMessages = async () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages(); //Cleanup khi component unmount hoặc dependencies thay đổi
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    // setMessages,
    sendMessages,
    setSelectedUser,
    unseenMessage,
    setUnseenMessage,
    getMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
