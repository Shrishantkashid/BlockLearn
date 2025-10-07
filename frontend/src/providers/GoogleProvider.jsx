import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleProvider = ({ children }) => {
  // Use the actual Google Client ID directly
  const clientId = '600190604921-1ecm9djtasjj0fvagqen4j7s4jai24a7.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleProvider;
