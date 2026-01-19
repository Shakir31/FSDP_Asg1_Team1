// src/components/GroupOrderContext.jsx
import React, { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const GroupOrderContext = createContext(null);

export function GroupOrderProvider({ children }) {
  const [session, setSession] = useState(null); // { sessionid, join_code, host_userid }

  const startGroupOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3000/group-order/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        toast.success(`Group Order Started! Code: ${data.session.join_code}`);
        return data.session;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start session");
    }
  };

  const joinGroupOrder = async (code) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3000/group-order/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ joinCode: code })
      });
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
      toast.error("Error joining session");
    }
  };

  const addItemToGroup = async (menuItemId, quantity) => {
    if (!session) return;
    const token = localStorage.getItem("token");
    try {
      await fetch("http://localhost:3000/group-order/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            sessionId: session.sessionid, 
            menuItemId, 
            quantity 
        })
      });
      toast.success("Added to Group Cart!");
    } catch (err) {
      toast.error("Failed to add item");
    }
  };

  return (
    <GroupOrderContext.Provider value={{ session, setSession, startGroupOrder, joinGroupOrder, addItemToGroup }}>
      {children}
    </GroupOrderContext.Provider>
  );
}

export const useGroupOrder = () => useContext(GroupOrderContext);