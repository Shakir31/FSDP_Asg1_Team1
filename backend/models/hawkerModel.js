const supabase = require("../supabaseClient");

async function getAllHawkerCentres() {
  try {
    const { data, error } = await supabase
      .from("hawker_centres")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getHawkerCentreById(id) {
  try {
    const { data, error } = await supabase
      .from("hawker_centres")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getHawkerCentresByStatus(status) {
  try {
    const { data, error } = await supabase
      .from("hawker_centres")
      .select("*")
      .eq("status", status)
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function searchHawkerCentres(searchTerm) {
  try {
    const { data, error } = await supabase
      .from("hawker_centres")
      .select("*")
      .or(
        `name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,postal_code.ilike.%${searchTerm}%`
      )
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getStallsByHawkerCentreId(hawkerCentreId) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("hawker_centre_id", hawkerCentreId);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllHawkerCentres,
  getHawkerCentreById,
  getHawkerCentresByStatus,
  searchHawkerCentres,
  getStallsByHawkerCentreId,
};
