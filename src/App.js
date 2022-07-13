
import './App.css';
import Home from './pages/Home';
import About from './pages/About';
import AddEditBlog from './pages/AddEditBlog';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';
import {toast, ToastContainer} from "react-toastify"
import "./style.scss"
import "./media-query.css"
import "react-toastify/dist/ReactToastify.css"; 

// import {Routes,Route} from "react-router-dom"
import {Routes, Route, useNavigate, Navigate} from "react-router-dom"
import Header from './components/Header';
import { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

function App() {
  const [active,setActive] = useState("home")
const [user,setUser] = useState(null)
const navigate = useNavigate()

useEffect(()=>{
auth.onAuthStateChanged((authUser)=>{
  if(authUser){
    setUser(authUser)
  }else{
    setUser(null)
  }
})
},[])

const handleLogout =()=>{
  signOut(auth).then(()=>{
    setUser(null)
    setActive("login")
    navigate("/auth")
  })
}

  return (
    <div className="App">
  
    <Header active={active} setActive={setActive} user={user} handleLogout = {handleLogout}/>

    <ToastContainer position='top-center'/>


     <Routes>
      <Route path="/" element={<Home setActive={setActive} user={user}/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/detail/:id" element={<Detail setActive={setActive}/>}/>
      <Route path="/create" element={user?.uid ? <AddEditBlog user={user}/> : <Navigate to="/"/> }/>
      <Route path="/auth" element={<Auth setActive = {setActive} setUser={setUser}/>}/>
      <Route path="/update/:id" element={user?.uid ? <AddEditBlog setActive = {setActive} user={user}/> : <Navigate to="/"/> }/>

      <Route path="*" element={<NotFound/>}/>
     </Routes>
 
    </div>
  );
}

export default App;
