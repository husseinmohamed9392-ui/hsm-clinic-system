import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  CalendarDays,
  ClipboardList,
  FileHeart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  isConfigured,
  supabase,
  usernameToEmail,
  validUsername,
} from "./lib/supabase";
import type {
  ActionKey,
  ClinicRow,
  ClinicSession,
  ModuleKey,
  Permission,
  Profile,
} from "./types";

type DataModule =
  | "patients"
  | "appointments"
  | "visits"
  | "prescriptions"
  | "invoices"
  | "reports"
  | "inventory";
type PrescriptionPrintMode = "data-only" | "full-design";
type MedicineEntry = {
  n: string;
  a?: string;
  s?: string;
  custom?: boolean;
};
type PrescriptionMedicine = {
  name: string;
  usage: string;
};
type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  wide?: boolean;
};

const modules: {
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { key: "patients", label: "المرضى", icon: UsersRound },
  { key: "appointments", label: "المواعيد", icon: CalendarDays },
  { key: "visits", label: "الزيارات", icon: Stethoscope },
  { key: "prescriptions", label: "الروشتات", icon: ClipboardList },
  { key: "invoices", label: "الفواتير", icon: ReceiptText },
  { key: "reports", label: "التقارير الطبية", icon: FileHeart },
  { key: "inventory", label: "المخزون", icon: Package },
  { key: "users", label: "المستخدمون والصلاحيات", icon: ShieldCheck },
  { key: "backup", label: "النسخ الاحتياطي", icon: ArchiveRestore },
  { key: "settings", label: "الإعدادات", icon: Settings },
];

const tables: Record<DataModule, string> = {
  patients: "patients",
  appointments: "appointments",
  visits: "visits",
  prescriptions: "prescriptions",
  invoices: "invoices",
  reports: "medical_reports",
  inventory: "inventory",
};
const fields: Record<DataModule, Field[]> = {
  patients: [
    { key: "full_name", label: "اسم المريض", required: true },
    { key: "age", label: "السن", type: "number" },
    { key: "phone", label: "الهاتف" },
    { key: "gender", label: "النوع", options: ["غير محدد", "ذكر", "أنثى"] },
    { key: "address", label: "العنوان", wide: true },
    { key: "diagnosis", label: "التشخيص المبدئي", wide: true },
    {
      key: "medical_history",
      label: "التاريخ المرضي والحساسية",
      type: "textarea",
      wide: true,
    },
    { key: "notes", label: "ملاحظات", type: "textarea", wide: true },
  ],
  appointments: [
    { key: "patient_name", label: "اسم المريض", required: true },
    { key: "appointment_date", label: "التاريخ", type: "date", required: true },
    { key: "appointment_time", label: "الوقت", type: "time" },
    {
      key: "visit_type",
      label: "نوع الزيارة",
      options: ["كشف", "متابعة", "استشارة"],
    },
    {
      key: "status",
      label: "الحالة",
      options: ["منتظر", "تم الحضور", "مؤجل", "لم يحضر"],
    },
    { key: "notes", label: "ملاحظات", type: "textarea", wide: true },
  ],
  visits: [
    { key: "patient_name", label: "اسم المريض", required: true },
    { key: "visit_date", label: "التاريخ", type: "date", required: true },
    {
      key: "visit_type",
      label: "نوع الزيارة",
      options: ["كشف", "متابعة", "استشارة"],
    },
    { key: "complaint", label: "الشكوى", wide: true },
    { key: "diagnosis", label: "التشخيص", type: "textarea", wide: true },
    { key: "treatment", label: "العلاج والخطة", type: "textarea", wide: true },
    { key: "paid", label: "المدفوع", type: "number" },
    { key: "due", label: "المتبقي", type: "number" },
  ],
  prescriptions: [
    { key: "patient_name", label: "اسم المريض", required: true },
    { key: "patient_age", label: "السن", type: "number" },
    {
      key: "prescription_date",
      label: "التاريخ",
      type: "date",
      required: true,
    },
    { key: "diagnosis", label: "التشخيص", wide: true },
    {
      key: "medicines",
      label: "الأدوية والجرعات",
      type: "textarea",
      required: true,
      wide: true,
    },
    {
      key: "notes",
      label: "التعليمات والملاحظات",
      type: "textarea",
      wide: true,
    },
  ],
  invoices: [
    { key: "patient_name", label: "اسم المريض", required: true },
    { key: "invoice_date", label: "التاريخ", type: "date", required: true },
    { key: "service", label: "الخدمة", required: true, wide: true },
    { key: "total", label: "الإجمالي", type: "number" },
    { key: "paid", label: "المدفوع", type: "number" },
    { key: "notes", label: "ملاحظات", type: "textarea", wide: true },
  ],
  reports: [
    { key: "patient_name", label: "اسم المريض", required: true },
    { key: "report_date", label: "التاريخ", type: "date", required: true },
    { key: "title", label: "عنوان التقرير", required: true, wide: true },
    {
      key: "report_body",
      label: "نص التقرير الطبي",
      type: "textarea",
      required: true,
      wide: true,
    },
  ],
  inventory: [
    { key: "item_name", label: "اسم الصنف", required: true },
    { key: "quantity", label: "الكمية", type: "number" },
    { key: "unit", label: "الوحدة" },
    { key: "low_stock_threshold", label: "حد التنبيه", type: "number" },
    { key: "notes", label: "ملاحظات", type: "textarea", wide: true },
  ],
};

const columns: Record<DataModule, string[]> = {
  patients: ["full_name", "age", "phone", "diagnosis"],
  appointments: [
    "patient_name",
    "appointment_date",
    "appointment_time",
    "visit_type",
    "status",
  ],
  visits: [
    "patient_name",
    "visit_date",
    "visit_type",
    "diagnosis",
    "paid",
    "due",
  ],
  prescriptions: [
    "patient_name",
    "prescription_date",
    "diagnosis",
    "medicines",
  ],
  invoices: ["patient_name", "invoice_date", "service", "total", "paid"],
  reports: ["patient_name", "report_date", "title", "report_body"],
  inventory: ["item_name", "quantity", "unit", "low_stock_threshold"],
};

const labels: Record<string, string> = Object.fromEntries(
  Object.values(fields)
    .flat()
    .map((field) => [field.key, field.label]),
);
const actions: { key: ActionKey; label: string }[] = [
  { key: "can_view", label: "مشاهدة" },
  { key: "can_add", label: "إضافة" },
  { key: "can_edit", label: "تعديل" },
  { key: "can_delete", label: "حذف" },
  { key: "can_print", label: "طباعة" },
];
const today = new Date().toISOString().slice(0, 10);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(true);
  const [session, setSession] = useState<ClinicSession | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    void bootstrap();
    const { data } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) setSession(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function bootstrap() {
    const { data: init } = await supabase.rpc("system_initialized");
    setInitialized(Boolean(init));
    const { data: auth } = await supabase.auth.getSession();
    if (auth.session?.user) await loadUser(auth.session.user.id);
    setLoading(false);
  }

  async function loadUser(userId: string) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !profile?.active) {
      await supabase.auth.signOut();
      setSession(null);
      return;
    }
    const { data: permissions } = await supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId);
    setSession({ profile, permissions: (permissions || []) as Permission[] });
  }

  if (!isConfigured) return <SetupMissing />;
  if (loading) return <Splash />;
  if (!session)
    return (
      <AuthScreen
        initialized={initialized}
        onLogin={async (id) => {
          await loadUser(id);
          setInitialized(true);
        }}
      />
    );
  return (
    <ClinicSystem
      session={session}
      onLogout={async () => {
        await supabase.auth.signOut();
        setSession(null);
      }}
    />
  );
}

function AuthScreen({
  initialized,
  onLogin,
}: {
  initialized: boolean;
  onLogin: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState(initialized ? "login" : "setup");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") || "");
    try {
      if (!validUsername(username))
        throw new Error(
          "اسم المستخدم يجب أن يكون بالإنجليزية من 3 إلى 30 حرفًا",
        );
      if (mode === "setup") {
        const { error: setupError } = await supabase.functions.invoke(
          "create-user",
          {
            body: {
              action: "bootstrap",
              username,
              password,
              full_name: String(form.get("full_name") || "مدير النظام"),
            },
          },
        );
        if (setupError) throw setupError;
      }
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: usernameToEmail(username),
          password,
        });
      if (loginError || !data.user)
        throw loginError || new Error("تعذر تسجيل الدخول");
      await onLogin(data.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand-mark">+</div>
        <p className="eyebrow">HSM CLINIC SYSTEM</p>
        <h1>{mode === "setup" ? "إنشاء المستخدم الأساسي" : "دخول البرنامج"}</h1>
        <p className="muted">
          {mode === "setup"
            ? "هذا الحساب سيكون مدير النظام وصاحب كل الصلاحيات."
            : "اكتب اسم المستخدم وكلمة المرور."}
        </p>
        <form onSubmit={submit} className="stack">
          {mode === "setup" && (
            <FieldInput name="full_name" label="اسم مدير النظام" required />
          )}
          <FieldInput
            name="username"
            label="اسم المستخدم بالإنجليزية"
            required
          />
          <FieldInput
            name="password"
            label="كلمة المرور"
            type="password"
            required
          />
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn" disabled={busy}>
            {busy
              ? "جارٍ التنفيذ..."
              : mode === "setup"
                ? "إنشاء المستخدم الأساسي"
                : "دخول"}
          </button>
        </form>
        {!initialized && (
          <button
            className="text-btn"
            onClick={() => setMode(mode === "setup" ? "login" : "setup")}
          >
            {mode === "setup" ? "لدي حساب بالفعل" : "إنشاء المستخدم الأساسي"}
          </button>
        )}
      </div>
    </div>
  );
}

function ClinicSystem({
  session,
  onLogout,
}: {
  session: ClinicSession;
  onLogout: () => void;
}) {
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [rows, setRows] = useState<ClinicRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClinicRow | null | undefined>(
    undefined,
  );
  const [printRow, setPrintRow] = useState<{
    module: DataModule;
    row: ClinicRow;
    prescriptionMode?: PrescriptionPrintMode;
  } | null>(null);
  const [prescriptionPrintRow, setPrescriptionPrintRow] =
    useState<ClinicRow | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicRow | null>(null);
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    income: 0,
    due: 0,
    lowStock: 0,
  });
  const isAdmin = session.profile.role === "admin";
  const allowed = (module: ModuleKey, action: ActionKey = "can_view") =>
    isAdmin ||
    Boolean(session.permissions.find((p) => p.module === module)?.[action]);
  const visibleModules = modules.filter((item) => allowed(item.key));

  useEffect(() => {
    if (!allowed(active)) setActive(visibleModules[0]?.key || "dashboard");
    void supabase
      .from("clinic_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => setClinicSettings(data as ClinicRow));
  }, [session]);
  useEffect(() => {
    setQuery("");
    setRows([]);
    if (active === "dashboard") void loadStats();
    else if (active in tables) void loadRows(active as DataModule);
  }, [active]);

  async function loadStats() {
    setBusy(true);
    const [p, a, i, stock] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", today),
      supabase.from("invoices").select("paid,total"),
      supabase.from("inventory").select("quantity,low_stock_threshold"),
    ]);
    const invoices = i.data || [];
    setStats({
      patients: p.count || 0,
      appointments: a.count || 0,
      income: invoices.reduce((s, r) => s + Number(r.paid || 0), 0),
      due: invoices.reduce(
        (s, r) => s + Math.max(0, Number(r.total || 0) - Number(r.paid || 0)),
        0,
      ),
      lowStock: (stock.data || []).filter(
        (r) => r.quantity <= r.low_stock_threshold,
      ).length,
    });
    setBusy(false);
  }

  async function loadRows(module: DataModule) {
    setBusy(true);
    const { data, error } = await supabase
      .from(tables[module])
      .select("*")
      .order("created_at", { ascending: false });
    if (error) alert(error.message);
    setRows((data || []) as ClinicRow[]);
    setBusy(false);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(active in tables)) return;
    const module = active as DataModule;
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    fields[module].forEach((field) => {
      const value = form.get(field.key);
      payload[field.key] = field.type === "number" ? Number(value || 0) : value;
    });
    if (
      module === "prescriptions" &&
      !String(payload.medicines || "").trim()
    ) {
      alert("أضف دواء واحدًا على الأقل إلى الروشتة");
      return;
    }
    setBusy(true);
    const response = editing
      ? await supabase.from(tables[module]).update(payload).eq("id", editing.id)
      : await supabase
          .from(tables[module])
          .insert({ ...payload, created_by: session.profile.id });
    if (response.error) alert(response.error.message);
    else {
      await logAction(editing ? "edit" : "add", module, editing?.id);
      setEditing(undefined);
      await loadRows(module);
    }
    setBusy(false);
  }

  async function deleteRecord(module: DataModule, row: ClinicRow) {
    if (!confirm("هل تريد حذف هذا السجل؟")) return;
    const { error } = await supabase
      .from(tables[module])
      .delete()
      .eq("id", row.id);
    if (error) alert(error.message);
    else {
      await logAction("delete", module, row.id);
      await loadRows(module);
    }
  }
  async function logAction(action: string, module: string, recordId?: string) {
    await supabase
      .from("audit_logs")
      .insert({
        user_id: session.profile.id,
        username: session.profile.username,
        action,
        module,
        record_id: recordId || null,
      });
  }
  function print(module: DataModule, row: ClinicRow) {
    if (module === "prescriptions") {
      setPrescriptionPrintRow(row);
      return;
    }
    startPrint(module, row);
  }
  function startPrint(
    module: DataModule,
    row: ClinicRow,
    prescriptionMode?: PrescriptionPrintMode,
  ) {
    setPrescriptionPrintRow(null);
    setPrintRow({ module, row, prescriptionMode });
    setTimeout(() => window.print(), 120);
  }
  async function backup() {
    setBusy(true);
    const result: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
    };
    for (const [module, table] of Object.entries(tables)) {
      const { data } = await supabase.from(table).select("*");
      result[module] = data || [];
    }
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("*");
    result.settings = settings || [];
    const { data: medicineCatalog } = await supabase
      .from("medicine_catalog")
      .select("*");
    result.medicine_catalog = medicineCatalog || [];
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HSM-Clinic-Backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  const filtered = useMemo(
    () =>
      query
        ? rows.filter((row) =>
            Object.values(row).some((v) =>
              String(v ?? "")
                .toLowerCase()
                .includes(query.toLowerCase()),
            ),
          )
        : rows,
    [rows, query],
  );
  const title = modules.find((m) => m.key === active)?.label || "";
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark small">+</div>
          <div>
            <strong>HSM Clinic</strong>
            <span>{session.profile.full_name}</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebar(false)}>
            <X />
          </button>
        </div>
        <nav>
          {visibleModules.map((item) => (
            <button
              key={item.key}
              className={active === item.key ? "active" : ""}
              onClick={() => {
                setActive(item.key);
                setSidebar(false);
              }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="logout" onClick={onLogout}>
          <LogOut />
          خروج
        </button>
      </aside>
      <div className="main">
        <header>
          <button className="menu-btn" onClick={() => setSidebar(true)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">HSM CLINIC SYSTEM</p>
            <h1>{title}</h1>
          </div>
          {active in tables && allowed(active, "can_add") && (
            <button
              className="primary-btn compact"
              onClick={() => setEditing(null)}
            >
              <Plus />
              إضافة
            </button>
          )}
        </header>
        <main>
          {active === "dashboard" ? (
            <Dashboard stats={stats} busy={busy} />
          ) : active in tables ? (
            <Records
              module={active as DataModule}
              rows={filtered}
              query={query}
              setQuery={setQuery}
              busy={busy}
              allowed={allowed}
              onEdit={(r) => setEditing(r)}
              onDelete={deleteRecord}
              onPrint={print}
            />
          ) : active === "users" ? (
            <UsersAdmin current={session.profile} />
          ) : active === "backup" ? (
            <Backup busy={busy} onBackup={backup} />
          ) : (
            <SettingsPage onSaved={(value) => setClinicSettings(value)} />
          )}
        </main>
      </div>
      {editing !== undefined && active in tables && (
        <RecordModal
          module={active as DataModule}
          row={editing}
          busy={busy}
          onClose={() => setEditing(undefined)}
          onSubmit={saveRecord}
        />
      )}{" "}
      {prescriptionPrintRow && (
        <PrescriptionPrintOptions
          onClose={() => setPrescriptionPrintRow(null)}
          onSelect={(mode) =>
            startPrint("prescriptions", prescriptionPrintRow, mode)
          }
        />
      )}
      {printRow && (
        <PrintDocument target={printRow} settings={clinicSettings} />
      )}
    </div>
  );
}

function PrescriptionPrintOptions({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (mode: PrescriptionPrintMode) => void;
}) {
  return (
    <div className="modal-backdrop print-options-backdrop">
      <div className="modal print-options-modal">
        <div className="modal-head">
          <div>
            <h2>اختر طريقة طباعة الروشتة</h2>
            <p>يمكنك الطباعة مباشرة أو اختيار حفظ كملف PDF من نافذة الطباعة.</p>
          </div>
          <button onClick={onClose} title="إغلاق">
            <X />
          </button>
        </div>
        <div className="print-options-grid">
          <button
            className="print-option-card"
            onClick={() => onSelect("data-only")}
          >
            <Printer />
            <strong>بيانات فقط</strong>
            <span>للطباعة فوق ورق الروشتة الجاهز والمطبوع مسبقًا.</span>
          </button>
          <button
            className="print-option-card full"
            onClick={() => onSelect("full-design")}
          >
            <FileHeart />
            <strong>روشتة كاملة باللوجو</strong>
            <span>لطباعة التصميم كاملًا أو حفظه PDF باللوجو والتفاصيل.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  stats,
  busy,
}: {
  stats: {
    patients: number;
    appointments: number;
    income: number;
    due: number;
    lowStock: number;
  };
  busy: boolean;
}) {
  const cards = [
    ["إجمالي المرضى", stats.patients, UsersRound],
    ["مواعيد اليوم", stats.appointments, CalendarDays],
    ["المحصل", `${stats.income} ج.م`, ReceiptText],
    ["المتبقي", `${stats.due} ج.م`, FileHeart],
    ["تنبيهات المخزون", stats.lowStock, Package],
  ] as const;
  return (
    <div className="cards">
      {cards.map(([label, value, Icon]) => (
        <div className="metric" key={label}>
          <div>
            <span>{label}</span>
            <strong>{busy ? "..." : value}</strong>
          </div>
          <Icon />
        </div>
      ))}
    </div>
  );
}

function Records({
  module,
  rows,
  query,
  setQuery,
  busy,
  allowed,
  onEdit,
  onDelete,
  onPrint,
}: {
  module: DataModule;
  rows: ClinicRow[];
  query: string;
  setQuery: (v: string) => void;
  busy: boolean;
  allowed: (m: ModuleKey, a?: ActionKey) => boolean;
  onEdit: (r: ClinicRow) => void;
  onDelete: (m: DataModule, r: ClinicRow) => void;
  onPrint: (m: DataModule, r: ClinicRow) => void;
}) {
  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            placeholder="بحث..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span>{rows.length} سجل</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns[module].map((c) => (
                <th key={c}>{labels[c] || c}</th>
              ))}
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <tr>
                <td colSpan={columns[module].length + 1}>جارٍ التحميل...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns[module].length + 1}>لا توجد بيانات</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns[module].map((c) => (
                    <td key={c} title={String(row[c] ?? "")}>
                      {String(row[c] ?? "—")}
                    </td>
                  ))}
                  <td className="actions">
                    {allowed(module, "can_edit") && (
                      <button onClick={() => onEdit(row)} title="تعديل">
                        <Pencil />
                      </button>
                    )}
                    {allowed(module, "can_print") &&
                      ["prescriptions", "invoices", "reports"].includes(
                        module,
                      ) && (
                        <button
                          onClick={() => onPrint(module, row)}
                          title="طباعة"
                        >
                          <Printer />
                        </button>
                      )}
                    {allowed(module, "can_delete") && (
                      <button
                        className="danger"
                        onClick={() => onDelete(module, row)}
                        title="حذف"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecordModal({
  module,
  row,
  busy,
  onClose,
  onSubmit,
}: {
  module: DataModule;
  row: ClinicRow | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2>
            {row ? "تعديل" : "إضافة"}{" "}
            {modules.find((m) => m.key === module)?.label}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={onSubmit} className="form-grid">
          {fields[module].map((field) => (
            <div className={field.wide ? "wide" : ""} key={field.key}>
              <label>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              {module === "prescriptions" && field.key === "medicines" ? (
                <MedicineCatalogField
                  initialValue={String(row?.medicines || "")}
                />
              ) : field.options ? (
                <select
                  name={field.key}
                  defaultValue={String(row?.[field.key] ?? field.options[0])}
                >
                  {field.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.key}
                  required={field.required}
                  defaultValue={String(row?.[field.key] ?? "")}
                />
              ) : (
                <input
                  name={field.key}
                  type={field.type || "text"}
                  required={field.required}
                  defaultValue={String(
                    row?.[field.key] ?? (field.type === "date" ? today : ""),
                  )}
                />
              )}
            </div>
          ))}
          <div className="modal-actions wide">
            <button type="button" className="secondary-btn" onClick={onClose}>
              إلغاء
            </button>
            <button className="primary-btn" disabled={busy}>
              {busy ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MedicineCatalogField({ initialValue }: { initialValue: string }) {
  const [catalog, setCatalog] = useState<MedicineEntry[]>([]);
  const [customCatalog, setCustomCatalog] = useState<MedicineEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PrescriptionMedicine[]>(() =>
    initialValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const divider = line.indexOf(" — ");
        return divider === -1
          ? { name: line, usage: "" }
          : {
              name: line.slice(0, divider).trim(),
              usage: line.slice(divider + 3).trim(),
            };
      }),
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/egyptian-drugs.min.json`).then(
        (response) => {
          if (!response.ok) throw new Error("تعذر تحميل قائمة الأدوية");
          return response.json() as Promise<MedicineEntry[]>;
        },
      ),
      supabase
        .from("medicine_catalog")
        .select("trade_name,generic_name")
        .order("trade_name"),
    ])
      .then(([base, custom]) => {
        if (!active) return;
        setCatalog(base);
        setCustomCatalog(
          (custom.data || []).map((medicine) => ({
            n: medicine.trade_name,
            s: medicine.generic_name || "",
            custom: true,
          })),
        );
      })
      .catch(async () => {
        if (!active) return;
        try {
          const response = await fetch(
            `${import.meta.env.BASE_URL}data/egyptian-drugs.min.json`,
          );
          setCatalog((await response.json()) as MedicineEntry[]);
        } catch {
          setCatalog([]);
        }
      })
      .finally(() => active && setCatalogLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle.length < 2) return [];
    const found: MedicineEntry[] = [];
    const seen = new Set<string>();
    for (const medicine of [...customCatalog, ...catalog]) {
      const searchable = `${medicine.n} ${medicine.a || ""} ${medicine.s || ""}`.toLocaleLowerCase();
      if (!searchable.includes(needle)) continue;
      const key = medicine.n.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(medicine);
      if (found.length === 12) break;
    }
    return found;
  }, [catalog, customCatalog, query]);

  function addMedicine(medicine: MedicineEntry) {
    const displayName = medicine.a
      ? `${medicine.n} (${medicine.a})`
      : medicine.n;
    setItems((current) => [
      ...current,
      { name: displayName, usage: "" },
    ]);
    setQuery("");
  }

  async function addManualMedicine() {
    const tradeName = query.trim();
    if (!tradeName) return;
    if (
      items.some(
        (item) => item.name.toLocaleLowerCase() === tradeName.toLocaleLowerCase(),
      )
    ) {
      setQuery("");
      return;
    }
    setItems((current) => [...current, { name: tradeName, usage: "" }]);
    setCustomCatalog((current) => [
      { n: tradeName, custom: true },
      ...current,
    ]);
    setQuery("");
    await supabase.from("medicine_catalog").upsert(
      {
        trade_name: tradeName,
        generic_name: "",
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      },
      { onConflict: "trade_name" },
    );
  }

  const serialized = items
    .map((item) =>
      item.usage.trim()
        ? `${item.name.trim()} — ${item.usage.trim()}`
        : item.name.trim(),
    )
    .filter(Boolean)
    .join("\n");

  return (
    <div className="medicine-picker">
      <input type="hidden" name="medicines" value={serialized} />
      <div className="medicine-search-box">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            catalogLoading
              ? "جارٍ تحميل قائمة الأدوية..."
              : "ابحث باسم الدواء بالعربي أو الإنجليزي أو المادة الفعالة"
          }
          disabled={catalogLoading}
        />
      </div>
      {query.trim().length >= 2 && (
        <div className="medicine-results">
          {results.map((medicine) => (
            <button
              type="button"
              key={`${medicine.n}-${medicine.a || ""}`}
              onClick={() => addMedicine(medicine)}
            >
              <strong>{medicine.n}</strong>
              {medicine.a && <span>{medicine.a}</span>}
              {medicine.s && <small>{medicine.s}</small>}
            </button>
          ))}
          <button
            type="button"
            className="add-manual-medicine"
            onClick={addManualMedicine}
          >
            <Plus />
            إضافة «{query.trim()}» يدويًا وحفظه في قائمة العيادة
          </button>
        </div>
      )}
      <div className="selected-medicines">
        {items.length === 0 ? (
          <p>ابحث عن الدواء ثم اضغط عليه لإضافته إلى الروشتة.</p>
        ) : (
          items.map((item, index) => (
            <div className="selected-medicine-row" key={`${item.name}-${index}`}>
              <div>
                <span>{index + 1}</span>
                <strong>{item.name}</strong>
              </div>
              <input
                value={item.usage}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((medicine, medicineIndex) =>
                      medicineIndex === index
                        ? { ...medicine, usage: event.target.value }
                        : medicine,
                    ),
                  )
                }
                placeholder="الجرعة وطريقة الاستخدام — يكتبها الطبيب"
              />
              <button
                type="button"
                className="remove-medicine"
                title="حذف الدواء من الروشتة"
                onClick={() =>
                  setItems((current) =>
                    current.filter((_, medicineIndex) => medicineIndex !== index),
                  )
                }
              >
                <Trash2 />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UsersAdmin({ current }: { current: Profile }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [create, setCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void load();
  }, []);
  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at");
    setUsers((data || []) as Profile[]);
  }
  async function pick(user: Profile) {
    setSelected(user);
    const { data } = await supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", user.id);
    setPerms(normalizePermissions((data || []) as Permission[]));
  }
  async function savePermissions() {
    if (!selected) return;
    setBusy(true);
    const rows = perms.map((p) => ({ ...p, user_id: selected.id }));
    const { error } = await supabase
      .from("user_permissions")
      .upsert(rows, { onConflict: "user_id,module" });
    if (error) alert(error.message);
    else alert("تم حفظ الصلاحيات");
    setBusy(false);
  }
  async function toggle(user: Profile) {
    const { error } = await supabase.functions.invoke("create-user", {
      body: { action: "set_active", user_id: user.id, active: !user.active },
    });
    if (error) alert(error.message);
    await load();
  }
  return (
    <div className="user-grid">
      <section className="panel">
        <div className="toolbar">
          <h2>المستخدمون</h2>
          <button
            className="primary-btn compact"
            onClick={() => setCreate(true)}
          >
            <Plus />
            مستخدم جديد
          </button>
        </div>
        {users.map((u) => (
          <button
            className={`user-row ${selected?.id === u.id ? "selected" : ""}`}
            key={u.id}
            onClick={() => void pick(u)}
          >
            <div>
              <strong>{u.full_name}</strong>
              <span>
                {u.username} • {u.role}
              </span>
            </div>
            <em className={u.active ? "ok" : "off"}>
              {u.active ? "نشط" : "موقوف"}
            </em>
            {u.id !== current.id && (
              <span
                className="toggle-link"
                onClick={(e) => {
                  e.stopPropagation();
                  void toggle(u);
                }}
              >
                {u.active ? "إيقاف" : "تفعيل"}
              </span>
            )}
          </button>
        ))}
      </section>
      <section className="panel permissions">
        {selected ? (
          <>
            <h2>صلاحيات {selected.full_name}</h2>
            <PermissionMatrix permissions={perms} onChange={setPerms} />
            <button
              className="primary-btn"
              onClick={() => void savePermissions()}
              disabled={busy}
            >
              حفظ الصلاحيات
            </button>
          </>
        ) : (
          <div className="empty">اختر مستخدمًا لتعديل صلاحياته</div>
        )}
      </section>
      {create && (
        <CreateUser
          onClose={() => setCreate(false)}
          onCreated={async () => {
            setCreate(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function normalizePermissions(current: Permission[]) {
  return modules.map(
    (m) =>
      current.find((p) => p.module === m.key) || {
        module: m.key,
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_print: false,
      },
  );
}
function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: Permission[];
  onChange: (p: Permission[]) => void;
}) {
  function toggle(module: ModuleKey, action: ActionKey) {
    onChange(
      permissions.map((p) =>
        p.module === module ? { ...p, [action]: !p[action] } : p,
      ),
    );
  }
  return (
    <div className="permission-table">
      <div className="perm-row head">
        <b>القسم</b>
        {actions.map((a) => (
          <b key={a.key}>{a.label}</b>
        ))}
      </div>
      {permissions.map((p) => (
        <div className="perm-row" key={p.module}>
          <strong>{modules.find((m) => m.key === p.module)?.label}</strong>
          {actions.map((a) => (
            <input
              key={a.key}
              type="checkbox"
              checked={p[a.key]}
              onChange={() => toggle(p.module, a.key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CreateUser({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [permissions, setPermissions] = useState<Permission[]>(
    normalizePermissions([]),
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.functions.invoke("create-user", {
      body: {
        full_name: f.get("full_name"),
        username: f.get("username"),
        password: f.get("password"),
        role: f.get("role"),
        permissions,
      },
    });
    if (error) alert(error.message);
    else onCreated();
    setBusy(false);
  }
  return (
    <div className="modal-backdrop">
      <div className="modal large">
        <div className="modal-head">
          <h2>إضافة مستخدم جديد</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={submit} className="stack">
          <div className="form-grid">
            <FieldInput name="full_name" label="الاسم" required />
            <FieldInput
              name="username"
              label="اسم الدخول بالإنجليزية"
              required
            />
            <FieldInput
              name="password"
              label="كلمة المرور"
              type="password"
              required
            />
            <div>
              <label>الدور</label>
              <select name="role">
                <option value="doctor">طبيب</option>
                <option value="reception">استقبال</option>
                <option value="accountant">محاسب</option>
                <option value="nurse">تمريض</option>
                <option value="viewer">مشاهدة فقط</option>
              </select>
            </div>
          </div>
          <PermissionMatrix
            permissions={permissions}
            onChange={setPermissions}
          />
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              إلغاء
            </button>
            <button className="primary-btn" disabled={busy}>
              {busy ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Backup({ busy, onBackup }: { busy: boolean; onBackup: () => void }) {
  return (
    <section className="backup-card">
      <ArchiveRestore />
      <h2>نسخة احتياطية كاملة</h2>
      <p>
        البيانات محفوظة أونلاين على Supabase. نزّل نسخة JSON إضافية واحفظها في
        Google Drive.
      </p>
      <button className="primary-btn" onClick={onBackup} disabled={busy}>
        {busy ? "جارٍ التجهيز..." : "تنزيل النسخة الآن"}
      </button>
    </section>
  );
}

function SettingsPage({ onSaved }: { onSaved: (row: ClinicRow) => void }) {
  const [row, setRow] = useState<ClinicRow | null>(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    supabase
      .from("clinic_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        setRow(data as ClinicRow);
        setBusy(false);
      });
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!row) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(f.entries());
    payload.prescription_font_size = Number(
      payload.prescription_font_size || 16,
    );
    payload.prescription_offset_x_mm = Number(
      payload.prescription_offset_x_mm || 0,
    );
    payload.prescription_offset_y_mm = Number(
      payload.prescription_offset_y_mm || 0,
    );
    const { data, error } = await supabase
      .from("clinic_settings")
      .update(payload)
      .eq("id", row.id)
      .select()
      .single();
    if (error) alert(error.message);
    else {
      setRow(data as ClinicRow);
      onSaved(data as ClinicRow);
      alert("تم حفظ إعدادات العيادة والروشتة");
    }
    setBusy(false);
  }
  if (!row) return <div className="panel">جارٍ التحميل...</div>;
  return (
    <section className="panel settings-panel">
      <h2>بيانات العيادة وضبط طباعة الروشتة</h2>
      <p className="settings-note">
        عند الضغط على طباعة يمكنك اختيار بيانات فقط للورق المطبوع مسبقًا، أو
        روشتة كاملة باللوجو والتفاصيل للطباعة أو الحفظ PDF. استخدم الإزاحة لضبط
        اختلاف سحب الورق بين الطابعات.
      </p>
      <form onSubmit={save} className="form-grid">
        <FieldInput
          name="clinic_name"
          label="اسم العيادة"
          defaultValue={String(row.clinic_name || "")}
        />
        <FieldInput
          name="doctor_name"
          label="اسم الطبيب في الروشتة"
          defaultValue={String(row.doctor_name || "")}
        />
        <FieldInput
          name="doctor_title"
          label="اللقب"
          defaultValue={String(row.doctor_title || "")}
        />
        <FieldInput
          name="specialty"
          label="التخصص في الروشتة"
          defaultValue={String(row.specialty || "")}
        />
        <FieldInput
          name="service_one"
          label="الخدمة الأولى"
          defaultValue={String(row.service_one || "")}
        />
        <FieldInput
          name="service_two"
          label="الخدمة الثانية"
          defaultValue={String(row.service_two || "")}
        />
        <FieldInput
          name="phone"
          label="رقم الهاتف الأول"
          defaultValue={String(row.phone || "")}
        />
        <FieldInput
          name="phone_secondary"
          label="رقم الهاتف الثاني"
          defaultValue={String(row.phone_secondary || "")}
        />
        <FieldInput
          name="address"
          label="العنوان أسفل الروشتة"
          defaultValue={String(row.address || "")}
        />
        <FieldInput
          name="consultation_note"
          label="ملاحظة الاستشارة"
          defaultValue={String(row.consultation_note || "")}
        />
        <FieldInput
          name="clinic_hours"
          label="مواعيد العمل"
          defaultValue={String(row.clinic_hours || "")}
        />
        <FieldInput
          name="currency"
          label="العملة"
          defaultValue={String(row.currency || "")}
        />
        <FieldInput
          name="prescription_font_size"
          label="حجم خط الأدوية"
          type="number"
          defaultValue={String(row.prescription_font_size || 16)}
        />
        <FieldInput
          name="prescription_offset_x_mm"
          label="إزاحة الطباعة أفقيًا بالمليمتر (+ يمين / - يسار)"
          type="number"
          defaultValue={String(row.prescription_offset_x_mm || 0)}
        />
        <FieldInput
          name="prescription_offset_y_mm"
          label="إزاحة الطباعة رأسيًا بالمليمتر (+ أسفل / - أعلى)"
          type="number"
          defaultValue={String(row.prescription_offset_y_mm || 0)}
        />
        <div>
          <label>لون كتابة الروشتة</label>
          <input
            name="prescription_text_color"
            type="color"
            defaultValue={String(row.prescription_text_color || "#10233b")}
          />
        </div>
        <button className="primary-btn" disabled={busy}>
          حفظ الإعدادات
        </button>
      </form>
    </section>
  );
}

function PrintDocument({
  target,
  settings,
}: {
  target: {
    module: DataModule;
    row: ClinicRow;
    prescriptionMode?: PrescriptionPrintMode;
  };
  settings: ClinicRow | null;
}) {
  if (target.module === "prescriptions")
    return (
      <article
        className="print-doc a5 prescription-a5"
        style={{
          color: String(settings?.prescription_text_color || "#10233b"),
        }}
      >
        {target.prescriptionMode === "full-design" && (
          <img
            className="rx-template"
            src="/prescription-template-a5.jpg"
            alt=""
            aria-hidden="true"
          />
        )}
        <div
          className="rx-print-layer"
          style={{
            transform: `translate(${Number(settings?.prescription_offset_x_mm || 0)}mm, ${Number(settings?.prescription_offset_y_mm || 0)}mm)`,
          }}
        >
          <div className="rx-patient">
            {String(target.row.patient_name || "")}
          </div>
          <div className="rx-date">
            {formatPrintDate(String(target.row.prescription_date || today))}
          </div>
          <div className="rx-age">{String(target.row.patient_age || "")}</div>
          <div
            className="rx-medicines"
            style={{
              fontSize: `${Number(settings?.prescription_font_size || 16)}px`,
            }}
          >
            {String(target.row.medicines || "")}
          </div>
          <div className="rx-consultation">{String(target.row.notes || "")}</div>
        </div>
      </article>
    );
  return (
    <article className="print-doc a4">
      <header>
        <div>
          <h1>{String(settings?.clinic_name || "HSM Clinic")}</h1>
          <p>{String(settings?.specialty || "العيادة الطبية")}</p>
        </div>
        <div className="brand-mark small">+</div>
      </header>
      <h2>{modules.find((m) => m.key === target.module)?.label}</h2>
      {fields[target.module].map((f) => (
        <div className="print-line" key={f.key}>
          <strong>{f.label}</strong>
          <span>{String(target.row[f.key] ?? "—")}</span>
        </div>
      ))}
      <footer>
        {String(settings?.address || "")} - {String(settings?.phone || "")}
      </footer>
    </article>
  );
}

function formatPrintDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]} / ${match[2]} / ${match[1]}` : value;
}

function FieldInput({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
      />
    </div>
  );
}
function SetupMissing() {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand-mark">+</div>
        <h1>البرنامج جاهز للربط</h1>
        <p className="muted">
          أضف رابط Supabase والمفتاح في ملف البيئة، ثم أعد تشغيل البرنامج. ستجد
          الخطوات داخل ملف التعليمات.
        </p>
      </div>
    </div>
  );
}
function Splash() {
  return (
    <div className="splash">
      <div className="brand-mark">+</div>
      <p>جارٍ تشغيل HSM Clinic...</p>
    </div>
  );
}
