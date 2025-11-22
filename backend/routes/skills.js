const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getDB } = require("../config/database");
const { ObjectId } = require('mongodb');

const router = express.Router();

// Sample skills data (in a real implementation, this would come from the database)
const skills = [
  { id: "1", name: "JavaScript", category: "Programming" },
  { id: "2", name: "Python", category: "Programming" },
  { id: "3", name: "React", category: "Programming" },
  { id: "4", name: "Node.js", category: "Programming" },
  { id: "5", name: "UI/UX Design", category: "Design" },
  { id: "6", name: "Figma", category: "Design" },
  { id: "7", name: "Photography", category: "Arts" },
  { id: "8", name: "Guitar", category: "Music" },
  { id: "9", name: "Spanish", category: "Languages" },
  { id: "10", name: "Cooking", category: "Life Skills" }
];

// ✅ Get all skills
router.get("/", async (req, res) => {
  try {
    // Get database connection
    const db = await getDB();
    const skillsCollection = db.collection('skills');
    
    // Get all skills from database
    const skillsList = await skillsCollection.find({}).toArray();
    
    res.json({
      success: true,
      data: skillsList
    });
  } catch (error) {
    console.error("Error getting skills:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get user skills (both offered and needed)
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get database connection
    const db = await getDB();
    const userSkillsCollection = db.collection('user_skills');
    const skillsCollection = db.collection('skills');
    
    // Get user's skills
    const userSkills = await userSkillsCollection.find({ user_id: new ObjectId(userId) }).toArray();
    
    // Enrich with skill names
    const enrichedSkills = [];
    for (const userSkill of userSkills) {
      const skill = await skillsCollection.findOne({ _id: new ObjectId(userSkill.skill_id) });
      enrichedSkills.push({
        ...userSkill,
        skill_name: skill ? skill.name : "Unknown Skill"
      });
    }
    
    res.json({
      success: true,
      data: enrichedSkills
    });
  } catch (error) {
    console.error("Error getting user skills:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Add/update user skill
router.post("/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill_id, skill_type, proficiency_level, description } = req.body;
    
    if (!skill_id || !skill_type || !['offered', 'needed'].includes(skill_type)) {
      return res.status(400).json({
        success: false,
        message: "Skill ID and valid skill type (offered/needed) are required"
      });
    }
    
    // Get database connection
    const db = await getDB();
    const userSkillsCollection = db.collection('user_skills');
    
    // Add or update user skill
    await userSkillsCollection.updateOne(
      { user_id: new ObjectId(userId), skill_id: new ObjectId(skill_id), skill_type: skill_type },
      { 
        $set: { 
          user_id: new ObjectId(userId),
          skill_id: new ObjectId(skill_id),
          skill_type: skill_type,
          proficiency_level: proficiency_level || 1,
          description: description || "",
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: "Skill added successfully"
    });
  } catch (error) {
    console.error("Error adding user skill:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Remove user skill
router.delete("/user/:skillId/:skillType", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillId, skillType } = req.params;
    
    if (!skillId || !skillType || !['offered', 'needed'].includes(skillType)) {
      return res.status(400).json({
        success: false,
        message: "Valid skill ID and skill type (offered/needed) are required"
      });
    }
    
    // Get database connection
    const db = await getDB();
    const userSkillsCollection = db.collection('user_skills');
    
    // Remove user skill
    await userSkillsCollection.deleteOne({
      user_id: new ObjectId(userId),
      skill_id: new ObjectId(skillId),
      skill_type: skillType
    });
    
    res.json({
      success: true,
      message: "Skill removed successfully"
    });
  } catch (error) {
    console.error("Error removing user skill:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;