import './App.css';
import Home from './pages/Home';
import About from './pages/About';
import AddEditBlog from './pages/AddEditBlog';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';
import {ToastContainer} from "react-toastify"
import "./style.scss"
import "./media-query.css"
import "react-toastify/dist/ReactToastify.css"; 

// import {Routes,Route} from "react-router-dom"
import {Routes, Route, useNavigate, Navigate} from "react-router-dom"
import Header from './components/Header';
import { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import AccountSettings from './pages/AccountSettings';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { canManageBlogs, isAdmin } from './utils/adminCheck';
import { setupAdminUser } from './utils/setupAdmin';

// Wrap ToastContainer with theme context
const ThemedToastContainer = () => {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position='top-center'
      theme={theme === 'dark' ? 'dark' : 'light'}
      toastStyle={{
        backgroundColor: 'var(--toast-bg)',
        color: 'var(--toast-text)'
      }}
    />
  );
};

function App() {
  const [active,setActive] = useState("home")
  const [user,setUser] = useState(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{
    auth.onAuthStateChanged(async (authUser)=>{
      if(authUser){
        setUser(authUser)
        const adminStatus = canManageBlogs(authUser)
        setIsAdminUser(adminStatus)
        
        // If the user is an admin, run setup to ensure the user document exists
        if (isAdmin(authUser)) {
          console.log("Admin user detected, setting up admin user document");
          try {
            const result = await setupAdminUser();
            if (result.success) {
              console.log("Admin setup completed successfully");
            } else {
              console.error("Admin setup failed:", result.error);
            }
          } catch (error) {
            console.error("Error during admin setup:", error);
          }
        }
      }else{
        setUser(null)
        setIsAdminUser(false)
      }
    })
  },[])

  const handleLogout =()=>{
    signOut(auth).then(()=>{
      setUser(null)
      setIsAdminUser(false)
      setActive("login")
      navigate("/auth")
    })
  }

  return (
    <ThemeProvider>
      <div className="App">
        <Header active={active} setActive={setActive} user={user} isAdmin={isAdminUser} handleLogout={handleLogout}/>
        <ThemedToastContainer />
        <Routes>
          <Route path="/" element={<Home setActive={setActive} user={user} isAdmin={isAdminUser}/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/detail/:id" element={<Detail setActive={setActive} user={user}/>}/>
          <Route path="/create" element={isAdminUser ? <AddEditBlog user={user}/> : <Navigate to="/"/> }/>
          <Route path="/auth" element={<Auth setActive={setActive} setUser={setUser}/>}/>
          <Route path="/account" element={user ? <AccountSettings user={user} setUser={setUser} /> : <Navigate to="/auth"/>}/>
          <Route path="/update/:id" element={isAdminUser ? <AddEditBlog setActive={setActive} user={user}/> : <Navigate to="/"/> }/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
