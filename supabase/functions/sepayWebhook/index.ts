// supabase/functions/sepayWebhook/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("SePay Webhook payload:", payload);

    const content = payload.content || "";
    const match = content.match(/([0-9a-fA-F]{32}|[0-9a-fA-F-]{36})/);
    const paymentId = match ? match[0] : null;

    if (!paymentId) {
      console.error("Không tìm thấy paymentId trong content");
      return new Response("PaymentId not found", { status: 400 });
    }

    function formatUuid(uuid: string) {
      if (uuid.length === 32) {
        return uuid.replace(
          /([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})/,
          "$1-$2-$3-$4-$5"
        );
      }
      return uuid;
    }

    const formattedPaymentId = formatUuid(paymentId);

    // Step 1: Update payments
    const updateData = {
      sepay_id: payload.id,
      gateway: payload.gateway,
      transaction_date: payload.transactionDate
        ? new Date(payload.transactionDate).toISOString()
        : null,
      account_number: payload.accountNumber,
      code: payload.code,
      content: payload.content,
      transfer_type: payload.transferType,
      transfer_amount: payload.transferAmount,
      accumulated: payload.accumulated,
      sub_account: payload.subAccount,
      reference_code: payload.referenceCode,
      description: payload.description,
      raw_payload: payload,
      status: "success",
    };

    const { data: updatedPayments, error: paymentError } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", formattedPaymentId)
      .select("id, user_id, plan_id, plan_due_date")
      .single();

    if (paymentError || !updatedPayments) {
      console.error("Update payments error:", paymentError);
      return new Response("Database update failed", { status: 500 });
    }

    const { id: payment_id, user_id, plan_id, plan_due_date } = updatedPayments;
    console.log("Updated payment =>", updatedPayments);

    if (!user_id || !plan_id) {
      console.error("Payment missing user_id or plan_id");
      return new Response("Missing user_id or plan_id", { status: 400 });
    }

    // Step 2: Check profile_plans for this user
    const { data: existingPlan, error: checkError } = await supabase
      .from("profile_plans")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking profile_plans:", checkError);
      return new Response("Check profile_plans failed", { status: 500 });
    }

    const planData = {
      plan_id,
      plan_due_date,
      payment_id,
      user_id,
    };

    let profilePlanResult;

    if (existingPlan) {
      // Update nếu đã có
      const { data: updatedProfilePlan, error: updateError } = await supabase
        .from("profile_plans")
        .update(planData)
        .eq("id", existingPlan.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update profile_plans error:", updateError);
        return new Response("Update profile_plans failed", { status: 500 });
      }

      profilePlanResult = updatedProfilePlan;
    } else {
      // Insert nếu chưa có
      const { data: newProfilePlan, error: insertError } = await supabase
        .from("profile_plans")
        .insert([planData])
        .select()
        .single();

      if (insertError) {
        console.error("Insert profile_plans error:", insertError);
        return new Response("Insert profile_plans failed", { status: 500 });
      }

      profilePlanResult = newProfilePlan;
    }

    return new Response(
      JSON.stringify({
        received: true,
        payment: updatedPayments,
        profile_plan: profilePlanResult,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Bad Request", { status: 400 });
  }
});
