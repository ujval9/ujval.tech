import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { auth } from '../firebase'
import './Auth.css'

const Auth = ({setActive, setUser}) => {
  const navigate = useNavigate()
  const initialState = {
    email: "",
    password: "",
    confirmPassword: "",
  }

  const [state, setState] = useState(initialState)
  const [signUp, setSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const {email, password, confirmPassword} = state

  const handleChange = (e) => {
    setState({...state, [e.target.name]: e.target.value})
  }

  const validateForm = () => {
    if (!email || !password) {
      toast.error("Email and password are required")
      return false
    }
    if (signUp && password !== confirmPassword) {
      toast.error("Passwords don't match")
      return false
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return false
    }
    return true
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (!signUp) {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        setUser(user)
        toast.success("Logged in successfully!")
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: email.split('@')[0] })
        toast.success("Account created successfully!")
      }
      setActive("home")
      navigate("/")
    } catch (error) {
      let errorMessage = "An error occurred"
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Email is already registered"
          break
        case 'auth/invalid-email':
          errorMessage = "Invalid email address"
          break
        case 'auth/wrong-password':
          errorMessage = "Incorrect password"
          break
        case 'auth/user-not-found':
          errorMessage = "User not found"
          break
        default:
          errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {!signUp ? "Sign in to your account" : "Create a new account"}
        </h2>

        <form className="auth-form" onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {signUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="auth-button"
          >
            {isLoading && (
              <svg className="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30 14" />
              </svg>
            )}
            {isLoading ? 'Processing...' : (!signUp ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div className="auth-divider">
          {!signUp ? "New to our platform?" : "Already have an account?"}
        </div>

        <div className="auth-switch">
          <button
            onClick={() => setSignUp(!signUp)}
            className="switch-button"
          >
            {!signUp ? "Create a new account" : "Sign in to existing account"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth