// App.js
import {React,useEffect} from 'react';
import {
  Route,
  Routes,
  useNavigate
} from 'react-router-dom'
import Signup from './Signup';
import Login from './Login';
import Home from './Home';
import ProtectedRoute from './ProtectedRoute';

function App() {

  const navigate=useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/'); // Redirect to home page if token exists
    }
  }, [navigate]);

  return (
    <>
    <Routes>
            <Route  path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route element={<ProtectedRoute/>} >
              <Route path='/' element={<Home/>}/>
            </Route>
    </Routes>
    </>
  );
}

export default App;
