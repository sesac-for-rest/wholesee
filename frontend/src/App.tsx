import { useState, useEffect } from 'react';
import { OnboardingPage } from './pages/OnboardingPage';
import { ChatPage } from './pages/ChatPage';
import { hasSeenOnboarding, getAnonymousId } from './utils/auth';
import './index.css';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding());

  useEffect(() => {
    // AnonymousID 초기화
    getAnonymousId();
  }, []);

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />;
  }

  return <ChatPage />;
}

export default App;
