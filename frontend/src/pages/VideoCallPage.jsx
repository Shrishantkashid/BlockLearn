import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import JitsiOnlyComponent from "../components/JitsiOnlyComponent";

function VideoCallPage() {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const handleMeetingEnd = () => {
    // Redirect to dashboard or home page when meeting ends
    navigate("/dashboard");
  };

  return (
    <JitsiOnlyComponent 
      roomName={roomName}
      userName="Participant"
      userType="participant"
      onMeetingEnd={handleMeetingEnd}
    />
  );
}

export default VideoCallPage;