

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { getGithubLoginUrl, loginWithGoogle } from "./api/authApi";
import { loginUser } from "./api/userApi";
import { FaGithub } from "react-icons/fa";

// Constants
const POPUP_CONFIG = {
  width: 500,
  height: 650,
  resizable: "yes",
  scrollbars: "yes",
};

const INITIAL_FORM_STATE = {
  email: "",
  password: "",
};

// Helper functions
export const getPopupPosition = () => ({
  left: window.screenX + (window.outerWidth - POPUP_CONFIG.width) / 2,
  top: window.screenY + (window.outerHeight - POPUP_CONFIG.height) / 2,
});

export const buildPopupUrl = () => {
  const position = getPopupPosition();
  return `${getGithubLoginUrl()}?width=${POPUP_CONFIG.width}&height=${POPUP_CONFIG.height}&left=${position.left}&top=${position.top}`;
};

// GitHub Login Handler
export const handleGithubLogin = () => {
  const popup = window.open(
    getGithubLoginUrl(),
    "github-login",
    `width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height},left=${getPopupPosition().left},top=${getPopupPosition().top},resizable=${POPUP_CONFIG.resizable},scrollbars=${POPUP_CONFIG.scrollbars}`
  );

  if (!popup) {
    alert("Please allow popups for this website.");
  }
};

// Sub-components
const FormField = ({ id, name, type, label, placeholder, value, onChange, error }) => (
  <div className="relative mb-4">
    <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-white">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      required
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`
        w-full px-3 py-2.5 
        border ${error ? "border-red-500" : "border-gray-300 dark:border-slate-700"} 
        rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-all duration-200
        bg-white dark:bg-white text-black placeholder-gray-400 dark:placeholder-slate-500 text-md
      `}
    />
    {error && (
      <span className="absolute top-full left-0 text-red-500 text-xs mt-1">
        {error}
      </span>
    )}
  </div>
);

const Divider = ({ text }) => (
  <div className="relative text-center my-5">
    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-px bg-gray-300 dark:bg-slate-700"></div>
    <span className="relative bg-white dark:bg-slate-800 px-4 text-sm text-gray-500 dark:text-slate-400">{text}</span>
  </div>
);

export const SocialLoginButton = ({ icon: Icon, text, onClick, bgColor, hoverColor }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      py-2.5 px-4 
      flex justify-center items-center 
      ${bgColor} hover:${hoverColor}
      text-white w-full 
      transition duration-200 ease-in-out 
      text-center text-base font-medium 
      shadow-md hover:shadow-lg
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      rounded-lg border dark:border-white
    `}
  >
    <Icon className="mr-4 text-lg" />
    {text}
  </button>
);

// Main Component
const Login = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // GitHub OAuth listener
  useEffect(() => {
    const handleGithubAuth = async (event) => {
      if (event.data?.type !== "GITHUB_AUTH") return;

      if (event.data.status === "success") {
        navigate("/");
      } else if (event.data.status === "failed") {
        setServerError("GitHub authentication failed. Please try again.");
      }
    };

    window.addEventListener("message", handleGithubAuth);
    return () => window.removeEventListener("message", handleGithubAuth);
  }, [navigate]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (serverError) setServerError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError("");

    try {
      const data = await loginUser(formData);
      if (data.error) {
        setServerError(data.error);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setServerError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      if (!data.error) {
        navigate("/");
      } else {
        setServerError(data.error);
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setServerError("Google login failed. Please try again.");
    }
  };

  const hasError = Boolean(serverError);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border dark:border-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Sign in to continue to your account
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={hasError}
          />

          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={hasError}
          />

          {serverError && (
            <div className="text-red-500 dark:text-red-450 text-sm text-center bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-2 rounded-lg">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-2.5 px-4 
              bg-blue-500 hover:bg-blue-600 
              text-white font-medium 
              rounded-lg 
              transition duration-200 
              ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link 
            to="/register" 
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition duration-200"
          >
            Create one now
          </Link>
        </p>

        <Divider text="or continue with" />

        {/* Social Login */}
        <div className="space-y-3">
          
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setServerError("Google login failed. Please try again.")}
              theme="filled_blue"
              text="continue_with"
              shape="rectangular"
              
              useOneTap
            />
          

          <SocialLoginButton
            icon={FaGithub}
            text="Sign in with GitHub"
            onClick={handleGithubLogin}
            bgColor="bg-gray-800"
            hoverColor="bg-gray-900"
          />
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;