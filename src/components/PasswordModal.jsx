import React, { useState, useRef, useEffect } from "react";
import {
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

// ─── Password Strength Indicator ─────────────────────────────

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return Math.min(score, 5);
  };

  const strength = getStrength(password);
  const strengthText = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-green-600",
  ];
  const width = (strength / 5) * 100;

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">Password Strength</span>
        <span className={`text-xs font-semibold ${strengthColors[strength].replace("bg-", "text-")}`}>
          {strengthText[strength]}
        </span>
      </div>
      <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${strengthColors[strength]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

// ─── Password Requirements ────────────────────────────────────

const RequirementItem = ({ met, text }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <FaCheckCircle className="text-green-500 text-[10px]" />
    ) : (
      <div className="w-2 h-2 rounded-full border border-gray-300" />
    )}
    <span className={met ? "text-gray-600" : "text-gray-400"}>{text}</span>
  </div>
);

const PasswordRequirements = ({ password }) => {
  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[a-z]/.test(password) && /[A-Z]/.test(password), text: "Uppercase & lowercase letters" },
    { met: /\d/.test(password), text: "At least one number" },
    { met: /[^a-zA-Z0-9]/.test(password), text: "At least one special character" },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {requirements.map((req, index) => (
        <RequirementItem key={index} met={req.met} text={req.text} />
      ))}
    </div>
  );
};

// ─── Main Password Modal ──────────────────────────────────────

const PasswordModal = ({
  onClose,
  onSubmit,
  title = "Set Password",
  subtitle = "Create a strong password for your account",
  email = "",
  confirmPassword = true,
  showStrength = true,
  showRequirements = true,
  isLoading = false,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const activeLoading = isLoading || submitting;

  // Safe close handler that respects active loading state
  const handleClose = () => {
    if (activeLoading) return;
    if (onClose) onClose();
  };

  // ─── Focus, Escape Key, and Body Scroll Lock Coordination ───
  useEffect(() => {
    // All fields are explicitly reset to empty on start/mount
    setPassword("");
    setConfirmPasswordValue("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    // Auto-focus input on popup open
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Close on Escape key press
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Lock background body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // ─── Validation ──────────────────────────────────────────────

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd)) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!/\d/.test(pwd)) return "Password must contain at least one number";
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // ─── Handlers ──────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeLoading) return;

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (confirmPassword && password !== confirmPasswordValue) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(password);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to set password");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  const passwordError = validatePassword(password);
  const confirmError = confirmPassword && password !== confirmPasswordValue && confirmPasswordValue.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={activeLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaLock className="text-blue-500 text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          {email && (
            <p className="text-xs text-gray-400 mt-1">
              For <span className="font-medium text-gray-600">{email}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={activeLoading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Create a strong password"
                className={`
                  w-full px-3 py-2.5 pr-12
                  border ${passwordError ? "border-red-400" : "border-gray-300"} 
                  rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  text-gray-700 placeholder-gray-400
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={activeLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
            {passwordError && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                <FaExclamationCircle className="text-[10px]" />
                {passwordError}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          {confirmPassword && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPasswordValue}
                  disabled={activeLoading}
                  onChange={(e) => {
                    setConfirmPasswordValue(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm your password"
                  className={`
                    w-full px-3 py-2.5 pr-12
                    border ${confirmError ? "border-red-400" : "border-gray-300"} 
                    rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    text-gray-700 placeholder-gray-400
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={activeLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              {confirmError && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <FaExclamationCircle className="text-[10px]" />
                  Passwords do not match
                </div>
              )}
            </div>
          )}

          {/* Password Strength */}
          {showStrength && password && <PasswordStrength password={password} />}

          {/* Password Requirements */}
          {showRequirements && password && <PasswordRequirements password={password} />}

          {/* Error Message */}
          {error && !passwordError && !confirmError && (
            <div className="text-red-500 text-sm bg-red-50/70 px-3 py-2.5 rounded-xl border border-red-100/60 flex items-center gap-2">
              <FaExclamationCircle />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={activeLoading}
            className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 pt-2"
          >
            {activeLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Set Password"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-4 text-xs text-gray-400">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default PasswordModal;