import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUser, logoutUserById } from "./api/userApi";
import { axiosWithCreds } from "./api/axiosInstances";
import {
  FaUserPlus,
  FaTrash,
  FaUndo,
  FaEye,
  FaLock,
  FaUserShield,
  FaArrowLeft,
  FaUserCircle,
  FaEnvelope,
  FaKey,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserSlash,
  FaCircle,
  FaDatabase,
  FaUsers,
  FaShieldAlt,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deleted: 0,
    loggedIn: 0,
  });
  const navigate = useNavigate();

  // Create User modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  async function loadDashboard() {
    try {
      let currentUser = await fetchUser();
      setUserId(currentUser.id);
      setUserName(currentUser.name);
      setUserEmail(currentUser.email);
      setUserRole(currentUser.role);

      if (currentUser.role === "User" || currentUser.role === "guest") {
        navigate("/");
        return;
      }

      await fetchUsersList(currentUser.role);
    } catch (err) {
      console.error("Dashboard initialization failed:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        navigate("/");
      }
    }
  }

  async function fetchUsersList(role) {
    try {
      let response;
      if (role === "Admin") {
        response = await axiosWithCreds.get("/admin/users");
      } else if (role === "Manager") {
        response = await axiosWithCreds.get("/manager/users");
      } else {
        return;
      }
      const userData = response.data;
      setUsers(userData);

      // Calculate stats
      const total = userData.length;
      const active = userData.filter((u) => !u.deleted).length;
      const deleted = userData.filter((u) => u.deleted).length;
      const loggedIn = userData.filter((u) => u.isLoggedIn).length;
      setStats({ total, active, deleted, loggedIn });
    } catch (err) {
      console.error("Fetching users list failed:", err);
      setErrorMessage("Failed to load users list.");
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((user) => !user.deleted);
    } else if (statusFilter === "deleted") {
      filtered = filtered.filter((user) => user.deleted);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleLogoutUser = async (user) => {
    const confirmed = confirm(`You are about to logout ${user.email}`);
    if (!confirmed) return;
    try {
      await logoutUserById(user.id);
      await loadDashboard();
      setSuccessMessage(`Logged out user ${user.name} successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Logout user error:", err);
      setErrorMessage("Failed to logout user.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleSoftDelete = async (user) => {
    const confirmed = confirm(
      `Are you sure you want to soft delete ${user.name}?`,
    );
    if (!confirmed) return;
    try {
      const endpoint =
        userRole === "Admin"
          ? `/admin/users/${user.id}/soft-delete`
          : `/manager/users/${user.id}/soft-delete`;
      await axiosWithCreds.post(endpoint);
      await loadDashboard();
      setSuccessMessage(`Soft-deleted ${user.name}.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Soft delete error:", err);
      setErrorMessage(
        err.response?.data?.error || "Failed to soft delete user.",
      );
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleRevoke = async (user) => {
    try {
      const endpoint =
        userRole === "Admin"
          ? `/admin/users/${user.id}/revoke`
          : `/manager/users/${user.id}/revoke`;
      await axiosWithCreds.post(endpoint);
      await loadDashboard();
      setSuccessMessage(`Restored ${user.name}'s account.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Restore error:", err);
      setErrorMessage("Failed to restore user.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleHardDelete = async (user) => {
    const confirmed = confirm(
      `WARNING: This will PERMANENTLY delete ${user.name} and ALL their files from the system. This cannot be undone. Proceed?`,
    );
    if (!confirmed) return;
    try {
      await axiosWithCreds.delete(`/admin/users/${user.id}`);
      await loadDashboard();
      setSuccessMessage(`Hard deleted ${user.name} permanently.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Hard delete error:", err);
      setErrorMessage("Failed to hard delete user.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setErrorMessage("");
    try {
      const endpoint =
        userRole === "Admin" ? "/admin/createUser" : "/manager/createUser";
      await axiosWithCreds.post(endpoint, userForm);
      setSuccessMessage("User created successfully!");
      setUserForm({ name: "", email: "", password: "", role: "User" });
      setShowCreateUserModal(false);
      await loadDashboard();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Create user error:", err);
      setErrorMessage(err.response?.data?.error || "Failed to create user.");
    } finally {
      setCreateUserLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const configs = {
      Admin: {
        color: "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/30",
        icon: FaUserShield,
      },
      Manager: {
        color: "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30",
        icon: FaShieldAlt,
      },
      User: {
        color: "bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30",
        icon: FaUserCircle,
      },
    };
    const config = configs[role] || configs.User;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {role}
      </span>
    );
  };

  const getStatusBadge = (deleted) => {
    if (deleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30">
          <FaUserSlash className="w-3 h-3" />
          Soft Deleted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30">
        <FaUserCheck className="w-3 h-3" />
        Active
      </span>
    );
  };

  const getSessionBadge = (isLoggedIn) => {
    if (isLoggedIn) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30">
          <FaCircle className="w-2 h-2 animate-pulse text-emerald-400" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 border border-gray-500/30">
        <FaCircle className="w-2 h-2 text-gray-400" />
        Offline
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60"
        >
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-all hover:gap-3 gap-2 mb-2 group"
            >
              <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Files</span>
            </Link>
            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
              User Administration
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-sm font-medium">
                <FaUserCircle className="w-4 h-4" />
                {userName}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {userRole}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {stats.total} users total
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateUserModal(true)}
            className="mt-4 lg:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-600/30 transition-all duration-200"
          >
            <FaUserPlus className="w-4 h-4" />
            Create User
          </motion.button>
        </motion.div>

        {/* Stats Cards with hover effects */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          {[
            {
              label: "Total Users",
              value: stats.total,
              icon: FaUsers,
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-950/30",
              iconBg: "bg-blue-100 dark:bg-blue-900/50",
            },
            {
              label: "Active Users",
              value: stats.active,
              icon: FaUserCheck,
              color: "from-emerald-500 to-emerald-600",
              bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
              iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            },
            {
              label: "Deleted Users",
              value: stats.deleted,
              icon: FaUserSlash,
              color: "from-red-500 to-red-600",
              bgColor: "bg-red-50 dark:bg-red-950/30",
              iconBg: "bg-red-100 dark:bg-red-900/50",
            },
            {
              label: "Logged In",
              value: stats.loggedIn,
              icon: FaCircle,
              color: "from-violet-500 to-violet-600",
              bgColor: "bg-violet-50 dark:bg-violet-950/30",
              iconBg: "bg-violet-100 dark:bg-violet-900/50",
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                className={`${stat.bgColor} backdrop-blur-lg rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1 group-hover:scale-110 transition-transform duration-300 origin-left">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg shadow-${stat.color.split("-")[1]}-500/20`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-300"
          >
            <FaFilter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <FaChevronUp className="w-3 h-3" />
            ) : (
              <FaChevronDown className="w-3 h-3" />
            )}
          </button>
        </motion.div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="deleted">Soft Deleted</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence>
          {(successMessage || errorMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              {successMessage && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm">
                  <FaCheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
              {errorMessage && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm font-medium shadow-sm">
                  <FaExclamationTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
                  {[
                    { key: "name", label: "User" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role" },
                    { key: "deleted", label: "Status" },
                    { key: "isLoggedIn", label: "Session" },
                    { key: "actions", label: "Actions", sortable: false },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className={`p-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
                        col.sortable !== false && "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      }`}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable !== false && sortField === col.key && (
                          <span className="text-blue-500">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500"
                      >
                        <FaDatabase className="w-16 h-16 opacity-30" />
                        <p className="text-lg font-semibold">No users found</p>
                        <p className="text-sm">
                          {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Start by creating a user account"}
                        </p>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${
                        user.deleted ? "bg-red-50/30 dark:bg-red-950/10" : ""
                      } ${user.id === userId ? "ring-2 ring-blue-500/20" : ""}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              user.role === "Admin"
                                ? "bg-gradient-to-br from-purple-500/30 to-purple-600/30 text-purple-400"
                                : user.role === "Manager"
                                  ? "bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-400"
                                  : "bg-gradient-to-br from-gray-500/30 to-gray-600/30 text-gray-400"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {user.name}
                            </span>
                            {user.id === userId && (
                              <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <FaEnvelope className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="font-mono text-xs">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4">{getStatusBadge(user.deleted)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getSessionBadge(user.isLoggedIn)}
                          {user.isLoggedIn && user.id !== userId && (
                            <button
                              onClick={() => handleLogoutUser(user)}
                              className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors underline-offset-2 hover:underline"
                            >
                              Logout
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Admin View Files Option */}
                          {userRole === "Admin" && user.rootDirId && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                navigate(`/directory/${user.rootDirId}`)
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-xs font-semibold transition-all"
                              title="View Files"
                            >
                              <FaEye className="w-3 h-3" /> View
                            </motion.button>
                          )}

                          {/* Soft Delete / Revoke */}
                          {user.deleted ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRevoke(user)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs font-semibold transition-all"
                              title="Restore"
                            >
                              <FaUndo className="w-3 h-3" /> Restore
                            </motion.button>
                          ) : (
                            user.email !== userEmail && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSoftDelete(user)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-xs font-semibold transition-all"
                                title="Soft Delete"
                              >
                                <FaLock className="w-3 h-3" /> Soft Delete
                              </motion.button>
                            )
                          )}

                          {/* Hard Delete (Admin only) */}
                          {userRole === "Admin" && user.email !== userEmail && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleHardDelete(user)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-semibold transition-all"
                              title="Hard Delete permanently"
                            >
                              <FaTrash className="w-3 h-3" /> Delete
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer with count */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active: {stats.active}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Deleted: {stats.deleted}
                </span>
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setShowCreateUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <FaUserPlus className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Create User Account
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <FaUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={userForm.name}
                      onChange={(e) =>
                        setUserForm({ ...userForm, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={4}
                      placeholder="Minimum 4 characters"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {userRole === "Admin" && (
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      User Role
                    </label>
                    <div className="relative">
                      <FaUserShield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <select
                        value={userForm.role}
                        onChange={(e) =>
                          setUserForm({ ...userForm, role: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all appearance-none"
                      >
                        <option value="User">User</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createUserLoading}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createUserLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create User"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}