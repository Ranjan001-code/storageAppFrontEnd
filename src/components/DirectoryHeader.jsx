import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUser,
  logoutUser,
  logoutAllSessions,
  setUserPassword,
} from "../api/userApi";
import {
  FaFolderPlus,
  FaUpload,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaCrown,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
  FaFolderOpen,
  FaCloudUploadAlt,
  FaUserCog,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import PasswordModal from "./PasswordModal"; // Fixed import path (capitalized)
import { useTheme } from "../context/ThemeContext";

// ─── Sub-components ──────────────────────────────────────────

const ActionButton = ({ icon: Icon, title, onClick, disabled, tooltip }) => (
  <div className="relative group">
    <button
      className={`
        relative p-2.5 rounded-xl
        text-blue-500 hover:text-blue-700 
        transition-all duration-300 ease-out
        hover:bg-blue-50/80
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:text-blue-300 disabled:cursor-not-allowed disabled:hover:bg-transparent
        ${disabled ? "opacity-50" : "hover:scale-105 active:scale-95"}
      `}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
    >
      <Icon className="text-xl" />
      {!disabled && (
        <>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 group-hover:w-4/5 rounded-full" />
          <span className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-300" />
        </>
      )}
    </button>
    {tooltip && !disabled && (
      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[11px] font-medium text-white bg-gray-900/90 px-2.5 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border border-gray-700/50">
        {tooltip}
      </span>
    )}
  </div>
);

const UserAvatar = ({ picture, name, onClick, isMenuOpen }) => (
  <button
    className={`
      relative group p-0.5 rounded-full
      transition-all duration-300 ease-out
      hover:scale-105 active:scale-95
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${isMenuOpen ? "ring-2 ring-blue-500 ring-offset-2" : ""}
    `}
    onClick={onClick}
  >
    <div className="relative">
      {picture ? (
        <img
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:shadow-md transition-all duration-300"
          src={picture}
          alt={name}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-sm group-hover:shadow-md transition-all duration-300">
          <FaUser className="text-blue-600 text-lg" />
        </div>
      )}
      {/* Status indicator */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
    </div>
    <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 transition-all duration-300" />
  </button>
);

const StorageBar = ({ used, total }) => {
  const percentage = Math.min((used / total) * 100, 100);
  const isNearFull = percentage > 80;
  const isFull = percentage > 95;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">Storage</span>
        <span className="text-xs font-semibold text-gray-700">
          {used.toFixed(2)}{" "}
          <span className="text-gray-400 font-normal">
            / {total.toFixed(2)} GB
          </span>
        </span>
      </div>
      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out
            ${isFull ? "bg-red-500" : isNearFull ? "bg-orange-400" : "bg-gradient-to-r from-blue-400 to-blue-600"}
          `}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 5 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer" />
          )}
        </div>
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute inset-y-0 right-0 bg-gray-200/30 rounded-full"
            style={{ width: `${100 - percentage}%` }}
          />
        )}
      </div>
      {isNearFull && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-orange-500">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          {isFull ? "Storage almost full" : "Storage running low"}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  badge,
  shortcut,
}) => {
  const baseClasses = `
    flex items-center gap-3 px-4 py-2.5
    text-sm font-medium
    transition-all duration-200
    hover:bg-gray-50 dark:hover:bg-slate-700
    cursor-pointer
    relative
    ${variant === "danger" ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-gray-700 dark:text-slate-200"}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      <Icon
        className={`text-base ${variant === "danger" ? "text-red-500" : "text-blue-500"}`}
      />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {shortcut && (
        <span className="text-[10px] font-mono text-gray-400">{shortcut}</span>
      )}
      {variant !== "danger" && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  );
};

const MenuDivider = () => (
  <div className="relative my-1">
    <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
  </div>
);

// ─── Main Component ──────────────────────────────────────────

function DirectoryHeader({
  directoryName,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
}) {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userPicture, setUserPicture] = useState("");
  const [userRole, setUserRole] = useState("guest");
  const [maxStorageInBytes, setMaxStorageInBytes] = useState(1073741824);
  const [usedStorageInBytes, setUsedStorageInBytes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const userMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const navigate = useNavigate();

  const usedGB = usedStorageInBytes / 1024 ** 3;
  const totalGB = maxStorageInBytes / 1024 ** 3;

  // ─── Effects ──────────────────────────────────────────────────

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await fetchUser();
        setUserName(user.name || "User");
        setUserEmail(user.email);
        setUserPicture(user.picture || "");
        setUserRole(user.role || "user");
        setMaxStorageInBytes(user.maxStorageInBytes || 1073741824);
        setUsedStorageInBytes(user.usedStorageInBytes || 0);
        setLoggedIn(true);

        // Check if user needs to set a password
        if (user.password === false || user.requiresPasswordSetup) {
          setShowPasswordModal(true);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        setLoggedIn(false);
        setUserName("Guest User");
        setUserEmail("guest@example.com");
        setUserRole("guest");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        !menuButtonRef.current?.contains(e.target)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setLoggedIn(false);
      setUserName("Guest User");
      setUserEmail("guest@example.com");
      setUserRole("guest");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllSessions();
      setLoggedIn(false);
      setUserName("Guest User");
      setUserEmail("guest@example.com");
      setUserRole("guest");
      navigate("/login");
    } catch (err) {
      console.error("Logout all error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
    setShowUserMenu(false);
  };

  const handlePasswordSubmit = async (password) => {
    setIsPasswordLoading(true);
    try {
      // Call your API to set the password
      await setUserPassword(userEmail, password);
      console.log("Password set successfully for:", userEmail);
      setShowPasswordModal(false);
    } catch (err) {
      console.error("Failed to set password:", err);
      throw err;
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  return (
    <>
      <header className="relative z-40 flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-slate-700/60 mb-6 shadow-sm">
        {/* Directory Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <FaFolderOpen className="text-blue-600 text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
                {directoryName}
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">
                {disabled ? "View only" : "Active directory"}
              </p>
            </div>
          </div>
          {disabled && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-slate-600/50">
              read-only
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={FaFolderPlus}
            title="Create Folder"
            tooltip="New folder"
            onClick={onCreateFolderClick}
            disabled={disabled}
          />
          <ActionButton
            icon={FaUpload}
            title="Upload Files"
            tooltip="Upload"
            onClick={onUploadFilesClick}
            disabled={disabled}
          />
          <ActionButton
            icon={theme === "light" ? FaMoon : FaSun}
            title="Toggle Theme"
            tooltip={theme === "light" ? "Dark Mode" : "Light Mode"}
            onClick={toggleTheme}
          />
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />

          <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-2" />

          {/* User Menu */}
          <div className="relative ml-1">
            <div ref={menuButtonRef} className="flex items-center gap-0.5">
              {isLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
              ) : (
                <UserAvatar
                  picture={userPicture}
                  name={userName}
                  onClick={handleUserIconClick}
                  isMenuOpen={showUserMenu}
                />
              )}
              <button
                onClick={handleUserIconClick}
                className={`
                  p-1 rounded-md
                  text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200
                  transition-all duration-200
                  hover:bg-gray-100 dark:hover:bg-slate-700
                  ${showUserMenu ? "text-blue-600" : ""}
                `}
              >
                {showUserMenu ? (
                  <FaChevronUp className="text-xs" />
                ) : (
                  <FaChevronDown className="text-xs" />
                )}
              </button>
            </div>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                ref={userMenuRef}
                className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-slide-in origin-top-right z-50"
              >
                {loggedIn ? (
                  <>
                    {/* User Info */}
                    <div className="px-4 py-4 bg-gradient-to-br from-gray-50/80 to-white dark:from-slate-800/80 dark:to-slate-800 border-b border-gray-100/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-3">
                        {userPicture ? (
                          <img
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20 shadow-sm"
                            src={userPicture}
                            alt={userName}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center border-2 border-blue-500/20 shadow-sm">
                            <FaUserCircle className="text-blue-600 dark:text-blue-400 text-3xl" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">
                            {userName}
                          </div>
                          {userRole && (
                            <span className="text-xs text-gray-500 dark:text-slate-400 capitalize block">
                              {userRole}
                            </span>
                          )}
                          <div className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            {userEmail}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate("/profile");
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
                        >
                          <FaUserCog className="text-sm" />
                        </button>
                      </div>

                      {/* Storage */}
                      <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-slate-700/60">
                        <StorageBar used={usedGB} total={totalGB} />
                      </div>
                    </div>

                    <div className="py-1 bg-white dark:bg-slate-800">
                      <MenuItem
                        icon={FaCrown}
                        label="Upgrade Storage"
                        badge="Pro"
                        onClick={() => {
                          navigate("/plans");
                          setShowUserMenu(false);
                        }}
                      />
                      {(userRole === "Admin" || userRole === "Manager") && (
                        <MenuItem
                          icon={FaUserCog}
                          label="Manage Users"
                          onClick={() => {
                            navigate("/users");
                            setShowUserMenu(false);
                          }}
                        />
                      )}
                      <MenuDivider />
                      <MenuItem
                        icon={FaSignOutAlt}
                        label="Sign Out"
                        onClick={handleLogout}
                        shortcut="⌘Q"
                      />
                      <MenuItem
                        icon={FaSignOutAlt}
                        label="Sign Out All Devices"
                        onClick={handleLogoutAll}
                        variant="danger"
                      />
                    </div>
                  </>
                ) : (
                  <div className="py-3 px-2 bg-white dark:bg-slate-800">
                    <div className="text-center mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mx-auto mb-2">
                        <FaUser className="text-blue-600 dark:text-blue-400 text-2xl" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Not signed in</p>
                    </div>
                    <MenuItem
                      icon={FaSignInAlt}
                      label="Sign In"
                      onClick={handleLogin}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global styles for animations */}
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-slide-in {
            animation: slideIn 0.2s ease-out;
          }
          .shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </header>

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          isLoading={isPasswordLoading}
          title="Set Your Password"
          subtitle="Create a strong password for your account"
          email={userEmail}
          confirmPassword={true}
          showStrength={true}
          showRequirements={true}
        />
      )}
    </>
  );
}

export default DirectoryHeader;
