import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user (lấy danh sách users để hiển thị trong sidebar của chat)
// Trả về danh sách users và số lượng tin nhắn chưa đọc của mỗi user
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id; //Lấy _id của người dùng đang đăng nhập
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password"); //Tìm tất cả users trong database TRỪ user đang đăng nhập

    // Count number of messages not seen (số lượng tin nhắn chưa đọc)
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      //Người gửi là user đó (senderId)
      //Người nhận là user đang đăng nhập (receiverId)
      const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    //Chúng ta đang đếm tin nhắn chưa đọc cho nhiều user, Các thao tác đếm có thể chạy song song, Chúng ta cần đợi tất cả việc đếm hoàn tất trước khi trả về response
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    //Lấy tất cả tin nhắn giữa 2 user
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    //Đánh dấu tất cả tin nhắn như đã đọc
    await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// api to mark message as seen using message id (đánh dấu một tin nhắn cụ thể là đã đọc dựa trên ID của tin nhắn)
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// send message to selected user (gửi tin nhắn)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadedResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Emit the new message to the receiver's socket
    const receiverSocketId = userSocketMap[receiverId]; //Lấy socketId của người nhận từ userSocketMap dựa trên receiverId

    //Kiểm tra xem người nhận có đang online (có socketId) không. (nếu không online, receiverSocketId là undefined, và tin nhắn chỉ lưu trong database)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
