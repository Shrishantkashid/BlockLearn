const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ✅ Blockchain skill verification endpoint (for testing)
router.post("/verify", async (req, res) => {
  try {
    const { sessionId, skillId, userId } = req.body;

    if (!sessionId || !skillId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Session ID, skill ID, and user ID are required"
      });
    }

    // For testing purposes, simulate blockchain verification
    // In a real implementation, this would interact with smart contracts

    // Simulate blockchain transaction
    const transactionHash = "0x" + Math.random().toString(16).substr(2, 64);
    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
    const gasUsed = Math.floor(Math.random() * 100000) + 50000;

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 100));

    res.status(201).json({
      success: true,
      message: "Skill completion verified on blockchain",
      data: {
        sessionId: sessionId,
        skillId: skillId,
        userId: userId,
        transactionHash: transactionHash,
        blockNumber: blockNumber,
        gasUsed: gasUsed,
        verifiedAt: new Date().toISOString(),
        status: "verified",
        certificateUrl: `https://blockchain.blocklearn.com/certificate/${transactionHash}`
      }
    });

  } catch (error) {
    console.error("Error verifying skill on blockchain:", error);
    res.status(500).json({
      success: false,
      message: "Blockchain verification failed"
    });
  }
});

// ✅ Get blockchain verification status
router.get("/verify/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // For testing purposes, return mock verification data
    res.json({
      success: true,
      data: {
        sessionId: sessionId,
        status: "verified",
        verifiedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        certificateUrl: `https://blockchain.blocklearn.com/certificate/${sessionId}`
      }
    });

  } catch (error) {
    console.error("Error getting blockchain verification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get verification status"
    });
  }
});

module.exports = router;
