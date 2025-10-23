import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
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

  function calcDueDate(duration: string): string | null {
    const now = new Date();
    switch (duration) {
      case "1w":
        now.setDate(now.getDate() + 7);
        break;
      case "1m":
        now.setMonth(now.getMonth() + 1);
        break;
      case "1y":
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        return null;
    }
    return now.toISOString();
  }

  try {
    const payload = await req.json();
    // console.log("SePay Webhook payload:", payload);

    const content = payload.content || "";
    const planMatch = content.match(/\bplan(\d+[wmy])([0-9a-fA-F]{32})\b/);
    const consumMatch = content.match(/\bconsumable([0-9a-fA-F]{32})\b/);

    let type: "plan" | "consumable" | null = null;
    let paymentId = "";
    let plan_due_date = "";

    if (planMatch) {
      type = "plan";
      plan_due_date = planMatch[1];
      paymentId = planMatch[2];
    } else if (consumMatch) {
      type = "consumable";
      paymentId = consumMatch[1];
    }

    if (!type || !paymentId) {
      console.error("Không tìm thấy type/paymentId trong content:", content);
      return new Response("PaymentId/type not found", { status: 400 });
    }
    
    const formattedPaymentId = formatUuid(paymentId);

    // console.log("type, plan_due_date, paymentId, formattedPaymentId", type, plan_due_date, paymentId, formattedPaymentId);

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

    let tableName: string;
    let selectFields: string;

    if (type === "plan") {
      tableName = "payments";
      selectFields = "id, user_id, plan_id";
    } else if (type === "consumable") {
      tableName = "consumable_payments";
      selectFields = "id, user_id, consumable_id, consumable_amount";
    }

    const { data: updatedPayment, error: paymentError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", formattedPaymentId)
      .eq("status", "pending")
      .select(selectFields)
      .single();

    if (paymentError || !updatedPayment) {
      console.error("Update payments error:", paymentError);
      return new Response("Database update failed", { status: 500 });
    }

    // console.log("Updated payment =>", updatedPayment);

    if (type === "plan") {
      const { id: payment_id, user_id, plan_id } = updatedPayment;

      if (!user_id || !plan_id) {
        return new Response("Missing user_id or plan_id", { status: 400 });
      }

      const dueDate = calcDueDate(plan_due_date);
      if (!dueDate) {
        return new Response("Invalid plan_due_date", { status: 400 });
      }

      const { data: existingPlan, error: checkError } = await supabase
        .from("profile_plans")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (checkError) {
        return new Response("Check profile_plans failed", { status: 500 });
      }

      const planData = {
        plan_id,
        plan_due_date: dueDate,
        payment_id,
        user_id,
      };
      let profilePlanResult;

      if (existingPlan) {
        const { data: updatedProfilePlan, error: updateError } = await supabase
          .from("profile_plans")
          .update(planData)
          .eq("id", existingPlan.id)
          .select()
          .single();

        if (updateError) {
          return new Response("Update profile_plans failed", { status: 500 });
        }

        profilePlanResult = updatedProfilePlan;
      } else {
        const { data: newProfilePlan, error: insertError } = await supabase
          .from("profile_plans")
          .insert([planData])
          .select()
          .single();

        if (insertError) {
          return new Response("Insert profile_plans failed", { status: 500 });
        }

        profilePlanResult = newProfilePlan;
      }

      return new Response(
        JSON.stringify({
          received: true,
          payment: updatedPayment,
          profile_plan: profilePlanResult,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "consumable") {
      const {
        id: payment_id,
        user_id,
        consumable_id,
        consumable_amount,
      } = updatedPayment;

      if (!user_id || !consumable_id) {
        return new Response("Missing user_id or consumable_id", {
          status: 400,
        });
      }

      const { data: likesData, error: likesError } = await supabase
        .from("likes_remain")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

      if (likesError) {
        return new Response("Fetch likes_remain failed", { status: 500 });
      }

      if (!likesData) {
        console.warn(
          "No likes_remain record for user, skipping update (no insert allowed)"
        );
      } else {
        const updatedLikes: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        switch (consumable_id) {
          case 1:
            updatedLikes.super_likes_remaining =
              likesData.super_likes_remaining + Number(consumable_amount);
            break;
          case 2:
            updatedLikes.time_extend_remaining =
              (likesData.time_extend_remaining || 0) +
              Number(consumable_amount);
            break;
          default:
            console.warn(
              `Unknown consumable_id ${consumable_id}, nothing to update`
            );
            return new Response("Unknown consumable_id, no update done", {
              status: 400,
            });
        }

        const { data: updatedLikesData, error: updateLikesError } =
          await supabase
            .from("likes_remain")
            .update(updatedLikes)
            .eq("user_id", user_id)
            .select()
            .single();

        if (updateLikesError) {
          return new Response("Update likes_remain failed", { status: 500 });
        }

        // console.log("Updated likes_remain =>", updatedLikesData);

        return new Response(
          JSON.stringify({
            received: true,
            payment: updatedPayment,
            likes_remain: updatedLikesData,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Unknown type", { status: 400 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Bad Request", { status: 400 });
  }
});
