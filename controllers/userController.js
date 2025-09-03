import userModel from "../models/userModel";
export const getuserdata = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    return res.json({
      success: true,
      message: "User data fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user data error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
