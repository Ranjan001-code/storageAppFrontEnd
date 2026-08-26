import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FaGithub } from "react-icons/fa";
import {
  getGithubLoginUrl,
  loginWithGoogle,
  sendOtp,
  verifyOtp,
} from "./api/authApi";
import { registerUser } from "./api/userApi";
import { handleGithubLogin, SocialLoginButton } from "./Login";

// ─── Constants ───────────────────────────────────────────────
const OTP_LENGTH = 4;
const OTP_COUNTDOWN_SECONDS = 60;

// ─── Sub-components ──────────────────────────────────────────

const FormField = ({ id, name, type, label, placeholder, value, onChange, error, rightElement }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
      {label}
    </label>
    <div className="relative">
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
          border ${error ? "border-red-400" : "border-gray-300 dark:border-slate-600"} 
          rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500
        `}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && (
      <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <i className="fas fa-exclamation-circle text-[10px]" />
        {error}
      </span>
    )}
  </div>
);

const OTPInput = ({ value, onChange, onVerify, isVerifying, isVerified, error }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Verification Code</label>
    <div className="relative">
      <input
        type="text"
        maxLength={OTP_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
        placeholder="Enter 4-digit code"
        disabled={isVerified}
        className={`
          w-full px-3 py-2.5 pr-28
          border ${error ? "border-red-400" : isVerified ? "border-green-400" : "border-gray-300 dark:border-slate-600"} 
          rounded-xl
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500
          otp-input tracking-[4px] font-medium
          ${isVerified ? "bg-green-50/50 dark:bg-green-950/20" : ""}
        `}
      />
      <button
        type="button"
        onClick={onVerify}
        disabled={isVerifying || isVerified || value.length < OTP_LENGTH}
        className={`
          absolute right-2 top-1/2 -translate-y-1/2 
          px-3 py-1.5 text-xs font-medium rounded-lg
          transition-all duration-200
          ${isVerified 
            ? "bg-green-500 text-white cursor-default" 
            : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md"
          }
          ${(isVerifying || value.length < OTP_LENGTH) && !isVerified ? "opacity-50 cursor-not-allowed" : ""}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
      >
        {isVerifying ? (
          <><i className="fas fa-spinner fa-spin mr-1" /> Verifying</>
        ) : isVerified ? (
          <><i className="fas fa-check-circle mr-1" /> Verified</>
        ) : (
          "Verify"
        )}
      </button>
    </div>
    {error && (
      <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <i className="fas fa-exclamation-circle text-[10px]" />
        {error}
      </span>
    )}
  </div>
);

const Divider = ({ text }) => (
  <div className="relative text-center my-6">
    <div className="divider-line absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-200 dark:bg-slate-700" />
    <span className="relative bg-white dark:bg-slate-800 px-4 text-sm text-gray-400 dark:text-slate-500 font-light">{text}</span>
  </div>
);

// ─── Main Component ──────────────────────────────────────────

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();

  // ─── Effects ──────────────────────────────────────────────────

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  // ─── Handlers ──────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset OTP state when email changes
    if (name === "email") {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setOtpError("");
      setCountdown(0);
    }
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter your email first." }));
      return;
    }

    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }

    try {
      setIsSending(true);
      setOtpError("");
      await sendOtp(formData.email);
      setOtpSent(true);
      setCountdown(OTP_COUNTDOWN_SECONDS);
    } catch (err) {
      setOtpError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < OTP_LENGTH) {
      setOtpError(`Please enter a ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    try {
      setIsVerifying(true);
      setOtpError("");
      await verifyOtp(formData.email, otp);
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.response?.data?.error || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Valid email is required.";
    if (!formData.password.trim()) errors.password = "Password is required.";
    else if (formData.password.length < 4) errors.password = "Password must be at least 4 characters.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!otpVerified) {
      setOtpError("Please verify your email with OTP before registering.");
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");
      await registerUser({ ...formData, otp });
      setIsSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setServerError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      if (!data.error) navigate("/");
    } catch (err) {
      console.error("Google login failed:", err);
      setServerError("Google login failed. Please try again.");
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-9 border border-black dark:border-white register-card">

        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create Account</h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">Join us and get started</p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="name"
            name="name"
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`
                  w-full px-3 py-2.5 pr-24
                  border ${fieldErrors.email ? "border-red-400" : "border-gray-300 dark:border-slate-600"} 
                  rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500
                `}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSending || countdown > 0 || otpVerified}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 
                  px-3 py-1.5 text-xs font-medium rounded-lg
                  transition-all duration-200
                  ${otpVerified 
                    ? "bg-green-500 text-white cursor-default" 
                    : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md"
                  }
                  ${(isSending || countdown > 0) && !otpVerified ? "opacity-50 cursor-not-allowed" : ""}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
              >
                {otpVerified ? (
                  <><i className="fas fa-check-circle mr-1" /> Verified</>
                ) : isSending ? (
                  <><i className="fas fa-spinner fa-spin mr-1" /> Sending</>
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
            {fieldErrors.email && (
              <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <i className="fas fa-exclamation-circle text-[10px]" />
                {fieldErrors.email}
              </span>
            )}
          </div>

          {otpSent && !otpVerified && (
            <OTPInput
              value={otp}
              onChange={setOtp}
              onVerify={handleVerifyOtp}
              isVerifying={isVerifying}
              isVerified={otpVerified}
              error={otpError}
            />
          )}

          {otpVerified && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50/70 dark:bg-green-950/20 px-3 py-2 rounded-xl border border-green-100/60 dark:border-green-900/50">
              <i className="fas fa-check-circle text-green-500" />
              <span>Email verified successfully</span>
            </div>
          )}

          {otpError && !otpVerified && (
            <div className="text-red-500 dark:text-red-400 text-xs bg-red-50/70 dark:bg-red-950/20 px-3 py-2 rounded-xl border border-red-100/60 dark:border-red-900/50 flex items-center gap-2">
              <i className="fas fa-exclamation-circle" />
              {otpError}
            </div>
          )}

          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />

          {serverError && (
            <div className="text-red-500 dark:text-red-400 text-sm bg-red-50/70 dark:bg-red-950/20 px-3 py-2.5 rounded-xl border border-red-100/60 dark:border-red-900/50 flex items-center gap-2">
              <i className="fas fa-exclamation-circle" />
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={!otpVerified || isSubmitting || isSuccess}
            className={`
              w-full py-2.5 px-4 
              bg-blue-500 hover:bg-blue-600 
              text-white font-medium 
              rounded-xl 
              transition-all duration-200 
              hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              active:scale-[0.98]
              ${(!otpVerified || isSubmitting || isSuccess) ? "opacity-60 cursor-not-allowed" : ""}
            `}
          >
            {isSubmitting ? (
              <><i className="fas fa-spinner fa-spin mr-2" /> Creating account...</>
            ) : isSuccess ? (
              <><i className="fas fa-check-circle mr-2" /> Registration Successful!</>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-5 text-sm text-gray-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition duration-200">
            Sign in
          </Link>
        </p>

        <Divider text="or continue with" />

        {/* Social Login */}
        <div className="space-y-3.5">
          <div className="google-btn-wrapper w-full rounded-xl overflow-hidden shadow-sm hover:shadow transition-all duration-200">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setServerError("Google login failed. Please try again.")}
              theme="filled_blue"
              text="continue_with"
              shape="rectangular"
              useOneTap
            />
          </div>

          <SocialLoginButton
            icon={FaGithub}
            text="Sign in with GitHub"
            onClick={handleGithubLogin}
            bgColor="bg-gray-800"
            hoverColor="bg-gray-900"
          />
        </div>

        {/* Footer */}
        <p className="text-center mt-7 text-xs text-gray-400/80 dark:text-slate-500 tracking-wide">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 underline-offset-2 hover:underline">Terms</a>{" "}
          and{" "}
          <a href="#" className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 underline-offset-2 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Register;