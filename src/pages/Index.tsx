import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";

const LOGO_URL = "https://cdn.poehali.dev/projects/cfd2a8a4-eb7e-4847-9fbc-3fbbbec5963a/bucket/be2eb5ba-e2db-4c10-993e-8afc42049268.png";

const API = {
  authManager: "https://functions.poehali.dev/c97bf12a-5428-4ee6-8007-744b50b22d45",
  authClient: "https://functions.poehali.dev/a5fae4a7-68c6-4b61-9cd4-e1235bd43b35",
  bookings: "https://functions.poehali.dev/5dc8c023-b1ba-40cd-91c6-8005c35b7552",
};

type Role = "select" | "client" | "manager";
interface SessionUser { token: string; name: string; email: string; role: string; client_id?: number; is_admin?: boolean; }
type ManagerSection = "dashboard" | "bookings" | "create" | "clients" | "messages" | "my-contacts" | "team";
type Section = "booking" | "crew" | "documents" | "payments" | "messages" | "marina" | "reminders" | "routes" | "contacts";

const booking = {
  yachtName: "Beneteau Oceanis 51.1", yachtType: "Парусная яхта", flag: "🇭🇷",
  marina: "ACI Marina Split", country: "Хорватия",
  dateFrom: "14 июля 2025", dateTo: "21 июля 2025", nights: 7,
  status: "Подтверждено", captain: "Алексей Воронов",
  cabins: 4, berths: 8, length: "15.3 м", engine: "2 × 57 л.с.",
};

const crewMembers = [
  { id: 1, name: "Дмитрий Орлов", role: "Шкипер", age: 38, passport: true, visa: true, medical: false },
  { id: 2, name: "Анна Орлова", role: "Матрос", age: 34, passport: true, visa: true, medical: true },
  { id: 3, name: "Кирилл Соколов", role: "Матрос", age: 29, passport: true, visa: false, medical: false },
  { id: 4, name: "Мария Петрова", role: "Матрос", age: 31, passport: false, visa: false, medical: false },
];

const payments = [
  { id: 1, name: "Депозит", amount: 1500, currency: "EUR", dueDate: "01 марта 2025", status: "paid", paidDate: "28 фев 2025" },
  { id: 2, name: "50% стоимости чартера", amount: 3200, currency: "EUR", dueDate: "15 апреля 2025", status: "paid", paidDate: "10 апр 2025" },
  { id: 3, name: "Остаток + сборы марины", amount: 3450, currency: "EUR", dueDate: "01 июня 2025", status: "pending", paidDate: null },
  { id: 4, name: "Страховой депозит", amount: 2000, currency: "EUR", dueDate: "14 июля 2025", status: "upcoming", paidDate: null },
];

const documents = [
  { id: 1, name: "Договор чартера", type: "contract", size: "1.2 MB", date: "15 янв 2025", status: "signed" },
  { id: 2, name: "Инвойс №001", type: "invoice", size: "0.4 MB", date: "15 янв 2025", status: "paid" },
  { id: 3, name: "Инвойс №002", type: "invoice", size: "0.4 MB", date: "20 мар 2025", status: "paid" },
  { id: 4, name: "Страховой полис", type: "insurance", size: "2.1 MB", date: "02 фев 2025", status: "active" },
  { id: 5, name: "Паспорт Д. Орлова", type: "passport", size: "0.8 MB", date: "05 янв 2025", status: "verified" },
];

const messages = [
  { id: 1, from: "manager", name: "Елена Морская", text: "Добро пожаловать! Ваше бронирование подтверждено. Буду рада помочь с организацией.", time: "15 янв, 10:21", avatar: "ЕМ" },
  { id: 2, from: "client", name: "Вы", text: "Спасибо! Подскажите, можно ли взять SUP-доску?", time: "15 янв, 11:05", avatar: "ВЫ" },
  { id: 3, from: "manager", name: "Елена Морская", text: "Конечно! На борту уже есть 2 SUP-доски и снорклинг-набор. Дополнительное снаряжение закажем заранее.", time: "15 янв, 11:30", avatar: "ЕМ" },
  { id: 4, from: "manager", name: "Елена Морская", text: "Напоминаю: необходимо загрузить копии паспортов всех членов экипажа до 1 июня.", time: "20 мая, 09:00", avatar: "ЕМ" },
];

const reminders = [
  { id: 1, date: "01 июня 2025", text: "Загрузить паспорта экипажа", priority: "high" },
  { id: 2, date: "01 июня 2025", text: "Оплатить остаток + сборы марины", priority: "high" },
  { id: 3, date: "20 июня 2025", text: "Проверить наличие визы у Кирилла Соколова", priority: "medium" },
  { id: 4, date: "01 июля 2025", text: "Подтвердить время прибытия в марину", priority: "low" },
  { id: 5, date: "14 июля 2025", text: "Брифинг с шкипером в 10:00 на борту", priority: "high" },
];

const routes = [
  { id: 1, name: "Сплит → Хвар → Вис → Корчула", days: 7, distance: "180 нм", difficulty: "Средняя", highlight: "Рекомендовано", description: "Классический маршрут по Далматинским островам. Кристально чистая вода, исторические города, лучшие бухты." },
  { id: 2, name: "Сплит → Брач → Шолта → Трогир", days: 7, distance: "120 нм", difficulty: "Лёгкая", highlight: "", description: "Спокойный маршрут для семей. Золотой пляж Брача, тихие деревушки Шолты, ЮНЕСКО-город Трогир." },
  { id: 3, name: "Сплит → Вис → Бишево (Голубая пещера)", days: 7, distance: "160 нм", difficulty: "Средняя", highlight: "Топ", description: "Приключенческий маршрут. Знаменитая Голубая пещера, дикие бухты острова Вис, местные рыбаки." },
];

const defaultMarina = {
  name: "ACI Marina Split", address: "Uvala Baluni, 21000 Сплит, Хорватия",
  phone: "+385 21 398 548", email: "split@aci-club.hr",
  vhf: "Channel 17", coordinates: "43°30′05″ N, 16°24′10″ E",
  checkin: "14:00", checkout: "09:00",
  instructions: [
    "Прибыть не ранее 14:00 в день начала чартера",
    "Связаться с шкипером по VHF CH 17 при подходе",
    "Документы на яхту и паспорта передать менеджеру марины",
    "Брифинг по безопасности обязателен перед выходом",
    "Топливо заправить до возвращения в марину",
  ],
};

const DEFAULT_MANAGER_CONTACTS = {
  name: "Елена Морская", position: "Менеджер по яхтенному чартеру",
  phone: "+7 916 000-00-00", whatsapp: "+79160000000",
  telegram: "@elena_yacht", email: "elena@abeonaclub.ru",
  bio: "Помогу с любым вопросом по вашему рейсу. Пишите в любое время!",
};

function getManagerContacts() {
  try {
    const stored = localStorage.getItem("yc_manager_contacts");
    return stored ? { ...DEFAULT_MANAGER_CONTACTS, ...JSON.parse(stored) } : DEFAULT_MANAGER_CONTACTS;
  } catch { return DEFAULT_MANAGER_CONTACTS; }
}

function saveManagerContacts(data: typeof DEFAULT_MANAGER_CONTACTS) {
  localStorage.setItem("yc_manager_contacts", JSON.stringify(data));
}

const managerBookings = [
  { id: 1, client: "Дмитрий Орлов", yacht: "Beneteau Oceanis 51.1", marina: "ACI Split", dateFrom: "14 июл", dateTo: "21 июл", status: "confirmed", paid: 4700, total: 10150, crew: 4 },
  { id: 2, client: "Сергей Васильев", yacht: "Jeanneau Sun Odyssey 440", marina: "ACI Dubrovnik", dateFrom: "22 июл", dateTo: "29 июл", status: "pending", paid: 2000, total: 8400, crew: 6 },
  { id: 3, client: "Ольга Стрелкова", yacht: "Bavaria C42", marina: "Marina Hvar", dateFrom: "05 авг", dateTo: "12 авг", status: "new", paid: 0, total: 6200, crew: 3 },
  { id: 4, client: "Андрей Климов", yacht: "Dufour 460 GL", marina: "ACI Rovinj", dateFrom: "18 авг", dateTo: "25 авг", status: "confirmed", paid: 9600, total: 9600, crew: 5 },
];

const navItems: { id: Section; label: string; icon: string; badge?: number }[] = [
  { id: "booking", label: "Бронирование", icon: "Anchor" },
  { id: "crew", label: "Экипаж", icon: "Users", badge: 2 },
  { id: "documents", label: "Документы", icon: "FileText" },
  { id: "payments", label: "Платежи", icon: "CreditCard", badge: 1 },
  { id: "messages", label: "Сообщения", icon: "MessageCircle", badge: 1 },
  { id: "contacts", label: "Контакты менеджера", icon: "ContactRound" },
  { id: "marina", label: "Марина", icon: "MapPin" },
  { id: "reminders", label: "Напоминания", icon: "Bell", badge: 5 },
  { id: "routes", label: "Маршруты", icon: "Navigation" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Оплачено", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    pending: { label: "Ожидает", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    upcoming: { label: "Предстоит", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    signed: { label: "Подписан", cls: "bg-violet-100 text-violet-800 border-violet-200" },
    active: { label: "Активная", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    verified: { label: "Проверен", cls: "bg-sky-100 text-sky-800 border-sky-200" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
}

// ─── БАГ #5 ИСПРАВЛЕН: BookingSection принимает marinaOverride ────────────────
function BookingSection({ bookingOverride, marinaOverride }: { bookingOverride?: typeof booking; marinaOverride?: Partial<typeof defaultMarina> } = {}) {
  const b = bookingOverride || booking;
  const m = { ...defaultMarina, ...marinaOverride };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="wave-bg rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-8 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 1440 120" className="absolute bottom-0 w-full" fill="white" preserveAspectRatio="none">
            <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-xs font-body mb-1 tracking-widest uppercase">Ваше бронирование</p>
              <h2 className="font-display text-4xl font-semibold">{b.yachtName}</h2>
              <p className="text-blue-200 mt-1 text-sm">{b.yachtType} · {b.flag} {b.country}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-medium">
              <Icon name="CheckCircle" size={14} />{b.status}
            </span>
          </div>
          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Отход", value: b.dateFrom, icon: "CalendarCheck" },
              { label: "Возврат", value: b.dateTo, icon: "CalendarX" },
              { label: "Ночей", value: String(b.nights), icon: "Moon" },
              { label: "Марина", value: b.marina, icon: "Anchor" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Icon name={item.icon} size={14} className="text-blue-200 mb-1" />
                <p className="text-blue-200 text-xs">{item.label}</p>
                <p className="text-white font-semibold text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ocean-card rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)] mb-4">Технические данные</h3>
          <div className="space-y-0">
            {[
              { label: "Длина", value: b.length, icon: "Ruler" },
              { label: "Каюты / места", value: `${b.cabins} / ${b.berths}`, icon: "BedDouble" },
              { label: "Двигатель", value: b.engine, icon: "Zap" },
              { label: "Шкипер", value: b.captain, icon: "User" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-blue-100 last:border-0">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name={item.icon} size={14} className="text-[hsl(199,65%,45%)]" />{item.label}
                </span>
                <span className="text-sm font-medium text-[hsl(213,80%,15%)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ocean-card rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)] mb-4">Марина прибытия</h3>
          <div className="space-y-3">
            {[
              { icon: "MapPin", text: m.name, sub: m.address },
              { icon: "Radio", text: `VHF ${m.vhf}` },
              { icon: "Phone", text: m.phone },
              { icon: "Clock", text: `Заезд: ${m.checkin} · Выезд: ${m.checkout}` },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon name={item.icon} size={15} className="text-[hsl(199,65%,45%)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[hsl(213,80%,15%)]">{item.text}</p>
                  {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CrewSection() {
  const totalFields = crewMembers.length * 3;
  const filledFields = crewMembers.reduce((acc, m) => acc + (m.passport ? 1 : 0) + (m.visa ? 1 : 0) + (m.medical ? 1 : 0), 0);
  const progress = Math.round((filledFields / totalFields) * 100);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="ocean-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">Готовность экипажа</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Документы и визы</p>
          </div>
          <span className="text-3xl font-display font-semibold text-[hsl(213,70%,28%)]">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3 mb-2" />
        <p className="text-xs text-muted-foreground">{filledFields} из {totalFields} документов подтверждено</p>
      </div>
      {crewMembers.map((member, idx) => {
        const filled = (member.passport ? 1 : 0) + (member.visa ? 1 : 0) + (member.medical ? 1 : 0);
        return (
          <div key={member.id} className="ocean-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[hsl(213,70%,28%)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-[hsl(213,80%,15%)]">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role} · {member.age} лет</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${filled === 3 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {filled}/3 готово
                  </span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    { label: "Паспорт", val: member.passport },
                    { label: "Виза", val: member.visa },
                    { label: "Медсправка", val: member.medical },
                  ].map((doc) => (
                    <span key={doc.label} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${doc.val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      <Icon name={doc.val ? "Check" : "X"} size={11} />{doc.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentsSection() {
  const iconByType: Record<string, string> = { contract: "FileSignature", invoice: "Receipt", insurance: "Shield", passport: "BookUser" };
  return (
    <div className="animate-fade-in">
      <div className="ocean-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">Документы</h3>
          <button className="flex items-center gap-2 bg-[hsl(213,70%,28%)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[hsl(213,80%,20%)] transition-colors">
            <Icon name="Upload" size={14} />Загрузить
          </button>
        </div>
        <div className="space-y-1">
          {documents.map((doc, idx) => (
            <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 transition-colors group animate-fade-in" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="w-10 h-10 rounded-lg bg-[hsl(199,60%,88%)] flex items-center justify-center flex-shrink-0">
                <Icon name={iconByType[doc.type] || "File"} size={17} className="text-[hsl(213,70%,28%)]" fallback="File" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[hsl(213,80%,15%)] truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.size} · {doc.date}</p>
              </div>
              <StatusBadge status={doc.status} />
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-blue-100">
                <Icon name="Download" size={14} className="text-[hsl(213,70%,28%)]" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentsSection() {
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalAll = payments.reduce((a, p) => a + p.amount, 0);
  const progress = Math.round((totalPaid / totalAll) * 100);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="wave-bg rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Общий прогресс оплат</p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-4xl font-display font-semibold">{totalPaid.toLocaleString("ru")}</span>
            <span className="text-blue-200 ml-2 text-sm">EUR</span>
          </div>
          <span className="text-blue-200 text-sm">из {totalAll.toLocaleString("ru")} EUR</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5 mb-1">
          <div className="h-2.5 rounded-full bg-[hsl(45,85%,55%)] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-blue-200 text-xs mt-1">{progress}% оплачено</p>
      </div>
      {payments.map((pay, idx) => (
        <div key={pay.id} className="ocean-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${idx * 0.07}s` }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-[hsl(213,80%,15%)]">{pay.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Срок: {pay.dueDate}{pay.paidDate && ` · Оплачено: ${pay.paidDate}`}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">{pay.amount.toLocaleString("ru")} <span className="text-sm font-body">EUR</span></p>
              <div className="mt-1"><StatusBadge status={pay.status} /></div>
            </div>
          </div>
          {pay.status === "pending" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <Icon name="Info" size={13} className="text-amber-500 flex-shrink-0" />
              Свяжитесь с менеджером для уточнения реквизитов оплаты
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MessagesSection() {
  const [newMsg, setNewMsg] = useState("");
  return (
    <div className="animate-fade-in">
      <div className="ocean-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[hsl(213,70%,28%)] flex items-center justify-center text-white text-xs font-semibold">ЕМ</div>
          <div>
            <p className="font-semibold text-[hsl(213,80%,15%)] text-sm">Елена Морская</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />Онлайн
            </p>
          </div>
        </div>
        <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex gap-3 animate-fade-in ${msg.from === "client" ? "flex-row-reverse" : ""}`} style={{ animationDelay: `${idx * 0.07}s` }}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${msg.from === "manager" ? "bg-[hsl(213,70%,28%)] text-white" : "bg-[hsl(45,85%,55%)] text-[hsl(213,80%,15%)]"}`}>
                {msg.avatar}
              </div>
              <div className={`max-w-[75%] flex flex-col gap-1 ${msg.from === "client" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${msg.from === "manager" ? "bg-blue-50 text-[hsl(213,80%,15%)] rounded-tl-sm" : "bg-[hsl(213,70%,28%)] text-white rounded-tr-sm"}`}>
                  {msg.text}
                </div>
                <span className="text-xs text-muted-foreground px-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-blue-100 flex gap-2">
          <input
            className="flex-1 bg-blue-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] border border-blue-100"
            placeholder="Написать менеджеру..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
          />
          <button className="bg-[hsl(213,70%,28%)] text-white px-4 py-2.5 rounded-xl hover:bg-[hsl(213,80%,20%)] transition-colors">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── БАГ #5 ИСПРАВЛЕН: MarinaSection принимает marinaOverride ────────────────
function MarinaSection({ marinaOverride }: { marinaOverride?: Partial<typeof defaultMarina> } = {}) {
  const m = { ...defaultMarina, ...marinaOverride };
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="wave-bg rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Марина прибытия</p>
        <h2 className="font-display text-3xl font-semibold">{m.name}</h2>
        <p className="text-blue-200 text-sm mt-1 flex items-center gap-1.5"><Icon name="MapPin" size={13} />{m.address}</p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "VHF", value: m.vhf, icon: "Radio" },
            { label: "Телефон", value: m.phone, icon: "Phone" },
            { label: "Email", value: m.email, icon: "Mail" },
            { label: "Координаты", value: m.coordinates, icon: "Compass" },
            { label: "Заезд", value: m.checkin, icon: "LogIn" },
            { label: "Выезд", value: m.checkout, icon: "LogOut" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-3 border border-white/20">
              <Icon name={item.icon} size={13} className="text-blue-200 mb-1" />
              <p className="text-blue-200 text-xs">{item.label}</p>
              <p className="text-white text-sm font-medium mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="ocean-card rounded-2xl p-6">
        <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)] mb-4 flex items-center gap-2">
          <Icon name="BookOpen" size={17} className="text-[hsl(199,65%,45%)]" />Инструкции
        </h3>
        <ul className="space-y-3">
          {m.instructions.map((inst, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-[hsl(199,60%,88%)] text-[hsl(213,70%,28%)] font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-[hsl(213,80%,15%)] leading-relaxed">{inst}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RemindersSection() {
  const [done, setDone] = useState<number[]>([]);
  const priorityIcon: Record<string, string> = { high: "AlertCircle", medium: "Clock", low: "Bell" };
  const priorityColor: Record<string, string> = { high: "text-red-500", medium: "text-amber-500", low: "text-blue-400" };
  return (
    <div className="animate-fade-in">
      <div className="ocean-card rounded-2xl p-5">
        <h3 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)] mb-1">Напоминания</h3>
        <p className="text-sm text-muted-foreground mb-5">От вашего менеджера</p>
        <div className="space-y-3">
          {reminders.map((r, idx) => (
            <div
              key={r.id}
              onClick={() => setDone((d) => d.includes(r.id) ? d.filter((x) => x !== r.id) : [...d, r.id])}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all animate-fade-in ${done.includes(r.id) ? "opacity-50 bg-gray-50 border-gray-200" : "bg-white border-blue-100 hover:border-[hsl(199,65%,45%)] hover:shadow-sm"}`}
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              <Icon name={done.includes(r.id) ? "CheckCircle2" : priorityIcon[r.priority] || "Bell"} size={18}
                className={done.includes(r.id) ? "text-emerald-500 mt-0.5" : `${priorityColor[r.priority] || ""} mt-0.5`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${done.includes(r.id) ? "line-through text-muted-foreground" : "text-[hsl(213,80%,15%)]"}`}>{r.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Icon name="Calendar" size={11} />{r.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoutesSection() {
  return (
    <div className="space-y-5 animate-fade-in">
      {routes.map((route, idx) => (
        <div key={route.id} className="ocean-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="flex items-start gap-3 flex-wrap mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">{route.name}</h3>
                {route.highlight && (
                  <span className="bg-[hsl(45,85%,90%)] text-[hsl(38,75%,35%)] border border-[hsl(45,85%,70%)] text-xs px-2.5 py-0.5 rounded-full font-medium">⭐ {route.highlight}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{route.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { icon: "Navigation", val: route.distance },
              { icon: "Clock", val: `${route.days} дней` },
              { icon: "Wind", val: route.difficulty },
            ].map((item) => (
              <span key={item.val} className="flex items-center gap-1.5 text-xs bg-[hsl(199,60%,88%)] text-[hsl(213,70%,28%)] px-3 py-1.5 rounded-lg font-medium">
                <Icon name={item.icon} size={12} />{item.val}
              </span>
            ))}
          </div>
          <button className="mt-4 w-full border-2 border-[hsl(213,70%,28%)] text-[hsl(213,70%,28%)] py-2.5 rounded-xl text-sm font-semibold hover:bg-[hsl(213,70%,28%)] hover:text-white transition-all">
            Подробнее о маршруте
          </button>
        </div>
      ))}
    </div>
  );
}

function ContactsSection() {
  const [contacts, setContacts] = useState(getManagerContacts());
  useEffect(() => {
    const handleFocus = () => setContacts(getManagerContacts());
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="wave-bg rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-display font-semibold flex-shrink-0">
            {contacts.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-blue-200 text-xs uppercase tracking-widest mb-0.5">Ваш менеджер</p>
            <h2 className="font-display text-2xl font-semibold">{contacts.name}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{contacts.position}</p>
          </div>
        </div>
        {contacts.bio && (
          <p className="mt-4 text-blue-100 text-sm leading-relaxed bg-white/10 rounded-xl px-4 py-3 border border-white/15">{contacts.bio}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {contacts.whatsapp && (
          <a href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 ocean-card rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div className="flex-1"><p className="font-semibold text-[hsl(213,80%,15%)]">WhatsApp</p><p className="text-sm text-muted-foreground">{contacts.whatsapp}</p></div>
            <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </a>
        )}
        {contacts.telegram && (
          <a href={`https://t.me/${contacts.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 ocean-card rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[#2AABEE] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </div>
            <div className="flex-1"><p className="font-semibold text-[hsl(213,80%,15%)]">Telegram</p><p className="text-sm text-muted-foreground">{contacts.telegram}</p></div>
            <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </a>
        )}
        {contacts.phone && (
          <a href={`tel:${contacts.phone}`} className="flex items-center gap-4 ocean-card rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[hsl(213,70%,28%)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Icon name="Phone" size={20} className="text-white" />
            </div>
            <div className="flex-1"><p className="font-semibold text-[hsl(213,80%,15%)]">Телефон</p><p className="text-sm text-muted-foreground">{contacts.phone}</p></div>
            <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </a>
        )}
        {contacts.email && (
          <a href={`mailto:${contacts.email}`} className="flex items-center gap-4 ocean-card rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[hsl(199,65%,45%)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Icon name="Mail" size={20} className="text-white" />
            </div>
            <div className="flex-1"><p className="font-semibold text-[hsl(213,80%,15%)]">Email</p><p className="text-sm text-muted-foreground">{contacts.email}</p></div>
            <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
}

function ManagerLoginScreen({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiPost = async (payload: object) => {
    const res = await fetch(API.authManager, { method: "POST", body: JSON.stringify(payload) });
    const text = await res.text();
    return { ok: res.ok, data: JSON.parse(text) };
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Заполните все поля"); return; }
    setLoading(true); setError("");
    try {
      const { ok, data } = await apiPost({ action: "login", email, password });
      if (!ok) { setError(data.error || "Неверный email или пароль"); return; }
      localStorage.setItem("yc_token", data.token);
      localStorage.setItem("yc_role", "manager");
      onSuccess({ ...data, role: "manager" });
    } catch { setError("Ошибка соединения. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email) { setError("Введите email"); return; }
    setLoading(true); setError("");
    try {
      await apiPost({ action: "forgot-password", email });
      setSuccess("Если этот email зарегистрирован — письмо с кодом уже в пути.");
      setMode("reset");
    } catch { setError("Ошибка соединения."); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!resetCode || !newPassword) { setError("Заполните все поля"); return; }
    if (newPassword.length < 8) { setError("Пароль минимум 8 символов"); return; }
    setLoading(true); setError("");
    try {
      const { ok, data } = await apiPost({ action: "reset-password", email, code: resetCode, new_password: newPassword });
      if (!ok) { setError(data.error || "Неверный код"); return; }
      setSuccess("Пароль успешно изменён! Теперь войдите с новым паролем.");
      setMode("login");
      setPassword(""); setResetCode(""); setNewPassword("");
    } catch { setError("Ошибка соединения."); }
    finally { setLoading(false); }
  };

  const waveBg = (
    <div className="absolute inset-0 pointer-events-none opacity-10">
      <svg viewBox="0 0 1440 200" className="absolute bottom-0 w-full" fill="white" preserveAspectRatio="none">
        <path d="M0,80 C360,140 720,20 1080,80 C1260,110 1380,50 1440,80 L1440,200 L0,200 Z" />
      </svg>
    </div>
  );
  const inputCls = "w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] focus:border-transparent";
  const btnCls = "w-full bg-[hsl(213,70%,28%)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[hsl(213,80%,20%)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2";

  return (
    <div className="min-h-screen wave-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {waveBg}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Abeona Club" className="w-24 h-24 object-contain mx-auto mb-3 drop-shadow-lg" />
          <p className="text-blue-200 text-sm">Вход для менеджеров</p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          {mode === "login" && (
            <>
              <h2 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)] mb-6">Добро пожаловать</h2>
              {success && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in"><Icon name="CheckCircle" size={15} />{success}</div>}
              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in"><Icon name="AlertCircle" size={15} className="flex-shrink-0" />{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                  <input type="email" className={inputCls} placeholder="tatiana@abeona.club" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted-foreground">Пароль</label>
                    <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} className="text-xs text-[hsl(199,65%,45%)] hover:underline">Забыли пароль?</button>
                  </div>
                  <input type="password" className={inputCls} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
                <button onClick={handleLogin} disabled={loading} className={btnCls}>
                  {loading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                  {loading ? "Вход..." : "Войти"}
                </button>
              </div>
            </>
          )}
          {mode === "forgot" && (
            <>
              <button onClick={() => { setMode("login"); setError(""); }} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 hover:text-[hsl(213,70%,28%)] transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <h2 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)] mb-2">Сброс пароля</h2>
              <p className="text-sm text-muted-foreground mb-5">Введите ваш email — мы отправим код для создания нового пароля.</p>
              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in"><Icon name="AlertCircle" size={15} />{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                  <input type="email" className={inputCls} placeholder="tatiana@abeona.club" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleForgot()} />
                </div>
                <button onClick={handleForgot} disabled={loading} className={btnCls}>
                  {loading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Mail" size={16} />}
                  {loading ? "Отправляем..." : "Отправ