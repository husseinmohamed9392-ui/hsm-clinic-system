import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const modules = ["dashboard","patients","appointments","visits","prescriptions","invoices","reports","inventory","users","backup","settings"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(url, serviceKey);
    if (body.action === "bootstrap") {
      const { count } = await adminClient.from("profiles").select("id", { count: "exact", head: true });
      if ((count || 0) > 0) throw new Error("تم إنشاء المستخدم الأساسي بالفعل");
      const username = String(body.username || "").trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error("اسم المستخدم يجب أن يكون إنجليزيًا من 3 إلى 30 حرفًا");
      if (!body.password || String(body.password).length < 6) throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف");
      const { error } = await adminClient.auth.admin.createUser({ email: `${username}@hsm-clinic.local`, password: body.password, email_confirm: true, user_metadata: { username, full_name: body.full_name || "مدير النظام" } });
      if (error) throw error;
      return json({ success: true });
    }
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error("غير مصرح بالدخول");
    const { data: caller } = await adminClient.from("profiles").select("role,active").eq("id", user.id).single();
    if (!caller?.active || caller.role !== "admin") throw new Error("هذه العملية لمدير النظام فقط");

    if (body.action === "set_active") {
      await adminClient.from("profiles").update({ active: Boolean(body.active) }).eq("id", body.user_id);
      return json({ success: true });
    }
    if (body.action === "reset_password") {
      if (!body.password || String(body.password).length < 6) throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف");
      const { error } = await adminClient.auth.admin.updateUserById(body.user_id, { password: body.password });
      if (error) throw error;
      return json({ success: true });
    }

    const username = String(body.username || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error("اسم المستخدم يجب أن يكون إنجليزيًا من 3 إلى 30 حرفًا");
    if (!body.password || String(body.password).length < 6) throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف");
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: `${username}@hsm-clinic.local`, password: body.password, email_confirm: true,
      user_metadata: { username, full_name: body.full_name || username },
    });
    if (createError || !created.user) throw createError || new Error("تعذر إنشاء المستخدم");
    const userId = created.user.id;
    await adminClient.from("profiles").update({ full_name: body.full_name || username, role: body.role || "employee", active: true }).eq("id", userId);
    const provided = Array.isArray(body.permissions) ? body.permissions : [];
    const rows = modules.map((module) => {
      const permission = provided.find((item: Record<string, unknown>) => item.module === module) || {};
      return { user_id: userId, module, can_view: Boolean(permission.can_view), can_add: Boolean(permission.can_add), can_edit: Boolean(permission.can_edit), can_delete: Boolean(permission.can_delete), can_print: Boolean(permission.can_print) };
    });
    await adminClient.from("user_permissions").upsert(rows, { onConflict: "user_id,module" });
    return json({ success: true, user_id: userId });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }, 400);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
