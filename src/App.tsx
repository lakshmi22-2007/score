import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [user, setUser] = useState<{ name: string; college: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Fetch the current round question
    fetchCurrentQuestion();

    // Set up real-time subscription for questions table
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentQuestion = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('roundno', { ascending: true });
    
    if (data && !error) {
      setQuestions(data);
    }
  };

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
        <Navbar 
          userName={user.name}
          questions={questions}
          onRefresh={fetchCurrentQuestion}
        />
        
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/admin" element={isAdmin ? <Admin user={user} /> : <Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
