import { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import OnboardingPage from './pages/OnboardingPage';
import DigestPage from './pages/DigestPage';

function App() {
  const [profile, setProfile, removeProfile] = useLocalStorage('user_profile', null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  const handleOnboardingComplete = (newProfile) => {
    // 역할 바뀌면 캐시 초기화
    try {
      const existing = JSON.parse(localStorage.getItem('user_profile'));
      if (existing && existing.role !== newProfile.role) {
        localStorage.removeItem('today_digest');
      }
    } catch (e) {}
    setProfile(newProfile);
  };

  const handleResetProfile = () => {
    localStorage.removeItem('today_digest');
    removeProfile();
  };

  if (!profile) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <DigestPage
      profile={profile}
      onResetProfile={handleResetProfile}
    />
  );
}

export default App;