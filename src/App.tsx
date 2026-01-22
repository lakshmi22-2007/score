import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SignIn } from './components/SignIn';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { supabase } from './lib/supabase';

const ADMIN_USERS = ['ADMINDEv', 'ADMINLAKSHMi', 'ADMINcit'];

interface Question {
  id: string;
  roundno: string;
  htmlcode: string;
  csscode: string;
}

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState<{ name: string; college: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const fetchCurrentQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('roundno', { ascending: true });
      
      if (error) {
        console.error('Error fetching questions:', error);
        return;
      }
      
      if (data) {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleSignIn = (name: string, college: string) => {
    const userData = { name, college };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch the current round question
    fetchCurrentQuestion();

    // Set up real-time subscription for questions table
    const questionsChannel = supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'questions'
        },
        (payload) => {
          console.log('Question updated:', payload);
          // Refetch the latest question when table changes
          fetchCurrentQuestion();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(questionsChannel);
    };
  }, []);

  const isAdmin = user && ADMIN_USERS.includes(user.name);

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAD2' }}>
      <Navbar 
        userName={user.name}
        questions={questions}
        onRefresh={fetchCurrentQuestion}
        onLogout={handleLogout}
      />
      
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/admin" element={isAdmin ? <Admin user={user} /> : <Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
