import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { getErrorMessage } from '../services/api'

const Login = () => {
    const { login, register } = useAppContext()

    const [state, setState] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return

        setSubmitting(true)
        try {
            const data = state === "login"
                ? await login({ email, password })
                : await register({ name, email, password })

            if (data.success) {
                toast.success(state === "login" ? "Welcome back!" : "Account created")
                // The context stores the token and loads the user/chats.
            } else {
                toast.error(data.message || "Authentication failed")
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Authentication failed"))
        } finally {
            setSubmitting(false)
        }
    }

  return (
    <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] text-gray-500 rounded-lg shadow-xl border border-gray-200 bg-white">
            <p className="text-2xl font-medium m-auto">
                <span className="text-purple-700">User</span> {state === "login" ? "Login" : "Sign Up"}
            </p>
            {state === "register" && (
                <div className="w-full">
                    <p>Name</p>
                    <input onChange={(e) => setName(e.target.value)} value={name} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700" type="text" required />
                </div>
            )}
            <div className="w-full ">
                <p>Email</p>
                <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700" type="email" required />
            </div>
            <div className="w-full ">
                <p>Password</p>
                <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700" type="password" required minLength={6} />
            </div>
            {state === "register" ? (
                <p>
                    Already have account? <span onClick={() => setState("login")} className="text-purple-700 cursor-pointer">click here</span>
                </p>
            ) : (
                <p>
                    Create an account? <span onClick={() => setState("register")} className="text-purple-700 cursor-pointer">click here</span>
                </p>
            )}
            <button type='submit' disabled={submitting} className="bg-purple-700 hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-white w-full py-2 rounded-md cursor-pointer">
                {submitting
                    ? (state === "register" ? "Creating account..." : "Logging in...")
                    : (state === "register" ? "Create Account" : "Login")}
            </button>
        </form>
    </div>
  )
}

export default Login
