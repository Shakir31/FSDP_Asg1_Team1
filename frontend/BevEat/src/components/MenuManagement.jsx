import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import "../MenuManagement.css";

function MenuManagement() {
  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    mainimageurl: "",
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  const categories = [
    "Chinese",
    "Malay",
    "Indian",
    "Peranakan",
    "Hakka",
    "Western",
    "Drinks",
  ];

  useEffect(() => {
    fetchMyStalls();
  }, []);

  useEffect(() => {
    if (selectedStall) {
      fetchMenuItems(selectedStall.stallid);
    }
  }, [selectedStall]);

  async function fetchMyStalls() {
    try {
      const response = await fetch(
        "http://localhost:3000/menu-management/my-stalls",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stalls");

      const data = await response.json();
      setStalls(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load your stalls");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMenuItems(stallId) {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/stalls/${stallId}/menu`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch menu items");

      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setFormData({
      name: "",
      description: "",
      price: "",
      mainimageurl: "",
      category: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEditModal(item) {
    setModalMode("edit");
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      mainimageurl: item.mainimageurl,
      category: item.category,
    });
    setImagePreview(item.mainimageurl);
    setImageFile(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      mainimageurl: "",
      category: "",
    });
    setImageFile(null);
    setImagePreview(null);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function uploadImageToCloudinary() {
    if (!imageFile) return formData.mainimageurl;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("imageFile", imageFile);

      const response = await fetch(
        "http://localhost:3000/menu-management/upload-image",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      return data.imageUrl;
    } catch (err) {
      toast.error("Image upload failed: " + err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !formData.category) {
      toast.warning(
        "Please fill in all required fields (Name, Price, Category)"
      );
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast.warning("Price must be greater than 0");
      return;
    }

    try {
      setUploading(true);

      // Upload image if new file selected
      let imageUrl = formData.mainimageurl;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        mainimageurl: imageUrl || "",
      };

      if (modalMode === "create") {
        payload.stallId = selectedStall.stallid;

        const response = await fetch(
          "http://localhost:3000/menu-management/menuitems",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error("Failed to create menu item");

        toast.success("Menu item created successfully!");
      } else {
        const response = await fetch(
          `http://localhost:3000/menu-management/menuitems/${editingItem.menuitemid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error("Failed to update menu item");

        toast.success("Menu item updated successfully!");
      }

      closeModal();
      fetchMenuItems(selectedStall.stallid);
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(menuItemId) {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/menu-management/menuitems/${menuItemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete menu item");

      toast.success("Menu item deleted successfully!");
      fetchMenuItems(selectedStall.stallid);
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    }
  }

  if (loading && !selectedStall) {
    return (
      <div className="menu-management-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !stalls.length) {
    return (
      <div className="menu-management-page">
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  // Step 1: Select Stall
  if (!selectedStall) {
    return (
      <div className="menu-management-page">
        <div className="page-header">
          <h1>Menu Management</h1>
          <p>Select a stall to manage its menu items</p>
        </div>

        <div className="stalls-grid">
          {stalls.map((stall) => (
            <div
              key={stall.stallid}
              className="stall-card"
              onClick={() => setSelectedStall(stall)}
            >
              <img
                src={stall.stall_image || "https://via.placeholder.com/300x200"}
                alt={stall.stallname}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x200";
                }}
              />
              <h3>{stall.stallname}</h3>
              <p>{stall.description}</p>
              {stall.category && (
                <span className="category-badge">{stall.category}</span>
              )}
            </div>
          ))}
        </div>

        {stalls.length === 0 && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
            No stalls assigned to you yet.
          </p>
        )}
      </div>
    );
  }

  // Step 2: Manage Menu Items
  return (
    <div className="menu-management-page">
      <div className="page-header">
        <button className="back-button" onClick={() => setSelectedStall(null)}>
          <ArrowLeft size={20} />
          Back to Stalls
        </button>
        <div>
          <h1>{selectedStall.stallname}</h1>
          <p>Manage menu items</p>
        </div>
        <button className="btn-create" onClick={openCreateModal}>
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      {loading ? (
        <p>Loading menu items...</p>
      ) : (
        <div className="menu-items-grid">
          {menuItems.map((item) => (
            <div key={item.menuitemid} className="menu-item-card">
              <img
                src={item.mainimageurl || "https://via.placeholder.com/300x200"}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x200";
                }}
              />
              <div className="menu-item-content">
                <h3>{item.name}</h3>
                <p className="description">{item.description}</p>
                <div className="menu-item-footer">
                  <span className="price">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                  <span className="category-tag">{item.category}</span>
                </div>
                <div className="menu-item-actions">
                  <button
                    className="btn-edit"
                    onClick={() => openEditModal(item)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(item.menuitemid)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && menuItems.length === 0 && (
        <div className="empty-state">
          <p>No menu items yet</p>
          <button className="btn-create" onClick={openCreateModal}>
            <Plus size={20} />
            Add Your First Item
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modalMode === "create" ? "Add Menu Item" : "Edit Menu Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : modalMode === "create"
                    ? "Create"
                    : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
