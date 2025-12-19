import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SignIn } from './components/SignIn';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';

const ADMIN_USERS = ['ADMINDEv', 'ADMINLAKSHMi', 'ADMINcit'];

function App() {
  const [user, setUser] = useState<{ name: string; college: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSignIn = (name: string, college: string) => {
    const userData = { name, college };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAdmin = user && ADMIN_USERS.includes(user.name);

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Navbar userName={user.name} />
        
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/admin" element={isAdmin ? <Admin user={user} /> : <Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
