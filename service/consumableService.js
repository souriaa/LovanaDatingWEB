import { supabase } from "@/lib/supabase";

export async function getConsumableById(consumableId) {
  const { data: consumables, error: consumableErr } = await supabase
    .from("consumables")
    .select("*")
    .eq("id", consumableId)
    .single();

  if (consumableErr) throw consumableErr;

  const { data: packages, error: packageErr } = await supabase
    .from("consumable_packages")
    .select("*")
    .eq("consumable_id", consumableId)
    .order("sort_order", { ascending: true });

  if (packageErr) throw packageErr;

  const { data: discounts, error: discountErr } = await supabase
    .from("package_discounts")
    .select("*")
    .in(
      "package_id",
      packages.map((p) => p.id)
    )
    .eq("is_active", true);

  if (discountErr) throw discountErr;

  const packagesWithDiscount = packages.map((p) => {
    const discount = discounts.find((d) => d.package_id === p.id);
    return {
      ...p,
      discount_percent: discount?.discount_percent || 0,
      discount_start_at: discount?.start_at,
      discount_end_at: discount?.end_at,
    };
  });

  return {
    ...consumables,
    packages: packagesWithDiscount,
  };
}
