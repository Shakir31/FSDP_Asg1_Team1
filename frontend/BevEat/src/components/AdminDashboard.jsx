import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  TrendingUp,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  X,
  Plus,
  Eye,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../AdminDashboard.css";
import { toast } from "react-toastify";

const API_URL = "http://localhost:3000";

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStallModal, setShowStallModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditStallModal, setShowEditStallModal] = useState(false);
  const [editUserData, setEditUserData] = useState({});
  const [editStallData, setEditStallData] = useState({});
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentStallPage, setCurrentStallPage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStalls: 0,
    stallOwners: 0,
  });

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Please log in to continue");
      navigate("/login");
      return;
    }

    if (activeTab === "overview") {
      fetchBothForStats();
    } else if (activeTab === "users") {
      if (users.length === 0) {
        fetchUsers();
      }
    } else if (activeTab === "stalls") {
      if (stalls.length === 0) {
        fetchStalls();
      }
    }
  }, [activeTab, navigate]);

  const fetchBothForStats = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const [usersResponse, stallsResponse] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/admin/stalls`, { headers: getAuthHeaders() }),
      ]);

      if (
        usersResponse.status === 403 ||
        usersResponse.status === 401 ||
        stallsResponse.status === 403 ||
        stallsResponse.status === 401
      ) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!usersResponse.ok) throw new Error("Failed to fetch users");
      if (!stallsResponse.ok) throw new Error("Failed to fetch stalls");

      const usersData = await usersResponse.json();
      const stallsData = await stallsResponse.json();

      setUsers(usersData);
      setStalls(stallsData);
      calculateStats(usersData, stallsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      calculateStats(data, stalls);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStalls = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stalls`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch stalls");
      const data = await response.json();
      setStalls(data);
      calculateStats(users, data);
    } catch (error) {
      console.error("Error fetching stalls:", error);
      toast.error("Failed to fetch stalls");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData, stallData) => {
    const stallOwners = userData.filter((u) => u.role === "stall_owner").length;
    setStats({
      totalUsers: userData.length,
      totalStalls: stallData.length,
      stallOwners,
    });
  };

  const viewUserDetails = async (userId) => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setSelectedUser(data);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const viewStallDetails = async (stallId) => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch stall details");
      const data = await response.json();
      setSelectedStall(data);
      setShowStallModal(true);
    } catch (error) {
      console.error("Error fetching stall details:", error);
      toast.error("Failed to fetch stall details");
    }
  };

  const openEditUserModal = async (userId) => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setEditUserData({
        userid: data.userid,
        name: data.name,
        email: data.email,
        role: data.role,
        coins: data.coins,
        password: "",
      });
      setShowEditUserModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const openEditStallModal = async (stallId) => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch stall details");
      const data = await response.json();
      setEditStallData({
        stallid: data.stallid,
        stallname: data.stallname,
        description: data.description || "",
        category: data.category,
        stall_image: data.stall_image || "",
        hawker_centre_id: data.hawker_centre_id || "",
        owner_id: data.owner_id || "",
      });
      setShowEditStallModal(true);
    } catch (error) {
      console.error("Error fetching stall details:", error);
      toast.error("Failed to fetch stall details");
    }
  };

  const handleUpdateUser = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const updatePayload = {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        coins: parseInt(editUserData.coins, 10),
      };

      if (editUserData.password && editUserData.password.trim() !== "") {
        updatePayload.password = editUserData.password;
      }

      const response = await fetch(
        `${API_URL}/admin/users/${editUserData.userid}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        },
      );

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setShowEditUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user: " + error.message);
    }
  };

  const handleUpdateStall = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const updatePayload = {
        stallname: editStallData.stallname,
        description: editStallData.description,
        category: editStallData.category,
        stall_image: editStallData.stall_image || null,
        hawker_centre_id: editStallData.hawker_centre_id || null,
        owner_id: editStallData.owner_id
          ? parseInt(editStallData.owner_id, 10)
          : null,
      };

      const response = await fetch(
        `${API_URL}/admin/stalls/${editStallData.stallid}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        },
      );

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update stall");
      }

      toast.success("Stall updated successfully");
      setShowEditStallModal(false);
      fetchStalls();
    } catch (error) {
      console.error("Error updating stall:", error);
      toast.error("Failed to update stall: " + error.message);
    }
  };

  const handleAddStall = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Validate required fields
      if (!newStallData.stallname || !newStallData.category) {
        toast.error("Stall name and category are required");
        return;
      }

      let stallImageUrl = newStallData.stall_image;

      // Upload image if file is selected
      if (stallImageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("stallImage", stallImageFile);

        try {
          const uploadResponse = await fetch(`${API_URL}/stalls/upload-image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.status === 403 || uploadResponse.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            toast.error("Session expired. Please log in again.");
            navigate("/login");
            return;
          }

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          const uploadData = await uploadResponse.json();
          stallImageUrl = uploadData.imageUrl;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error("Failed to upload image");
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const addPayload = {
        stallname: newStallData.stallname,
        description: newStallData.description || null,
        category: newStallData.category,
        stall_image: stallImageUrl || null,
        hawker_centre_id: newStallData.hawker_centre_id || null,
        owner_id: newStallData.owner_id
          ? parseInt(newStallData.owner_id, 10)
          : null,
      };

      const response = await fetch(`${API_URL}/stalls`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(addPayload),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add stall");
      }

      toast.success("Stall added successfully");
      setShowAddStallModal(false);
      // Reset form
      setNewStallData({
        stallname: "",
        description: "",
        category: "",
        stall_image: "",
        hawker_centre_id: "",
        owner_id: "",
      });
      setStallImageFile(null);
      fetchStalls();
    } catch (error) {
      console.error("Error adding stall:", error);
      toast.error("Failed to add stall: " + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }

    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to delete user");
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const deleteStall = async (stallId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this stall? This action cannot be undone.",
      )
    ) {
      return;
    }

    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to delete stall");
      toast.success("Stall deleted successfully");
      fetchStalls();
    } catch (error) {
      console.error("Error deleting stall:", error);
      toast.error("Failed to delete stall: " + error.message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredStalls = stalls.filter(
    (stall) =>
      stall.stallname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalStallPages = Math.ceil(filteredStalls.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * itemsPerPage,
    currentUserPage * itemsPerPage,
  );

  const paginatedStalls = filteredStalls.slice(
    (currentStallPage - 1) * itemsPerPage,
    currentStallPage * itemsPerPage,
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentUserPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    setCurrentStallPage(1);
  }, [searchTerm, activeTab]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="header-left">
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Manage users, stalls, and system settings
              </p>
            </div>
          </div>
          <div className="admin-badge">
            <AlertCircle className="badge-icon" />
            <span className="badge-text">Admin Mode</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs-container">
        <div className="admin-tabs">
          {["overview", "users", "stalls"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? "tab-active" : ""}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        {activeTab === "overview" && (
          <div className="stats-grid">
            <StatCard
              icon={<Users className="stat-icon" />}
              title="Total Users"
              value={stats.totalUsers}
              color="blue"
            />
            <StatCard
              icon={<Store className="stat-icon" />}
              title="Total Stalls"
              value={stats.totalStalls}
              color="indigo"
            />
            <StatCard
              icon={<TrendingUp className="stat-icon" />}
              title="Stall Owners"
              value={stats.stallOwners}
              color="purple"
            />
          </div>
        )}

        {activeTab === "users" && (
          <div className="data-card">
            <div className="data-card-header">
              <div className="header-content">
                <h2 className="card-title">User Management</h2>
                <div className="header-actions">
                  <div className="search-container">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/admin/add-user")}
                    className="btn-add-user"
                  >
                    <Plus className="btn-icon" />
                    Add User
                  </button>
                </div>
              </div>
            </div>
            <div className="table-container">
              {loading ? (
                <div className="loading-state">Loading users...</div>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => (
                        <tr key={user.userid}>
                          <td>{user.userid}</td>
                          <td className="font-medium">{user.name}</td>
                          <td className="text-gray">{user.email}</td>
                          <td>
                            <span className={`role-badge role-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <button
                                onClick={() => viewUserDetails(user.userid)}
                                className="action-btn btn-view"
                                title="View Details"
                              >
                                <Eye className="action-icon" />
                              </button>
                              <button
                                onClick={() => openEditUserModal(user.userid)}
                                className="action-btn btn-edit"
                                title="Edit User"
                              >
                                <Edit2 className="action-icon" />
                              </button>
                              <button
                                onClick={() => deleteUser(user.userid)}
                                className="action-btn btn-delete"
                                title="Delete User"
                              >
                                <Trash2 className="action-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalUserPages > 1 && (
                    <Pagination
                      currentPage={currentUserPage}
                      totalPages={totalUserPages}
                      onPageChange={setCurrentUserPage}
                      totalItems={filteredUsers.length}
                      itemsPerPage={itemsPerPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "stalls" && (
          <div className="data-card">
            <div className="data-card-header">
              <div className="header-content">
                <h2 className="card-title">Stall Management</h2>
                <div className="header-actions">
                  <div className="search-container">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search stalls..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/admin/add-stall")}
                    className="btn-add-stall"
                  >
                    <Plus className="btn-icon" />
                    Add Stall
                  </button>
                </div>
              </div>
            </div>
            <div className="table-container">
              {loading ? (
                <div className="loading-state">Loading stalls...</div>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Stall Name</th>
                        <th>Category</th>
                        <th>Owner ID</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStalls.map((stall) => (
                        <tr key={stall.stallid}>
                          <td>{stall.stallid}</td>
                          <td className="font-medium">{stall.stallname}</td>
                          <td>
                            <span className="category-badge">
                              {stall.category}
                            </span>
                          </td>
                          <td className="text-gray">
                            {stall.owner_id || "N/A"}
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <button
                                onClick={() => viewStallDetails(stall.stallid)}
                                className="action-btn btn-view"
                                title="View Details"
                              >
                                <Eye className="action-icon" />
                              </button>
                              <button
                                onClick={() =>
                                  openEditStallModal(stall.stallid)
                                }
                                className="action-btn btn-edit"
                                title="Edit Stall"
                              >
                                <Edit2 className="action-icon" />
                              </button>
                              <button
                                onClick={() => deleteStall(stall.stallid)}
                                className="action-btn btn-delete"
                                title="Delete Stall"
                              >
                                <Trash2 className="action-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalStallPages > 1 && (
                    <Pagination
                      currentPage={currentStallPage}
                      totalPages={totalStallPages}
                      onPageChange={setCurrentStallPage}
                      totalItems={filteredStalls.length}
                      itemsPerPage={itemsPerPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {showUserModal && selectedUser && (
        <Modal onClose={() => setShowUserModal(false)} title="User Details">
          <div className="detail-rows">
            <DetailRow label="User ID" value={selectedUser.userid} />
            <DetailRow label="Name" value={selectedUser.name} />
            <DetailRow label="Email" value={selectedUser.email} />
            <DetailRow label="Role" value={selectedUser.role} />
            <DetailRow label="Coins" value={selectedUser.coins} />
          </div>
        </Modal>
      )}

      {/* View Stall Modal */}
      {showStallModal && selectedStall && (
        <Modal onClose={() => setShowStallModal(false)} title="Stall Details">
          <div className="detail-rows">
            <DetailRow label="Stall ID" value={selectedStall.stallid} />
            <DetailRow label="Stall Name" value={selectedStall.stallname} />
            <DetailRow label="Category" value={selectedStall.category} />
            <DetailRow
              label="Owner ID"
              value={selectedStall.owner_id || "Not assigned"}
            />
            {selectedStall.description && (
              <div className="description-section">
                <p className="description-label">Description</p>
                <p className="description-text">{selectedStall.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <Modal onClose={() => setShowEditUserModal(false)} title="Edit User">
          <div className="edit-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editUserData.name}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, name: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editUserData.email}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, email: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={editUserData.role}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, role: e.target.value })
                }
                className="form-input"
              >
                <option value="customer">Customer</option>
                <option value="stall_owner">Stall Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Coins</label>
              <input
                type="number"
                value={editUserData.coins}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, coins: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={editUserData.password}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, password: e.target.value })
                }
                className="form-input"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="form-actions">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleUpdateUser} className="btn-save">
                <Save className="btn-icon" />
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Stall Modal */}
      {showEditStallModal && (
        <Modal onClose={() => setShowEditStallModal(false)} title="Edit Stall">
          <div className="edit-form">
            <div className="form-group">
              <label>Stall Name</label>
              <input
                type="text"
                value={editStallData.stallname}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    stallname: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={editStallData.category}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    category: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editStallData.description}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    description: e.target.value,
                  })
                }
                className="form-input form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Stall Image URL</label>
              <input
                type="text"
                value={editStallData.stall_image}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    stall_image: e.target.value,
                  })
                }
                className="form-input"
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Hawker Centre ID</label>
              <input
                type="text"
                value={editStallData.hawker_centre_id}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    hawker_centre_id: e.target.value,
                  })
                }
                className="form-input"
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Owner ID</label>
              <input
                type="number"
                value={editStallData.owner_id}
                onChange={(e) =>
                  setEditStallData({
                    ...editStallData,
                    owner_id: e.target.value,
                  })
                }
                className="form-input"
                placeholder="Optional - User ID of the stall owner"
              />
            </div>
            <div className="form-actions">
              <button
                onClick={() => setShowEditStallModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleUpdateStall} className="btn-save">
                <Save className="btn-icon" />
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div className="stat-card">
    <div className={`stat-card-header stat-${color}`}>{icon}</div>
    <div className="stat-card-body">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          <ChevronLeft className="pagination-icon" />
          Previous
        </button>
        <div className="pagination-pages">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`pagination-page ${
                currentPage === page ? "active" : ""
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
          <ChevronRight className="pagination-icon" />
        </button>
      </div>
    </div>
  );
};

const Modal = ({ onClose, title, children }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        <button onClick={onClose} className="modal-close">
          <X className="close-icon" />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
);

export default AdminDashboard;
