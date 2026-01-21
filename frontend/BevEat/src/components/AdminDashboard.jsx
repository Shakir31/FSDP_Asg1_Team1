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
  Building2,
} from "lucide-react";
import "../AdminDashboard.css";
import { toast } from "react-toastify";

const API_URL = "http://localhost:3000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [selectedHawkerCentre, setSelectedHawkerCentre] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStallModal, setShowStallModal] = useState(false);
  const [showHawkerCentreModal, setShowHawkerCentreModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditStallModal, setShowEditStallModal] = useState(false);
  const [showEditHawkerCentreModal, setShowEditHawkerCentreModal] = useState(false);
  const [editUserData, setEditUserData] = useState({});
  const [editStallData, setEditStallData] = useState({});
  const [editHawkerCentreData, setEditHawkerCentreData] = useState({});
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentStallPage, setCurrentStallPage] = useState(1);
  const [currentHawkerCentrePage, setCurrentHawkerCentrePage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStalls: 0,
    totalHawkerCentres: 0,
    stallOwners: 0,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
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
    } else if (activeTab === "hawkerCentres") {
      if (hawkerCentres.length === 0) {
        fetchHawkerCentres();
      }
    }
  }, [activeTab]);

  const fetchBothForStats = async () => {
    setLoading(true);
    try {
      const [usersResponse, stallsResponse, hawkerCentresResponse] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/admin/stalls`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/hawker-centres`, { headers: getAuthHeaders() }),
      ]);

      if (!usersResponse.ok) throw new Error("Failed to fetch users");
      if (!stallsResponse.ok) throw new Error("Failed to fetch stalls");
      if (!hawkerCentresResponse.ok) throw new Error("Failed to fetch hawker centres");

      const usersData = await usersResponse.json();
      const stallsData = await stallsResponse.json();
      const hawkerCentresData = await hawkerCentresResponse.json();

      setUsers(usersData);
      setStalls(stallsData);
      setHawkerCentres(hawkerCentresData);
      calculateStats(usersData, stallsData, hawkerCentresData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      calculateStats(data, stalls, hawkerCentres);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStalls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stalls`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stalls");
      const data = await response.json();
      setStalls(data);
      calculateStats(users, data, hawkerCentres);
    } catch (error) {
      console.error("Error fetching stalls:", error);
      toast.error("Failed to fetch stalls");
    } finally {
      setLoading(false);
    }
  }

  const fetchHawkerCentres = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hawker-centres`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch hawker centres");
      const data = await response.json();
      setHawkerCentres(data);
      calculateStats(users, stalls, data);
    } catch (error) {
      console.error("Error fetching hawker centres:", error);
      toast.error("Failed to fetch hawker centres");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData, stallData, hawkerCentresData) => {
    const stallOwners = userData.filter((u) => u.role === "stall_owner").length;
    setStats({
      totalUsers: userData.length,
      totalStalls: stallData.length,
      totalHawkerCentres: hawkerCentresData.length,
      stallOwners,
    });
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });
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
    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stall details");
      const data = await response.json();
      setSelectedStall(data);
      setShowStallModal(true);
    } catch (error) {
      console.error("Error fetching stall details:", error);
      toast.error("Failed to fetch stall details");
    }
  };

  const viewHawkerCentreDetails = async (id) => {
    try {
      const response = await fetch(`${API_URL}/hawker-centres/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch hawker centre details");
      const data = await response.json();
      setSelectedHawkerCentre(data);
      setShowHawkerCentreModal(true);
    } catch (error) {
      console.error("Error fetching hawker centre details:", error);
      toast.error("Failed to fetch hawker centre details");
    }
  };

  const openEditUserModal = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });
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
    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        headers: getAuthHeaders(),
      });
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

  const openEditHawkerCentreModal = async (id) => {
    try {
      const response = await fetch(`${API_URL}/hawker-centres/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch hawker centre details");
      const data = await response.json();
      setEditHawkerCentreData({
        centreid: data.id,
        name: data.name,
        address: data.address,
        no_of_cooked_food_stalls: data.no_of_cooked_food_stalls,
      });
      setShowEditHawkerCentreModal(true);
    } catch (error) {
      console.error("Error fetching hawker centre details:", error);
      toast.error("Failed to fetch hawker centre details");
    }
  }; 

  const handleUpdateUser = async () => {
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
        }
      );

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
        }
      );

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

  const handleUpdateHawkerCentre = async () => {
    try {
      const updatePayload = {
        name: editHawkerCentreData.name,
        address: editHawkerCentreData.address,
        no_of_cooked_food_stalls: editHawkerCentreData.no_of_cooked_food_stalls,
      };
      const response = await fetch(
        `${API_URL}/admin/hawker-centres/${editHawkerCentreData.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update hawker centre");
      }
      toast.success("Hawker centre updated successfully");
      setShowEditHawkerCentreModal(false);
      fetchHawkerCentres();
    } catch (error) {
      console.error("Error updating hawker centre:", error);
      toast.error("Failed to update hawker centre: " + error.message);
    }
  };

  const handleAddStall = async () => {
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
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          });

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
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
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
        "Are you sure you want to delete this stall? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/stalls/${stallId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete stall");
      toast.success("Stall deleted successfully");
      fetchStalls();
    } catch (error) {
      console.error("Error deleting stall:", error);
      toast.error("Failed to delete stall: " + error.message);
    }
  };

  const deleteHawkerCentre = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hawker centre? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/hawker-centres/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete hawker centre");
      toast.success("Hawker centre deleted successfully");
      fetchHawkerCentres();
    } catch (error) {
      console.error("Error deleting hawker centre:", error);
      toast.error("Failed to delete hawker centre: " + error.message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStalls = stalls.filter(
    (stall) =>
      stall.stallname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHawkerCentres = hawkerCentres.filter(
    (centre) =>
      centre.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalStallPages = Math.ceil(filteredStalls.length / itemsPerPage);
  const totalHawkerCentrePages = Math.ceil(filteredHawkerCentres.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * itemsPerPage,
    currentUserPage * itemsPerPage
  );

  const paginatedStalls = filteredStalls.slice(
    (currentStallPage - 1) * itemsPerPage,
    currentStallPage * itemsPerPage
  );

  const paginatedHawkerCentres = filteredHawkerCentres.slice(
    (currentHawkerCentrePage - 1) * itemsPerPage,
    currentHawkerCentrePage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentUserPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    setCurrentStallPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    setCurrentHawkerCentrePage(1);
  }, [searchTerm, activeTab]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="header-left">
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Manage users, stalls, hawker centres, and system settings
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
          {["overview", "users", "stalls", "hawker centres"].map((tab) => (
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
            <StatCard
              icon={<Building2 className="stat-icon" />}
              title="Hawker Centres"
              value={stats.totalHawkerCentres}
              color="pink"
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

        {activeTab === "hawker centres" && (
          <div className="data-card">
            <div className="data-card-header">
              <div className="header-content">
                <h2 className="card-title">Hawker Centre Management</h2>
                <div className="header-actions">
                  <div className="search-container">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search hawker centres..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="table-container">
              {loading ? (
                <div className="loading-state">Loading hawker centres...</div>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Food Stores</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHawkerCentres.map((centre) => (
                        <tr key={centre.id}>
                          <td>{centre.id}</td>
                          <td className="font-medium">{centre.name}</td>
                          <td className="text-gray">{centre.address}</td>
                          <td className="text-gray">
                            {centre.no_of_cooked_food_stalls || "No food stores"}
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  viewHawkerCentreDetails(centre.id)
                                }
                                className="action-btn btn-view"
                                title="View Details"
                              >
                                <Eye className="action-icon" />
                              </button>
                              <button
                                onClick={() =>
                                  openEditHawkerCentreModal(centre.id)
                                }
                                className="action-btn btn-edit"
                                title="Edit Hawker Centre"
                              >
                                <Edit2 className="action-icon" />
                              </button>
                              <button
                                onClick={() =>
                                  deleteHawkerCentre(centre.id)
                                }
                                className="action-btn btn-delete"
                                title="Delete Hawker Centre"
                              >
                                <Trash2 className="action-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalHawkerCentrePages > 1 && (
                    <Pagination
                      currentPage={currentHawkerCentrePage}
                      totalPages={totalHawkerCentrePages}
                      onPageChange={setCurrentHawkerCentrePage}
                      totalItems={filteredHawkerCentres.length}
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

      {/* View Hawker Centre Modal */}
      {showHawkerCentreModal && selectedHawkerCentre && (
        <Modal
          onClose={() => setShowHawkerCentreModal(false)}
          title="Hawker Centre Details"
        >
          <div className="detail-rows">
            <DetailRow label="Centre ID" value={selectedHawkerCentre.id} />
            <DetailRow label="Name" value={selectedHawkerCentre.name} />
            <DetailRow label="Address" value={selectedHawkerCentre.address} />
            {selectedHawkerCentre.description && (
              <div className="description-section">
                <p className="description-label">Description</p>
                <p className="description-text">
                  {selectedHawkerCentre.description}
                </p>
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

      {/* Edit Hawker Centre Modal */}
      {showEditHawkerCentreModal && (
        <Modal
          onClose={() => setShowEditHawkerCentreModal(false)}
          title="Edit Hawker Centre"
        >
          <div className="edit-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editHawkerCentreData.name}
                onChange={(e) =>
                  setEditHawkerCentreData({
                    ...editHawkerCentreData,
                    name: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={editHawkerCentreData.address}
                onChange={(e) =>
                  setEditHawkerCentreData({
                    ...editHawkerCentreData,
                    address: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Food Stores</label>
              <textarea
                value={editHawkerCentreData.no_of_cooked_food_stalls}
                onChange={(e) =>
                  setEditHawkerCentreData({
                    ...editHawkerCentreData,
                    no_of_cooked_food_stalls: e.target.value,
                  })
                }
                className="form-input form-textarea"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button
                onClick={() => setShowEditHawkerCentreModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleUpdateHawkerCentre} className="btn-save">
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

  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage <= 5) {
        for (let i = 2; i <= Math.min(7, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > 8) pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 4) {
        if (totalPages > 8) pages.push('...');
        for (let i = Math.max(totalPages - 6, 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

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
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`pagination-page ${
                  currentPage === page ? "active" : ""
                }`}
              >
                {page}
              </button>
            )
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
