import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth } from "../services/firebase";
import Navbar from "../components/Navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Logged in user:", userCredential.user);

      alert("Login successful!");

      setEmail("");
      setPassword("");
      setShowPassword(false);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="flex items-center justify-center py-20 px-4">
        <form
          onSubmit={handleLogin}
          className="bg-slate-800 p-8 rounded-2xl w-full max-w-md"
        >
          <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
            Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-slate-700 outline-none"
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700 outline-none"
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
            className="w-full bg-cyan-400 text-slate-950 py-3 rounded-lg font-semibold hover:bg-cyan-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;