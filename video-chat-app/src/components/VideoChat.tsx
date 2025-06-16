import React, { useState } from 'react';
import VideoChatApp from './VideoChatApp';
import PermissionHandler from './PermissionHandler';

const VideoChat: React.FC = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const handlePermissionsGranted = () => {
    setPermissionsGranted(true);
  };

  return (
    <>
      {!permissionsGranted ? (
        <PermissionHandler onPermissionsGranted={handlePermissionsGranted} />
      ) : (
        <VideoChatApp />
      )}
    </>
  );
};

export default VideoChat; 