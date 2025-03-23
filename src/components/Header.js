import React from 'react'
import { Link } from 'react-router-dom'
import "./Header.css"

const Header = ({active, setActive, user,handleLogout}) => {

    const userId = user?.uid;
    
    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="navbar-brand" onClick={() => setActive("home")}>
                    UJVAL.TECH
                </Link>

                <div className="nav-links">
                    <Link
                        to="/about"
                        className={`nav-link ${active === "about" ? "active" : ""}`}
                        onClick={() => setActive("about")}
                    >
                        About
                    </Link>

                    {userId ? (
                        <>
                            <Link
                                to="/create"
                                className={`nav-link ${active === "create" ? "active" : ""}`}
                                onClick={() => setActive("create")}
                            >
                                Create
                            </Link>
                            <Link
                                to="/auth"
                                className="nav-link"
                                onClick={handleLogout}
                            >
                                Logout
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className={`nav-link ${active === "login" ? "active" : ""}`}
                            onClick={() => setActive("login")}
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Header