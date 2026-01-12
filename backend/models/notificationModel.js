// models/notificationModel.js
const supabase = require("../supabaseClient");

async function getNotificationsByUser(userId) {
  try {
    // Verify user is a stall owner
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("userid", userId)
      .single();

    if (userError) throw userError;
    if (user.role !== "stall_owner") {
      throw new Error("Access denied. Stall owners only.");
    }

    // Get notifications with related data
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        notificationid,
        stallid,
        menuitemid,
        suggestedimageid,
        type,
        suggested_image_votes,
        current_image_url,
        status,
        createdat,
        updatedat,
        stalls (
          stallid,
          stallname
        ),
        menuitems (
          menuitemid,
          name,
          mainimageurl
        ),
        images (
          imageid,
          imageurl
        )
      `
      )
      .eq("userid", userId)
      .order("createdat", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getNotificationById(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        notificationid,
        userid,
        stallid,
        menuitemid,
        suggestedimageid,
        type,
        suggested_image_votes,
        current_image_url,
        status,
        createdat,
        updatedat,
        stalls (
          stallid,
          stallname
        ),
        menuitems (
          menuitemid,
          name,
          mainimageurl,
          description,
          price
        ),
        images (
          imageid,
          imageurl,
          uploaderid,
          uploadedat
        )
      `
      )
      .eq("notificationid", notificationId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Verify ownership
    if (data && data.userid !== userId) {
      throw new Error("Access denied");
    }

    // Get current vote count for the suggested image
    if (data) {
      const { count } = await supabase
        .from("imagevotes")
        .select("*", { count: "exact", head: true })
        .eq("imageid", data.suggestedimageid);

      data.current_vote_count = count || 0;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function approveNotification(notificationId, userId) {
  try {
    // Get notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select(
        `
        userid,
        menuitemid,
        status,
        images (imageurl)
      `
      )
      .eq("notificationid", notificationId)
      .single();

    if (notifError) throw notifError;

    // Verify ownership
    if (notification.userid !== userId) {
      throw new Error("Access denied");
    }

    // Check if already processed
    if (notification.status !== "pending") {
      throw new Error("Notification already processed");
    }

    // Update menu item with new main image
    const { error: updateError } = await supabase
      .from("menuitems")
      .update({
        mainimageurl: notification.images.imageurl,
      })
      .eq("menuitemid", notification.menuitemid);

    if (updateError) throw updateError;

    // Update notification status
    const { error: statusError } = await supabase
      .from("notifications")
      .update({
        status: "approved",
        updatedat: new Date().toISOString(),
      })
      .eq("notificationid", notificationId);

    if (statusError) throw statusError;

    return {
      message: "Image updated successfully",
      newImageUrl: notification.images.imageurl,
    };
  } catch (error) {
    throw error;
  }
}

async function dismissNotification(notificationId, userId) {
  try {
    // Get notification to verify ownership
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("userid, status")
      .eq("notificationid", notificationId)
      .single();

    if (notifError) throw notifError;

    // Verify ownership
    if (notification.userid !== userId) {
      throw new Error("Access denied");
    }

    // Check if already processed
    if (notification.status !== "pending") {
      throw new Error("Notification already processed");
    }

    // Update notification status
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        status: "dismissed",
        updatedat: new Date().toISOString(),
      })
      .eq("notificationid", notificationId);

    if (updateError) throw updateError;

    return { message: "Notification dismissed" };
  } catch (error) {
    throw error;
  }
}

async function getNotificationStats(userId) {
  try {
    // Get counts by status
    const { data, error } = await supabase
      .from("notifications")
      .select("status")
      .eq("userid", userId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter((n) => n.status === "pending").length,
      approved: data.filter((n) => n.status === "approved").length,
      dismissed: data.filter((n) => n.status === "dismissed").length,
    };

    return stats;
  } catch (error) {
    throw error;
  }
}

async function revertNotification(notificationId, userId) {
  try {
    // Get notification with previous image
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select(
        `
        userid,
        menuitemid,
        status,
        previous_image_url
      `
      )
      .eq("notificationid", notificationId)
      .single();

    if (notifError) throw notifError;

    // Verify ownership
    if (notification.userid !== userId) {
      throw new Error("Access denied");
    }

    // Check if it was approved
    if (notification.status !== "approved") {
      throw new Error("Can only revert approved notifications");
    }

    // Check if previous image exists
    if (!notification.previous_image_url) {
      throw new Error("No previous image to revert to");
    }

    // Restore the previous image
    const { error: updateError } = await supabase
      .from("menuitems")
      .update({
        mainimageurl: notification.previous_image_url,
      })
      .eq("menuitemid", notification.menuitemid);

    if (updateError) throw updateError;

    // Update notification status back to pending
    const { error: statusError } = await supabase
      .from("notifications")
      .update({
        status: "pending",
        updatedat: new Date().toISOString(),
      })
      .eq("notificationid", notificationId);

    if (statusError) throw statusError;

    return {
      message: "Image reverted to original successfully",
      restoredImageUrl: notification.previous_image_url,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getNotificationsByUser,
  getNotificationById,
  approveNotification,
  dismissNotification,
  getNotificationStats,
  revertNotification,
};
