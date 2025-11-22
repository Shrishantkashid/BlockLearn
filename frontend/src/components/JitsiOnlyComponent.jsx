import React from 'react';
import JitsiMeetComponent from './JitsiMeetComponent';

const JitsiOnlyComponent = ({ roomName, userName, userType, onMeetingEnd }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <JitsiMeetComponent 
        roomName={roomName}
        userName={userName}
        userType={userType}
        onMeetingEnd={onMeetingEnd}
      />
    </div>
  );
};

export default JitsiOnlyComponent;