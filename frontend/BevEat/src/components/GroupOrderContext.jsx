// src/components/GroupOrderContext.jsx
import React, { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const GroupOrderContext = createContext(null);

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function GroupOrderProvider({ children }) {
  const [session, setSession] = useState(null); // { sessionid, join_code, host_userid }

  const startGroupOrder = async () => {
    const token = getToken();

    if (!token) {
      toast.error("Please log in to continue");
      return null;
    }

    try {
      const res = await fetch("http://localhost:3000/group-order/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
        return null;
      }

      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        toast.success(`Group Order Started! Code: ${data.session.join_code}`);
        return data.session;
      } else {
        toast.error(data.error || "Failed to start group order");
        return null;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start session");
      return null;
    }
  };

  const joinGroupOrder = async (code) => {
    const token = getToken();

    if (!token) {
      toast.error("Please log in to continue");
      return false;
    }

    try {
      const res = await fetch("http://localhost:3000/group-order/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ joinCode: code }),
      });

      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
        return false;
      }

      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        toast.success(`Joined Group Order: ${code}`);
        return true;
      } else {
        toast.error(data.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Error joining session");
      return false;
    }
  };

  const addItemToGroup = async (menuItemId, quantity) => {
    if (!session) {
      toast.error("No active group session");
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error("Please log in to continue");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/group-order/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.sessionid,
          menuItemId,
          quantity,
        }),
      });

      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        toast.success("Added to Group Cart!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add item");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    }
  };

  return (
    <GroupOrderContext.Provider
      value={{
        session,
        setSession,
        startGroupOrder,
        joinGroupOrder,
        addItemToGroup,
      }}
    >
      {children}
    </GroupOrderContext.Provider>
  );
}

export const useGroupOrder = () => useContext(GroupOrderContext);
