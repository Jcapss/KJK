import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../lib/auth/registerUser";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      if (!fullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!email.trim()) {
        throw new Error("Email is required.");
      }

      if (!password.trim()) {
        throw new Error("Password is required.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const result = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      setMessage(result.message);

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error: any) {
      setErrorMsg(error?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold tracking-tight">Create Account</div>
          <p className="mt-2 text-sm text-black/60">
            Register to view prices and purchase products.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {errorMsg ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-6 text-center text-sm text-black/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-black hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}