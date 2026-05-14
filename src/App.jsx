import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "hsm_clinic_system_v3";

const defaultData = {
  settings: {
    clinicName: "H$M",
    systemName: "H$M لإدارة العيادات الطبية",
    doctorName: "وليد صلاح",
    doctorPrefix: "د.",
    specialty: "استشاري القلب والباطنة وقسطرة القلب",
    phone: "01000000000",
    address: "اكتب عنوان العيادة هنا",
    clinicHours: "المواعيد يوميًا من 5 مساءً حتى 10 مساءً عدا الجمعة",
    slogan: "لإدارة العيادات الطبية",
    currency: "ج",
    backupEmail: "your-email@gmail.com",
    appsScriptUrl: "",
    rxLogoText: "مكان اللوجو",
    serviceOne: "أشعة إيكو على القلب",
    serviceTwo: "رسم قلب",
  },

  users: [
    {
      id: 1,
      name: "مدير النظام",
      username: "admin",
      password: "1234",
      role: "مدير النظام",
      protected: true,
    },
  ],

  patients: [
    {
      id: 1,
      name: "أحمد محمد",
      age: "42",
      phone: "01000000000",
      specialty: "باطنة",
      diagnosis: "ارتفاع ضغط الدم",
      history: "لا يوجد حساسية مسجلة",
      createdAt: "2026-05-05",
    },
  ],

  appointments: [
    {
      id: 1,
      patientName: "أحمد محمد",
      date: "2026-05-05",
      time: "10:30 ص",
      visitType: "كشف",
      status: "منتظر",
    },
  ],

  prescriptions: [
    {
      id: 1,
      patientName: "أحمد محمد",
      age: "42",
      doctorName: "وليد صلاح",
      diagnosis: "ارتفاع ضغط الدم",
      medicines:
        "Amlodipine 5mg\nقرص مرة يوميًا بعد الأكل\n\nمتابعة الضغط يوميًا لمدة أسبوعين",
      notes: "تقليل الملح — مراجعة بعد أسبوعين",
      date: "2026-05-05",
    },
  ],

  visits: [
    {
      id: 1,
      patientName: "أحمد محمد",
      date: "2026-05-05",
      visitType: "كشف",
      diagnosis: "ارتفاع ضغط الدم",
      paid: "250",
      remaining: "0",
    },
  ],

  invoices: [
    {
      id: 1,
      patientName: "أحمد محمد",
      service: "كشف باطنة",
      amount: "250",
      paid: "250",
      remaining: "0",
      status: "مدفوعة",
      date: "2026-05-05",
    },
  ],

  reports: [
    {
      id: 1,
      patientName: "أحمد محمد",
      title: "تقرير متابعة",
      body: "المريض بحالة مستقرة وينصح بالمتابعة الدورية.",
      date: "2026-05-05",
    },
  ],

  inventory: [
    {
      id: 1,
      itemName: "ورق روشتة A4",
      quantity: "100",
      unit: "ورقة",
      alertLimit: "20",
    },
  ],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 999);
}

function normalizeData(rawData) {
  const merged = {
    ...defaultData,
    ...rawData,
    settings: {
      ...defaultData.settings,
      ...(rawData?.settings || {}),
    },
    users: rawData?.users?.length ? rawData.users : defaultData.users,
  };

  const hasAdmin = merged.users.some((u) => u.username === "admin");

  if (!hasAdmin) {
    merged.users = [defaultData.users[0], ...merged.users];
  }

  merged.users = merged.users.map((user) => {
    if (user.username === "admin" || user.role === "مدير النظام") {
      return {
        ...user,
        protected: true,
        role: "مدير النظام",
      };
    }

    return user;
  });

  return merged;
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeData(JSON.parse(saved)) : defaultData;
  } catch {
    return defaultData;
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [loggedUser, setLoggedUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const isSystemAdmin = loggedUser?.role === "مدير النظام";

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [patientSearch, setPatientSearch] = useState("");

  const [patientForm, setPatientForm] = useState({
    name: "",
    age: "",
    phone: "",
    specialty: "",
    diagnosis: "",
    history: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patientName: "",
    date: today(),
    time: "",
    visitType: "",
    status: "منتظر",
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: "",
    age: "",
    doctorName: "",
    diagnosis: "",
    medicines: "",
    notes: "",
    date: today(),
  });

  const [visitForm, setVisitForm] = useState({
    patientName: "",
    date: today(),
    visitType: "",
    diagnosis: "",
    paid: "",
    remaining: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    patientName: "",
    service: "",
    amount: "",
    paid: "",
    date: today(),
  });

  const [reportForm, setReportForm] = useState({
    patientName: "",
    title: "",
    body: "",
    date: today(),
  });

  const [inventoryForm, setInventoryForm] = useState({
    itemName: "",
    quantity: "",
    unit: "",
    alertLimit: "",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "1234",
    role: "طبيب",
  });

  const [settingsForm, setSettingsForm] = useState(data.settings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  function addToSection(section, item) {
    setData((prev) => ({
      ...prev,
      [section]: [{ id: makeId(), ...item }, ...prev[section]],
    }));
  }

  function deleteFromSection(section, id) {
    if (section === "users") {
      const selectedUser = data.users.find((user) => user.id === id);

      if (!isSystemAdmin) {
        alert("غير مسموح. إدارة المستخدمين متاحة لمدير النظام فقط.");
        return;
      }

      if (
        selectedUser?.protected ||
        selectedUser?.role === "مدير النظام" ||
        selectedUser?.username === "admin"
      ) {
        alert("لا يمكن حذف مدير النظام الأساسي.");
        return;
      }
    }

    if (!window.confirm("هل تريد الحذف؟")) return;

    setData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));
  }

  function login() {
    const user = data.users.find(
      (u) =>
        u.username === loginForm.username.trim() &&
        u.password === loginForm.password
    );

    if (!user) {
      alert("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }

    setLoggedUser(user);
    setLoginForm({ username: "", password: "" });
    setActivePage("dashboard");
  }

  function savePatient() {
    if (!patientForm.name.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    addToSection("patients", {
      ...patientForm,
      createdAt: today(),
    });

    setPatientForm({
      name: "",
      age: "",
      phone: "",
      specialty: "",
      diagnosis: "",
      history: "",
    });
  }

  function saveAppointment() {
    if (!appointmentForm.patientName.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    addToSection("appointments", appointmentForm);

    setAppointmentForm({
      patientName: "",
      date: today(),
      time: "",
      visitType: "",
      status: "منتظر",
    });
  }

  function savePrescription() {
    if (!prescriptionForm.patientName.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    if (!prescriptionForm.medicines.trim()) {
      alert("اكتب الأدوية والجرعات");
      return;
    }

    addToSection("prescriptions", {
      ...prescriptionForm,
      doctorName: prescriptionForm.doctorName || data.settings.doctorName,
    });

    setPrescriptionForm({
      patientName: "",
      age: "",
      doctorName: "",
      diagnosis: "",
      medicines: "",
      notes: "",
      date: today(),
    });
  }

  function saveVisit() {
    if (!visitForm.patientName.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    addToSection("visits", visitForm);

    setVisitForm({
      patientName: "",
      date: today(),
      visitType: "",
      diagnosis: "",
      paid: "",
      remaining: "",
    });
  }

  function saveInvoice() {
    if (!invoiceForm.patientName.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    const amount = Number(invoiceForm.amount || 0);
    const paid = Number(invoiceForm.paid || 0);
    const remaining = Math.max(amount - paid, 0);

    let status = "غير مدفوعة";
    if (paid >= amount && amount > 0) status = "مدفوعة";
    else if (paid > 0 && paid < amount) status = "جزئية";

    addToSection("invoices", {
      ...invoiceForm,
      remaining: String(remaining),
      status,
    });

    setInvoiceForm({
      patientName: "",
      service: "",
      amount: "",
      paid: "",
      date: today(),
    });
  }

  function saveReport() {
    if (!reportForm.patientName.trim()) {
      alert("اكتب اسم المريض");
      return;
    }

    addToSection("reports", reportForm);

    setReportForm({
      patientName: "",
      title: "",
      body: "",
      date: today(),
    });
  }

  function saveInventory() {
    if (!inventoryForm.itemName.trim()) {
      alert("اكتب اسم الصنف");
      return;
    }

    addToSection("inventory", inventoryForm);

    setInventoryForm({
      itemName: "",
      quantity: "",
      unit: "",
      alertLimit: "",
    });
  }

  function saveUser() {
    if (!isSystemAdmin) {
      alert("غير مسموح. إدارة المستخدمين متاحة لمدير النظام فقط.");
      return;
    }

    if (!userForm.name.trim() || !userForm.username.trim()) {
      alert("اكتب اسم المستخدم واسم الدخول");
      return;
    }

    if (userForm.username === "admin" || userForm.role === "مدير النظام") {
      alert("لا يمكن إنشاء مدير نظام آخر من هذه الشاشة.");
      return;
    }

    const exists = data.users.some((u) => u.username === userForm.username);

    if (exists) {
      alert("اسم الدخول مستخدم بالفعل");
      return;
    }

    addToSection("users", {
      ...userForm,
      protected: false,
    });

    setUserForm({
      name: "",
      username: "",
      password: "1234",
      role: "طبيب",
    });
  }

  function saveSettings() {
    if (!isSystemAdmin) {
      alert("الإعدادات متاحة لمدير النظام فقط.");
      return;
    }

    setData((prev) => ({
      ...prev,
      settings: settingsForm,
    }));

    alert("تم حفظ الإعدادات");
  }

  function getBackupText() {
    return JSON.stringify(
      {
        app: "H$M Clinic Management System",
        backupDate: new Date().toLocaleString("ar-EG"),
        data,
      },
      null,
      2
    );
  }

  function exportBackup() {
    if (!isSystemAdmin) {
      alert("النسخ الاحتياطي متاح لمدير النظام فقط.");
      return;
    }

    downloadTextFile(`hsm-clinic-backup-${today()}.json`, getBackupText());
  }

  function openGmailBackup() {
    if (!isSystemAdmin) {
      alert("النسخ الاحتياطي متاح لمدير النظام فقط.");
      return;
    }

    const email = data.settings.backupEmail || "";
    const subject = encodeURIComponent(`نسخة احتياطية - H$M - ${today()}`);

    const body = encodeURIComponent(
      `تم تجهيز نسخة احتياطية من برنامج H$M لإدارة العيادات الطبية.\n\n` +
        `التاريخ: ${new Date().toLocaleString("ar-EG")}\n\n` +
        `مهم: اضغط زر "تصدير نسخة JSON" من البرنامج وارفق الملف هنا في Gmail.\n\n` +
        `ملخص البيانات:\n` +
        `عدد المرضى: ${data.patients.length}\n` +
        `عدد المواعيد: ${data.appointments.length}\n` +
        `عدد الروشتات: ${data.prescriptions.length}\n` +
        `عدد الفواتير: ${data.invoices.length}\n`
    );

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        email
      )}&su=${subject}&body=${body}`,
      "_blank"
    );
  }

  async function sendBackupToAppsScript() {
    if (!isSystemAdmin) {
      alert("النسخ الاحتياطي متاح لمدير النظام فقط.");
      return;
    }

    if (!data.settings.appsScriptUrl.trim()) {
      alert("ضع رابط Google Apps Script في الإعدادات أولًا");
      return;
    }

    try {
      await fetch(data.settings.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: getBackupText(),
      });

      alert("تم إرسال طلب النسخ الاحتياطي. راجع Gmail للتأكد.");
    } catch {
      alert("حدث خطأ أثناء محاولة الإرسال.");
    }
  }

  function importBackup(file) {
    if (!isSystemAdmin) {
      alert("استيراد النسخ متاح لمدير النظام فقط.");
      return;
    }

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        const importedData = normalizeData(imported.data || imported);

        setData(importedData);
        setSettingsForm(importedData.settings || defaultData.settings);

        alert("تم استيراد النسخة بنجاح");
      } catch {
        alert("ملف النسخة غير صحيح");
      }
    };

    reader.readAsText(file);
  }

  function resetAllData() {
    if (!isSystemAdmin) {
      alert("مسح البيانات متاح لمدير النظام فقط.");
      return;
    }

    if (
      !window.confirm(
        "سيتم مسح كل البيانات والرجوع للوضع الافتراضي. هل أنت متأكد؟"
      )
    ) {
      return;
    }

    setData(defaultData);
    setSettingsForm(defaultData.settings);
    localStorage.removeItem(STORAGE_KEY);
    setLoggedUser(null);
  }

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    if (!term) return data.patients;

    return data.patients.filter((p) =>
      `${p.name} ${p.phone} ${p.specialty} ${p.diagnosis}`
        .toLowerCase()
        .includes(term)
    );
  }, [data.patients, patientSearch]);

  const stats = useMemo(() => {
    const revenue = data.invoices.reduce(
      (sum, item) => sum + Number(item.paid || 0),
      0
    );

    const due = data.invoices.reduce(
      (sum, item) => sum + Number(item.remaining || 0),
      0
    );

    const lowInventory = data.inventory.filter(
      (item) => Number(item.quantity || 0) <= Number(item.alertLimit || 0)
    ).length;

    return {
      patients: data.patients.length,
      appointments: data.appointments.length,
      prescriptions: data.prescriptions.length,
      visits: data.visits.length,
      revenue,
      due,
      lowInventory,
    };
  }, [data]);

  if (!loggedUser) {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        login={login}
        settings={data.settings}
      />
    );
  }

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">H$M</div>
          <div>
            <h2>{data.settings.systemName || "H$M"}</h2>
            <p>{loggedUser.name}</p>
          </div>
        </div>

        <MenuButton active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")}>لوحة التحكم</MenuButton>
        <MenuButton active={activePage === "patients"} onClick={() => setActivePage("patients")}>المرضى</MenuButton>
        <MenuButton active={activePage === "appointments"} onClick={() => setActivePage("appointments")}>المواعيد</MenuButton>
        <MenuButton active={activePage === "prescriptions"} onClick={() => setActivePage("prescriptions")}>الروشتات</MenuButton>
        <MenuButton active={activePage === "visits"} onClick={() => setActivePage("visits")}>الزيارات</MenuButton>
        <MenuButton active={activePage === "invoices"} onClick={() => setActivePage("invoices")}>الفواتير</MenuButton>
        <MenuButton active={activePage === "reports"} onClick={() => setActivePage("reports")}>التقارير الطبية</MenuButton>
        <MenuButton active={activePage === "inventory"} onClick={() => setActivePage("inventory")}>المخزون</MenuButton>

        {isSystemAdmin && (
          <>
            <MenuButton active={activePage === "users"} onClick={() => setActivePage("users")}>المستخدمون</MenuButton>
            <MenuButton active={activePage === "backup"} onClick={() => setActivePage("backup")}>النسخ الاحتياطي</MenuButton>
            <MenuButton active={activePage === "settings"} onClick={() => setActivePage("settings")}>الإعدادات</MenuButton>
          </>
        )}
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{getPageTitle(activePage)}</h1>
            <p>{data.settings.systemName}</p>
          </div>

          <button
            className="logout"
            type="button"
            onClick={() => {
              setLoggedUser(null);
              setActivePage("dashboard");
            }}
          >
            خروج
          </button>
        </header>

        {activePage === "dashboard" && (
          <DashboardPage stats={stats} data={data} currency={data.settings.currency} />
        )}

        {activePage === "patients" && (
          <PatientsPage
            patients={filteredPatients}
            patientSearch={patientSearch}
            setPatientSearch={setPatientSearch}
            patientForm={patientForm}
            setPatientForm={setPatientForm}
            savePatient={savePatient}
            deletePatient={(id) => deleteFromSection("patients", id)}
          />
        )}

        {activePage === "appointments" && (
          <AppointmentsPage
            appointments={data.appointments}
            appointmentForm={appointmentForm}
            setAppointmentForm={setAppointmentForm}
            saveAppointment={saveAppointment}
            deleteAppointment={(id) => deleteFromSection("appointments", id)}
          />
        )}

        {activePage === "prescriptions" && (
          <PrescriptionsPage
            prescriptions={data.prescriptions}
            prescriptionForm={prescriptionForm}
            setPrescriptionForm={setPrescriptionForm}
            savePrescription={savePrescription}
            deletePrescription={(id) => deleteFromSection("prescriptions", id)}
            settings={data.settings}
          />
        )}

        {activePage === "visits" && (
          <VisitsPage
            visits={data.visits}
            visitForm={visitForm}
            setVisitForm={setVisitForm}
            saveVisit={saveVisit}
            deleteVisit={(id) => deleteFromSection("visits", id)}
            currency={data.settings.currency}
          />
        )}

        {activePage === "invoices" && (
          <InvoicesPage
            invoices={data.invoices}
            invoiceForm={invoiceForm}
            setInvoiceForm={setInvoiceForm}
            saveInvoice={saveInvoice}
            deleteInvoice={(id) => deleteFromSection("invoices", id)}
            currency={data.settings.currency}
          />
        )}

        {activePage === "reports" && (
          <ReportsPage
            reports={data.reports}
            reportForm={reportForm}
            setReportForm={setReportForm}
            saveReport={saveReport}
            deleteReport={(id) => deleteFromSection("reports", id)}
            settings={data.settings}
          />
        )}

        {activePage === "inventory" && (
          <InventoryPage
            inventory={data.inventory}
            inventoryForm={inventoryForm}
            setInventoryForm={setInventoryForm}
            saveInventory={saveInventory}
            deleteInventory={(id) => deleteFromSection("inventory", id)}
          />
        )}

        {activePage === "users" && isSystemAdmin && (
          <UsersPage
            users={data.users}
            userForm={userForm}
            setUserForm={setUserForm}
            saveUser={saveUser}
            deleteUser={(id) => deleteFromSection("users", id)}
          />
        )}

        {activePage === "backup" && isSystemAdmin && (
          <BackupPage
            exportBackup={exportBackup}
            openGmailBackup={openGmailBackup}
            sendBackupToAppsScript={sendBackupToAppsScript}
            importBackup={importBackup}
            resetAllData={resetAllData}
            settings={data.settings}
          />
        )}

        {activePage === "settings" && isSystemAdmin && (
          <SettingsPage
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            saveSettings={saveSettings}
          />
        )}
      </main>
    </div>
  );
}

function LoginPage({ loginForm, setLoginForm, login, settings }) {
  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">
        <div className="logo">H$M</div>
        <h1>{settings.systemName}</h1>
        <p>{settings.slogan}</p>

        <input
          placeholder="اسم المستخدم"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm({ ...loginForm, username: e.target.value })
          }
        />

        <input
          placeholder="كلمة المرور"
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm({ ...loginForm, password: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") login();
          }}
        />

        <button type="button" onClick={login}>
          دخول البرنامج
        </button>

        <small>بيانات تجريبية: admin / 1234</small>
      </div>
    </div>
  );
}

function MenuButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={active ? "menu-btn active" : "menu-btn"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getPageTitle(page) {
  const titles = {
    dashboard: "لوحة التحكم",
    patients: "إدارة المرضى",
    appointments: "المواعيد",
    prescriptions: "الروشتات",
    visits: "الزيارات",
    invoices: "الفواتير",
    reports: "التقارير الطبية",
    inventory: "المخزون",
    users: "المستخدمون",
    backup: "النسخ الاحتياطي",
    settings: "الإعدادات",
  };

  return titles[page] || "H$M";
}

function PageCard({ title, description, children }) {
  return (
    <section className="page-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  );
}

function DashboardPage({ stats, data, currency }) {
  return (
    <>
      <section className="stats">
        <StatCard icon="👥" label="عدد المرضى" value={stats.patients} />
        <StatCard icon="📅" label="المواعيد" value={stats.appointments} />
        <StatCard icon="💊" label="الروشتات" value={stats.prescriptions} />
        <StatCard icon="💰" label="الإيرادات" value={`${stats.revenue} ${currency}`} />
        <StatCard icon="🧾" label="المتبقي" value={`${stats.due} ${currency}`} />
        <StatCard icon="⚠️" label="تنبيهات المخزون" value={stats.lowInventory} />
      </section>

      <section className="content-grid">
        <MiniPanel
          title="آخر المرضى"
          rows={data.patients.slice(0, 5).map((p) => `${p.name} — ${p.specialty}`)}
        />
        <MiniPanel
          title="آخر المواعيد"
          rows={data.appointments.slice(0, 5).map((a) => `${a.date} — ${a.time} — ${a.patientName}`)}
        />
        <MiniPanel
          title="آخر الفواتير"
          rows={data.invoices.slice(0, 5).map((i) => `${i.patientName} — ${i.paid}/${i.amount} ${currency}`)}
        />
      </section>
    </>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

function MiniPanel({ title, rows }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p>لا توجد بيانات</p>
      ) : (
        rows.map((row, index) => <p key={index}>{row}</p>)
      )}
    </div>
  );
}

function PatientsPage({
  patients,
  patientSearch,
  setPatientSearch,
  patientForm,
  setPatientForm,
  savePatient,
  deletePatient,
}) {
  return (
    <PageCard title="إدارة المرضى" description="إضافة وبحث وعرض بيانات المرضى.">
      <input
        className="search-input"
        placeholder="بحث باسم المريض أو رقم الهاتف أو التخصص"
        value={patientSearch}
        onChange={(e) => setPatientSearch(e.target.value)}
      />

      <div className="form-grid">
        <input placeholder="اسم المريض" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} />
        <input placeholder="السن" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })} />
        <input placeholder="رقم الهاتف" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} />
        <input placeholder="التخصص" value={patientForm.specialty} onChange={(e) => setPatientForm({ ...patientForm, specialty: e.target.value })} />
      </div>

      <textarea placeholder="التشخيص" value={patientForm.diagnosis} onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })} />
      <textarea placeholder="التاريخ المرضي / الحساسية" value={patientForm.history} onChange={(e) => setPatientForm({ ...patientForm, history: e.target.value })} />

      <button className="main-btn" type="button" onClick={savePatient}>حفظ المريض</button>

      <div className="table-box">
        <h3>قائمة المرضى</h3>
        {patients.map((p) => (
          <div className="data-row five" key={p.id}>
            <strong>{p.name}</strong>
            <span>{p.age} سنة</span>
            <span>{p.phone}</span>
            <span>{p.specialty}</span>
            <button className="delete-btn" type="button" onClick={() => deletePatient(p.id)}>حذف</button>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function AppointmentsPage({
  appointments,
  appointmentForm,
  setAppointmentForm,
  saveAppointment,
  deleteAppointment,
}) {
  return (
    <PageCard title="المواعيد" description="تنظيم مواعيد الكشف والمتابعة والاستشارة.">
      <div className="form-grid">
        <input placeholder="اسم المريض" value={appointmentForm.patientName} onChange={(e) => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })} />
        <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} />
        <input placeholder="وقت الموعد" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} />

        <select value={appointmentForm.visitType} onChange={(e) => setAppointmentForm({ ...appointmentForm, visitType: e.target.value })}>
          <option value="">نوع الزيارة</option>
          <option value="كشف">كشف</option>
          <option value="متابعة">متابعة</option>
          <option value="استشارة">استشارة</option>
        </select>

        <select value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}>
          <option value="منتظر">منتظر</option>
          <option value="تم الحضور">تم الحضور</option>
          <option value="مؤجل">مؤجل</option>
          <option value="لم يحضر">لم يحضر</option>
        </select>
      </div>

      <button className="main-btn" type="button" onClick={saveAppointment}>حفظ الموعد</button>

      <div className="table-box">
        <h3>قائمة المواعيد</h3>
        {appointments.map((a) => (
          <div className="data-row six" key={a.id}>
            <strong>{a.patientName}</strong>
            <span>{a.date}</span>
            <span>{a.time}</span>
            <span>{a.visitType}</span>
            <span className="badge">{a.status}</span>
            <button className="delete-btn" type="button" onClick={() => deleteAppointment(a.id)}>حذف</button>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function PrescriptionsPage({
  prescriptions,
  prescriptionForm,
  setPrescriptionForm,
  savePrescription,
  deletePrescription,
  settings,
}) {
  return (
    <PageCard title="الروشتات" description="روشتة قلب احترافية قابلة للطباعة والتعديل.">
      <div className="form-grid">
        <input placeholder="اسم المريض" value={prescriptionForm.patientName} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientName: e.target.value })} />
        <input placeholder="السن" value={prescriptionForm.age} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, age: e.target.value })} />
        <input placeholder="اسم الطبيب" value={prescriptionForm.doctorName} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctorName: e.target.value })} />
        <input placeholder="التشخيص" value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })} />
        <input type="date" value={prescriptionForm.date} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, date: e.target.value })} />
      </div>

      <textarea
        placeholder="الأدوية والجرعات"
        value={prescriptionForm.medicines}
        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
      />

      <textarea
        placeholder="ملاحظات"
        value={prescriptionForm.notes}
        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
      />

      <button className="main-btn" type="button" onClick={savePrescription}>
        حفظ الروشتة
      </button>

      <div className="prescriptions-list">
        <h3>الروشتات المحفوظة</h3>

        {prescriptions.map((rx) => (
          <div className="prescription-card heart-rx-template" key={rx.id}>
            <div className="heart-rx-top-red">
              <div className="heart-illustration">❤</div>
              <div className="ecg-top-line">⌁⌁⌁</div>
            </div>

            <div className="heart-rx-header">
              <div className="heart-logo-place">
                <div className="heart-logo-circle">
                  <span>{settings.rxLogoText || "مكان اللوجو"}</span>
                </div>
              </div>

              <div className="heart-doctor-info">
                <h1>
                  <span>{settings.doctorPrefix || "د."}</span>{" "}
                  {rx.doctorName || settings.doctorName}
                </h1>

                <p>{settings.specialty || "استشاري القلب والباطنة وقسطرة القلب"}</p>

                <div className="heart-services">
                  <div>{settings.serviceOne || "أشعة إيكو على القلب"}</div>
                  <div>{settings.serviceTwo || "رسم قلب"}</div>
                </div>
              </div>
            </div>

            <div className="heart-small-graphic">
              <span>ـــــــ ♥ ـــــــ</span>
            </div>

            <div className="heart-patient-row">
              <div>
                <strong>الاسم:</strong>
                <span>{rx.patientName}</span>
              </div>

              <div>
                <strong>السن:</strong>
                <span>{rx.age || ""}</span>
              </div>

              <div>
                <strong>التاريخ:</strong>
                <span>{rx.date || ""}</span>
              </div>
            </div>

            <div className="heart-main-divider">
              <span></span>
            </div>

            <div className="heart-rx-body">
              <div className="heart-watermark">♥</div>

              <div className="heart-medicines-area">
                <pre>{rx.medicines}</pre>
              </div>

              <aside className="heart-side-tests">
                <div>B.P</div>
                <div>R.B.G</div>
                <div>E.C.G</div>
              </aside>
            </div>

            {rx.notes && (
              <div className="heart-notes">
                <strong>ملاحظات:</strong> {rx.notes}
              </div>
            )}

            <div className="heart-rx-footer">
              <div className="heart-footer-wave">⌁⌁⌁ ❤</div>

              <div className="heart-footer-data">
                <div>
                  <strong>العنوان:</strong>
                  <span>{settings.address}</span>
                </div>

                <div>
                  <strong>تليفون:</strong>
                  <span>{settings.phone}</span>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="print-btn" type="button" onClick={() => window.print()}>
                طباعة
              </button>

              <button className="delete-btn" type="button" onClick={() => deletePrescription(rx.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function VisitsPage({ visits, visitForm, setVisitForm, saveVisit, deleteVisit, currency }) {
  return (
    <PageCard title="الزيارات" description="أرشيف زيارات المرضى والمدفوعات.">
      <div className="form-grid">
        <input placeholder="اسم المريض" value={visitForm.patientName} onChange={(e) => setVisitForm({ ...visitForm, patientName: e.target.value })} />
        <input type="date" value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} />

        <select value={visitForm.visitType} onChange={(e) => setVisitForm({ ...visitForm, visitType: e.target.value })}>
          <option value="">نوع الزيارة</option>
          <option value="كشف">كشف</option>
          <option value="متابعة">متابعة</option>
          <option value="استشارة">استشارة</option>
        </select>

        <input placeholder="التشخيص" value={visitForm.diagnosis} onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })} />
        <input placeholder="المدفوع" value={visitForm.paid} onChange={(e) => setVisitForm({ ...visitForm, paid: e.target.value })} />
        <input placeholder="المتبقي" value={visitForm.remaining} onChange={(e) => setVisitForm({ ...visitForm, remaining: e.target.value })} />
      </div>

      <button className="main-btn" type="button" onClick={saveVisit}>حفظ الزيارة</button>

      <div className="table-box">
        <h3>قائمة الزيارات</h3>
        {visits.map((v) => (
          <div className="data-row seven" key={v.id}>
            <strong>{v.patientName}</strong>
            <span>{v.date}</span>
            <span>{v.visitType}</span>
            <span>{v.diagnosis}</span>
            <span>{v.paid} {currency}</span>
            <span>{v.remaining} {currency}</span>
            <button className="delete-btn" type="button" onClick={() => deleteVisit(v.id)}>حذف</button>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function InvoicesPage({ invoices, invoiceForm, setInvoiceForm, saveInvoice, deleteInvoice, currency }) {
  return (
    <PageCard title="الفواتير" description="إدارة المدفوعات والمتبقي.">
      <div className="form-grid">
        <input placeholder="اسم المريض" value={invoiceForm.patientName} onChange={(e) => setInvoiceForm({ ...invoiceForm, patientName: e.target.value })} />
        <input placeholder="الخدمة" value={invoiceForm.service} onChange={(e) => setInvoiceForm({ ...invoiceForm, service: e.target.value })} />
        <input placeholder="المبلغ" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
        <input placeholder="المدفوع" value={invoiceForm.paid} onChange={(e) => setInvoiceForm({ ...invoiceForm, paid: e.target.value })} />
        <input type="date" value={invoiceForm.date} onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })} />
      </div>

      <button className="main-btn" type="button" onClick={saveInvoice}>حفظ الفاتورة</button>

      <div className="table-box">
        <h3>قائمة الفواتير</h3>
        {invoices.map((i) => (
          <div className="data-row seven" key={i.id}>
            <strong>{i.patientName}</strong>
            <span>{i.service}</span>
            <span>{i.amount} {currency}</span>
            <span>{i.paid} {currency}</span>
            <span>{i.remaining} {currency}</span>
            <span className="badge">{i.status}</span>
            <button className="delete-btn" type="button" onClick={() => deleteInvoice(i.id)}>حذف</button>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function ReportsPage({ reports, reportForm, setReportForm, saveReport, deleteReport, settings }) {
  return (
    <PageCard title="التقارير الطبية" description="إنشاء تقارير طبية قابلة للطباعة.">
      <div className="form-grid">
        <input placeholder="اسم المريض" value={reportForm.patientName} onChange={(e) => setReportForm({ ...reportForm, patientName: e.target.value })} />
        <input placeholder="عنوان التقرير" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} />
        <input type="date" value={reportForm.date} onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })} />
      </div>

      <textarea placeholder="نص التقرير الطبي" value={reportForm.body} onChange={(e) => setReportForm({ ...reportForm, body: e.target.value })} />

      <button className="main-btn" type="button" onClick={saveReport}>حفظ التقرير</button>

      <div className="reports-list">
        {reports.map((r) => (
          <div className="report-card" key={r.id}>
            <div className="report-header">
              <h3>{settings.clinicName}</h3>
              <span>{r.date}</span>
            </div>

            <h4>{r.title}</h4>
            <p><strong>اسم المريض:</strong> {r.patientName}</p>
            <p>{r.body}</p>

            <div className="card-actions">
              <button className="print-btn" type="button" onClick={() => window.print()}>طباعة</button>
              <button className="delete-btn" type="button" onClick={() => deleteReport(r.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function InventoryPage({ inventory, inventoryForm, setInventoryForm, saveInventory, deleteInventory }) {
  return (
    <PageCard title="المخزون" description="متابعة مستلزمات العيادة والتنبيه قبل النفاد.">
      <div className="form-grid">
        <input placeholder="اسم الصنف" value={inventoryForm.itemName} onChange={(e) => setInventoryForm({ ...inventoryForm, itemName: e.target.value })} />
        <input placeholder="الكمية" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} />
        <input placeholder="الوحدة" value={inventoryForm.unit} onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })} />
        <input placeholder="حد التنبيه" value={inventoryForm.alertLimit} onChange={(e) => setInventoryForm({ ...inventoryForm, alertLimit: e.target.value })} />
      </div>

      <button className="main-btn" type="button" onClick={saveInventory}>حفظ الصنف</button>

      <div className="table-box">
        <h3>قائمة المخزون</h3>
        {inventory.map((item) => {
          const low = Number(item.quantity || 0) <= Number(item.alertLimit || 0);

          return (
            <div className="data-row five" key={item.id}>
              <strong>{item.itemName}</strong>
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span className={low ? "danger-badge" : "success-badge"}>
                {low ? "قارب على النفاد" : "متوفر"}
              </span>
              <button className="delete-btn" type="button" onClick={() => deleteInventory(item.id)}>حذف</button>
            </div>
          );
        })}
      </div>
    </PageCard>
  );
}

function UsersPage({ users, userForm, setUserForm, saveUser, deleteUser }) {
  return (
    <PageCard title="المستخدمون والصلاحيات" description="إضافة مستخدمين للنظام. مدير النظام الأساسي محمي ولا يمكن حذفه.">
      <div className="form-grid">
        <input placeholder="اسم المستخدم" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
        <input placeholder="اسم الدخول" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
        <input placeholder="كلمة المرور" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />

        <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
          <option value="طبيب">طبيب</option>
          <option value="استقبال">استقبال</option>
          <option value="محاسب">محاسب</option>
          <option value="تمريض">تمريض</option>
          <option value="مشاهدة فقط">مشاهدة فقط</option>
        </select>
      </div>

      <button className="main-btn" type="button" onClick={saveUser}>حفظ المستخدم</button>

      <div className="table-box">
        <h3>قائمة المستخدمين</h3>
        {users.map((u) => (
          <div className="data-row four" key={u.id}>
            <strong>{u.name}</strong>
            <span>{u.username}</span>
            <span>{u.role}</span>
            {u.protected || u.role === "مدير النظام" ? (
              <span className="protected-badge">محمي</span>
            ) : (
              <button className="delete-btn" type="button" onClick={() => deleteUser(u.id)}>حذف</button>
            )}
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function BackupPage({
  exportBackup,
  openGmailBackup,
  sendBackupToAppsScript,
  importBackup,
  resetAllData,
  settings,
}) {
  return (
    <PageCard title="النسخ الاحتياطي" description="تصدير واستيراد وإرسال نسخة احتياطية عبر Gmail.">
      <div className="backup-note">
        <strong>بريد النسخ الاحتياطي:</strong> {settings.backupEmail || "لم يتم تحديده"}
        <br />
        للتلقائي الكامل ضع رابط Google Apps Script في الإعدادات.
      </div>

      <div className="backup-actions">
        <button className="main-btn" type="button" onClick={exportBackup}>تصدير نسخة JSON</button>
        <button className="main-btn secondary" type="button" onClick={openGmailBackup}>فتح Gmail وتجهيز رسالة</button>
        <button className="main-btn secondary" type="button" onClick={sendBackupToAppsScript}>إرسال عبر Apps Script</button>

        <label className="upload-btn">
          استيراد نسخة
          <input type="file" accept="application/json" onChange={(e) => importBackup(e.target.files[0])} />
        </label>

        <button className="danger-btn" type="button" onClick={resetAllData}>مسح كل البيانات</button>
      </div>
    </PageCard>
  );
}

function SettingsPage({ settingsForm, setSettingsForm, saveSettings }) {
  return (
    <PageCard title="الإعدادات" description="بيانات العيادة والروشتة والنسخ الاحتياطي.">
      <div className="form-grid">
        <input placeholder="اسم العيادة" value={settingsForm.clinicName} onChange={(e) => setSettingsForm({ ...settingsForm, clinicName: e.target.value })} />
        <input placeholder="اسم النظام" value={settingsForm.systemName} onChange={(e) => setSettingsForm({ ...settingsForm, systemName: e.target.value })} />
        <input placeholder="اسم الطبيب" value={settingsForm.doctorName} onChange={(e) => setSettingsForm({ ...settingsForm, doctorName: e.target.value })} />
        <input placeholder="لقب الطبيب" value={settingsForm.doctorPrefix} onChange={(e) => setSettingsForm({ ...settingsForm, doctorPrefix: e.target.value })} />
        <input placeholder="التخصص" value={settingsForm.specialty} onChange={(e) => setSettingsForm({ ...settingsForm, specialty: e.target.value })} />
        <input placeholder="الخدمة الأولى" value={settingsForm.serviceOne} onChange={(e) => setSettingsForm({ ...settingsForm, serviceOne: e.target.value })} />
        <input placeholder="الخدمة الثانية" value={settingsForm.serviceTwo} onChange={(e) => setSettingsForm({ ...settingsForm, serviceTwo: e.target.value })} />
        <input placeholder="رقم الهاتف" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
        <input placeholder="العنوان" value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })} />
        <input placeholder="الشعار النصي" value={settingsForm.slogan} onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })} />
        <input placeholder="العملة" value={settingsForm.currency} onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })} />
        <input placeholder="مواعيد العيادة" value={settingsForm.clinicHours} onChange={(e) => setSettingsForm({ ...settingsForm, clinicHours: e.target.value })} />
        <input placeholder="نص اللوجو داخل الدائرة" value={settingsForm.rxLogoText} onChange={(e) => setSettingsForm({ ...settingsForm, rxLogoText: e.target.value })} />
        <input placeholder="Gmail للنسخ الاحتياطي" value={settingsForm.backupEmail} onChange={(e) => setSettingsForm({ ...settingsForm, backupEmail: e.target.value })} />
        <input placeholder="رابط Google Apps Script اختياري" value={settingsForm.appsScriptUrl} onChange={(e) => setSettingsForm({ ...settingsForm, appsScriptUrl: e.target.value })} />
      </div>

      <button className="main-btn" type="button" onClick={saveSettings}>حفظ الإعدادات</button>
    </PageCard>
  );
}