import { useState } from "react";
import "./LoginModal.css";

function LoginModal({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[isLoading,setIsLoading]=useState(false);
  const [error, setError] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        onLoginSuccess(data.token, data.role); // 👈 send role to parent
      }
      setIsLoading(false);
    } catch (err) {
      setError("Something went wrong. Try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button disabled={isLoading} type="submit" className={`${isLoading ? "opacity-50 cursor-not-allowed " : ""}`}>{isLoading ? "Logging in..." : "Login"}</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
