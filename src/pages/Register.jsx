import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, db } from "../services/firebase";
import Navbar from "../components/Navbar";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        name: fullName.trim(),
        email: email.trim(),
        subjects: [],
        studySessions: [],
        createdAt: new Date().toISOString(),
      });

      alert("Registration successful!");

      setFullName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="flex items-center justify-center py-20 px-4">
        <form
          onSubmit={handleRegister}
          className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-lg"
        >
          <h2 className="text-3xl font-bold text-cyan-400 mb-2 text-center">
            Register
          </h2>

          <p className="text-slate-300 text-center mb-6">
            Create your PrepPilot account
          </p>

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-cyan-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold ${
              loading
                ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            }`}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;