import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed");
    }
  };

  return (
    <nav className="bg-slate-800 text-white px-6 md:px-8 py-4 shadow-lg sticky top-0 z-50">
      <div className="flex justify-between items-center">
        <Link
          to={user ? "/dashboard" : "/login"}
          onClick={closeMenu}
          className="text-2xl font-bold text-cyan-400"
        >
          PrepPilot
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-3xl text-cyan-400 focus:outline-none"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className="hidden md:flex gap-6 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-cyan-400">
                Dashboard
              </Link>

              <Link to="/subjects" className="hover:text-cyan-400">
                Subjects
              </Link>

              <Link to="/study-sessions" className="hover:text-cyan-400">
                Study Sessions
              </Link>

              <Link to="/smart-planner" className="hover:text-cyan-400">
                Smart Planner
              </Link>

              <Link to="/achievements" className="hover:text-cyan-400">
                Achievements
              </Link>

              <Link to="/profile" className="hover:text-cyan-400">
                 Profile
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-cyan-400">
                Login
              </Link>

              <Link
                to="/register"
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-2 rounded-lg font-semibold"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                Dashboard
              </Link>

              <Link
                to="/subjects"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                Subjects
              </Link>

              <Link
                to="/study-sessions"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                Study Sessions
              </Link>

              <Link
                to="/smart-planner"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                Smart Planner
              </Link>

              <Link
                to="/achievements"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                 Achievements
              </Link>

              <Link
                to="/profile"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                 Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold mt-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className="block hover:text-cyan-400"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="block bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-2 rounded-lg font-semibold text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;