import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TextChatApp from './components/TextChatApp';
import VideoChat from './components/VideoChat';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/text-chat" element={<TextChatApp />} />
          <Route path="/video-chat" element={<Layout><VideoChat /></Layout>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
