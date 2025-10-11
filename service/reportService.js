import { supabase } from "@/lib/supabase";

export const getReportOptions = async () => {
  try {
    const { data, error } = await supabase
      .from("report_options")
      .select("id, name, description")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getReportOptions error:", err.message);
    throw err;
  }
};

export const submitProfileReport = async (payload) => {
  try {
    const { reporter, reported, report_option_id, note, reported_message, reported_message_body } = payload;

    const { data, error } = await supabase
      .from("profile_reports")
      .insert([
        {
          reporter,
          reported,
          report_option_id,
          note: note || null,
          reported_message: reported_message || null,
          reported_message_body: reported_message_body || null
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("submitProfileReport error:", err.message);
    throw err;
  }
};
