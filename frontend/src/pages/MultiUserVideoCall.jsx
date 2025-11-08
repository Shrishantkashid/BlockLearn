import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoCall from "../components/VideoCall";

function MultiUserVideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userType, setUserType] = useState("participant");
  const [showSidebar, setShowSidebar] = useState(true);

  const handleEndCall = () => {
    navigate("/");
  };

  return (
    <div className="h-screen">
      <VideoCall
        code={roomId || "default-room"}
        userType={userType}
        onEndCall={handleEndCall}
        showSidebar={showSidebar}
        showInterviewDetails={true}
      />
    </div>
  );
}

export default MultiUserVideoCall;