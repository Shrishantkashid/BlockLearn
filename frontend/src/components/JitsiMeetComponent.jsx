import React, { useEffect, useRef } from 'react';

const JitsiMeetComponent = ({ roomName, userName, userType, onMeetingEnd }) => {
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    // Check if JitsiMeetExternalAPI is already loaded
    if (typeof window.JitsiMeetExternalAPI !== 'undefined') {
      initializeJitsi();
    } else {
      // Load Jitsi script if not already loaded
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initializeJitsi;
      script.onerror = () => {
        console.error('Failed to load Jitsi script');
        // Handle error - maybe show a fallback UI
      };
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup: dispose of the Jitsi API instance
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, userName, userType]);

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: userName || 'Participant'
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableModeratorIndicator: true,
        startScreenSharing: false,
        enableEmailInStats: false,
        prejoinPageEnabled: true,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'BlockLearn',
        BRAND_WATERMARK_LINK: '',
        CLOSE_PAGE_GUEST_HINT: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
        DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        DISABLE_VIDEO_BACKGROUND: true,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 
          'raisehand', 'videoquality', 'filmstrip', 'tileview'
        ],
      }
    };

    // Create the Jitsi API instance
    apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    // Add event listeners
    apiRef.current.on('videoConferenceJoined', handleVideoConferenceJoined);
    apiRef.current.on('videoConferenceLeft', handleVideoConferenceLeft);
    apiRef.current.on('participantJoined', handleParticipantJoined);
    apiRef.current.on('participantLeft', handleParticipantLeft);
    apiRef.current.on('readyToClose', handleReadyToClose);
  };

  const handleVideoConferenceJoined = (participant) => {
    console.log('Video conference joined:', participant);
    // You can add custom logic here when the user joins the conference
  };

  const handleVideoConferenceLeft = () => {
    console.log('Video conference left');
    // You can add custom logic here when the user leaves the conference
  };

  const handleParticipantJoined = (participant) => {
    console.log('Participant joined:', participant);
    // You can add custom logic here when a participant joins
  };

  const handleParticipantLeft = (participant) => {
    console.log('Participant left:', participant);
    // You can add custom logic here when a participant leaves
  };

  const handleReadyToClose = () => {
    console.log('Jitsi meeting is ready to close');
    // Notify parent component that the meeting has ended
    if (onMeetingEnd) {
      onMeetingEnd();
    }
  };

  return (
    <div 
      ref={jitsiContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '500px'
      }} 
    />
  );
};

export default JitsiMeetComponent;