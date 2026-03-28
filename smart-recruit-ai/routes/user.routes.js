const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const auth = require("../middleware/auth.middleware");


router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password") // Password security ke liye hide rakhenge
      .populate("savedJobs"); // 🔥 Saved jobs ki details bhi sath me fetch karenge
    
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/update", auth, async (req, res) => {
  try {
    const { name, bio, location, phone, skills, profilePicture } = req.body;
    
    // Sirf wahi fields update karenge jo user ne bheji hain
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { name, bio, location, phone, skills, profilePicture } 
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully ✨", user: updatedUser });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});


router.patch("/save/:jobId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const jobId = req.params.jobId;

    if (!user) return res.status(404).json({ message: "User not found" });

    
    const isSaved = user.savedJobs.includes(jobId);

    if (isSaved) {
      
      user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
      await user.save();
      return res.json({ message: "Job removed from saved list ❌", saved: false });
    } else {
      
      user.savedJobs.push(jobId);
      await user.save();
      return res.json({ message: "Job saved successfully ⭐", saved: true });
    }
  } catch (err) {
    console.error("Save Job Error:", err);
    res.status(500).json({ message: "Failed to process save request" });
  }
});

module.exports = router;