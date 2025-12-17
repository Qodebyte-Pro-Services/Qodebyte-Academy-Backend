const { Notification, User } = require("../models");

exports.sendNotification = async ({
  student_id,
  title,
  message,
}) => {
  if (!student_id || !title || !message) {
    throw new Error("Missing notification fields");
  }

  return Notification.create({
    student_id,
    title,
    message,
    status: "unread",
  });
};

exports.getMyNotifications = async (req, res) => {
  try {
    const student_id = req.user?.user_id;

    if (!student_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notifications = await Notification.findAll({
      where: { student_id },
      include: [
         {
          model: User,
          as: "student",
          attributes: ["user_id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Notifications fetched successfully",
      total: notifications.length,
      unread: notifications.filter(n => n.status === "unread").length,
      notifications,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const { notification_id } = req.params;

    if (!student_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notification = await Notification.findOne({
      where: { notification_id, student_id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.status !== "read") {
      notification.status = "read";
      await notification.save();
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const student_id = req.user?.user_id;

    if (!student_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Notification.update(
      { status: "read" },
      { where: { student_id, status: "unread" } }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Mark all notifications error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};