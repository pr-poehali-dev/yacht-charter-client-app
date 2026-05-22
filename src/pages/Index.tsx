import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "select" | "client" | "manager";

type ManagerSection = "dashboard" | "bookings" | "create" | "clients" | "messages";

type Section =
  | "booking"
  | "crew"
  | "documents"
  | "payments"
  | "messages"
  | "marina"
  | "reminders"
  | "routes";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const booking = {
  yachtName: "Beneteau Oceanis 51.1",
  yachtType: "Парусная яхта",
  flag: "🇭🇷",
  marina: "ACI Marina Split",
  country: "Хорватия",
  dateFrom: "14 июля 2025",
  dateTo: "21 июля 2025",
  nights: 7,
  status: "Подтверждено",
  captain: "Алексей Воронов",
  cabins: 4,
  berths: 8,
  length: "15.3 м",
  engine: "2 × 57 л.с.",
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

const marina = {
  name: "ACI Marina Split",
  address: "Uvala Baluni, 21000 Сплит, Хорватия",
  phone: "+385 21 398 548",
  email: "split@aci-club.hr",
  vhf: "Channel 17",
  coordinates: "43°30′05″ N, 16°24′10″ E",
  checkin: "14:00",
  checkout: "09:00",
  instructions: [
    "Прибыть не ранее 14:00 в день начала чартера",
    "Связаться с шкипером по VHF CH 17 при подходе",
    "Документы на яхту и паспорта передать менеджеру марины",
    "Брифинг по безопасности обязателен перед выходом",
    "Топливо заправить до возвращения в марину",
  ],
};

// ─── Manager Mock Data ────────────────────────────────────────────────────────
const managerBookings = [
  { id: 1, client: "Дмитрий Орлов", yacht: "Beneteau Oceanis 51.1", marina: "ACI Split", dateFrom: "14 июл", dateTo: "21 июл", status: "confirmed", paid: 4700, total: 10150, crew: 4 },
  { id: 2, client: "Сергей Васильев", yacht: "Jeanneau Sun Odyssey 440", marina: "ACI Dubrovnik", dateFrom: "22 июл", dateTo: "29 июл", status: "pending", paid: 2000, total: 8400, crew: 6 },
  { id: 3, client: "Ольга Стрелкова", yacht: "Bavaria C42", marina: "Marina Hvar", dateFrom: "05 авг", dateTo: "12 авг", status: "new", paid: 0, total: 6200, crew: 3 },
  { id: 4, client: "Андрей Климов", yacht: "Dufour 460 GL", marina: "ACI Rovinj", dateFrom: "18 авг", dateTo: "25 авг", status: "confirmed", paid: 9600, total: 9600, crew: 5 },
];

const managerClients = [
  { id: 1, name: "Дмитрий Орлов", email: "d.orlov@mail.ru", phone: "+7 916 123-45-67", bookings: 3, lastBooking: "июл 2025" },
  { id: 2, name: "Сергей Васильев", email: "s.vasiliev@gmail.com", phone: "+7 903 987-65-43", bookings: 1, lastBooking: "июл 2025" },
  { id: 3, name: "Ольга Стрелкова", email: "o.strelkova@yandex.ru", phone: "+7 926 555-11-22", bookings: 2, lastBooking: "авг 2025" },
  { id: 4, name: "Андрей Климов", email: "a.klimov@mail.ru", phone: "+7 985 444-33-11", bookings: 1, lastBooking: "авг 2025" },
];

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const navItems: { id: Section; label: string; icon: string; badge?: number }[] = [
  { id: "booking", label: "Бронирование", icon: "Anchor" },
  { id: "crew", label: "Экипаж", icon: "Users", badge: 2 },
  { id: "documents", label: "Документы", icon: "FileText" },
  { id: "payments", label: "Платежи", icon: "CreditCard", badge: 1 },
  { id: "messages", label: "Сообщения", icon: "MessageCircle", badge: 1 },
  { id: "marina", label: "Марина", icon: "MapPin" },
  { id: "reminders", label: "Напоминания", icon: "Bell", badge: 5 },
  { id: "routes", label: "Маршруты", icon: "Navigation" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────
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
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────────
function BookingSection() {
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
              <h2 className="font-display text-4xl font-semibold">{booking.yachtName}</h2>
              <p className="text-blue-200 mt-1 text-sm">{booking.yachtType} · {booking.flag} {booking.country}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-medium">
              <Icon name="CheckCircle" size={14} />
              {booking.status}
            </span>
          </div>
          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Отход", value: booking.dateFrom, icon: "CalendarCheck" },
              { label: "Возврат", value: booking.dateTo, icon: "CalendarX" },
              { label: "Ночей", value: String(booking.nights), icon: "Moon" },
              { label: "Марина", value: "ACI Split", icon: "Anchor" },
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
              { label: "Длина", value: booking.length, icon: "Ruler" },
              { label: "Каюты / места", value: `${booking.cabins} / ${booking.berths}`, icon: "BedDouble" },
              { label: "Двигатель", value: booking.engine, icon: "Zap" },
              { label: "Шкипер", value: booking.captain, icon: "User" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-blue-100 last:border-0">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name={item.icon} size={14} className="text-[hsl(199,65%,45%)]" />
                  {item.label}
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
              { icon: "MapPin", text: marina.name, sub: marina.address },
              { icon: "Radio", text: `VHF ${marina.vhf}` },
              { icon: "Phone", text: marina.phone },
              { icon: "Clock", text: `Заезд: ${marina.checkin} · Выезд: ${marina.checkout}` },
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
                      <Icon name={doc.val ? "Check" : "X"} size={11} />
                      {doc.label}
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
  const iconByType: Record<string, string> = {
    contract: "FileSignature",
    invoice: "Receipt",
    insurance: "Shield",
    passport: "BookUser",
  };
  return (
    <div className="animate-fade-in">
      <div className="ocean-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">Документы</h3>
          <button className="flex items-center gap-2 bg-[hsl(213,70%,28%)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[hsl(213,80%,20%)] transition-colors">
            <Icon name="Upload" size={14} />
            Загрузить
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Срок: {pay.dueDate}{pay.paidDate && ` · Оплачено: ${pay.paidDate}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">
                {pay.amount.toLocaleString("ru")} <span className="text-sm font-body">EUR</span>
              </p>
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
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
              Онлайн
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

function MarinaSection() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="wave-bg rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">Марина прибытия</p>
        <h2 className="font-display text-3xl font-semibold">{marina.name}</h2>
        <p className="text-blue-200 text-sm mt-1 flex items-center gap-1.5">
          <Icon name="MapPin" size={13} />
          {marina.address}
        </p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "VHF", value: marina.vhf, icon: "Radio" },
            { label: "Телефон", value: marina.phone, icon: "Phone" },
            { label: "Email", value: marina.email, icon: "Mail" },
            { label: "Координаты", value: marina.coordinates, icon: "Compass" },
            { label: "Заезд", value: marina.checkin, icon: "LogIn" },
            { label: "Выезд", value: marina.checkout, icon: "LogOut" },
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
          <Icon name="BookOpen" size={17} className="text-[hsl(199,65%,45%)]" />
          Инструкции
        </h3>
        <ul className="space-y-3">
          {marina.instructions.map((inst, i) => (
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
              <Icon
                name={done.includes(r.id) ? "CheckCircle2" : priorityIcon[r.priority] || "Bell"}
                size={18}
                className={done.includes(r.id) ? "text-emerald-500 mt-0.5" : `${priorityColor[r.priority] || ""} mt-0.5`}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${done.includes(r.id) ? "line-through text-muted-foreground" : "text-[hsl(213,80%,15%)]"}`}>{r.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="Calendar" size={11} />{r.date}
                </p>
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
                  <span className="bg-[hsl(45,85%,90%)] text-[hsl(38,75%,35%)] border border-[hsl(45,85%,70%)] text-xs px-2.5 py-0.5 rounded-full font-medium">
                    ⭐ {route.highlight}
                  </span>
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
                <Icon name={item.icon} size={12} />
                {item.val}
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

// ─── Role Select Screen ───────────────────────────────────────────────────────
function RoleSelect({ onSelect }: { onSelect: (role: "client" | "manager") => void }) {
  return (
    <div className="min-h-screen wave-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg viewBox="0 0 1440 200" className="absolute bottom-0 w-full" fill="white" preserveAspectRatio="none">
          <path d="M0,80 C360,140 720,20 1080,80 C1260,110 1380,50 1440,80 L1440,200 L0,200 Z" />
        </svg>
        <svg viewBox="0 0 1440 200" className="absolute bottom-8 w-full opacity-50" fill="white" preserveAspectRatio="none">
          <path d="M0,100 C480,40 960,160 1440,100 L1440,200 L0,200 Z" />
        </svg>
      </div>
      <div className="relative z-10 text-center mb-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(45,85%,55%)] flex items-center justify-center mx-auto mb-5">
          <Icon name="Anchor" size={32} className="text-[hsl(213,80%,15%)]" />
        </div>
        <h1 className="font-display text-5xl font-semibold text-white mb-2">YachtCharter</h1>
        <p className="text-blue-200 text-base">Выберите режим входа</p>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        <button
          onClick={() => onSelect("client")}
          className="group bg-white/12 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-2xl p-8 text-left transition-all duration-200 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="w-12 h-12 rounded-xl bg-[hsl(199,65%,45%)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Icon name="User" size={22} className="text-white" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">Клиент</h2>
          <p className="text-blue-200 text-sm leading-relaxed">Просмотр бронирования, экипаж, документы, переписка с менеджером</p>
          <div className="mt-5 flex items-center gap-1.5 text-[hsl(45,85%,65%)] text-sm font-medium">
            Войти как клиент
            <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <button
          onClick={() => onSelect("manager")}
          className="group bg-white/12 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-[hsl(45,85%,55%)]/60 rounded-2xl p-8 text-left transition-all duration-200 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-12 h-12 rounded-xl bg-[hsl(45,85%,55%)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Icon name="Settings" size={22} className="text-[hsl(213,80%,15%)]" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">Менеджер</h2>
          <p className="text-blue-200 text-sm leading-relaxed">Управление бронированиями, создание рейсов, клиенты, напоминания</p>
          <div className="mt-5 flex items-center gap-1.5 text-[hsl(45,85%,65%)] text-sm font-medium">
            Войти как менеджер
            <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Manager Status Badge ─────────────────────────────────────────────────────
function MgrStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Подтверждено", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    pending: { label: "Ожидает", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    new: { label: "Новое", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    cancelled: { label: "Отменено", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard({ setSection }: { setSection: (s: ManagerSection) => void }) {
  const totalRevenue = managerBookings.reduce((a, b) => a + b.paid, 0);
  const confirmed = managerBookings.filter((b) => b.status === "confirmed").length;
  const pending = managerBookings.filter((b) => b.status === "pending" || b.status === "new").length;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Бронирований", value: managerBookings.length, icon: "CalendarCheck", color: "bg-blue-50 text-blue-600" },
          { label: "Подтверждено", value: confirmed, icon: "CheckCircle", color: "bg-emerald-50 text-emerald-600" },
          { label: "Требует внимания", value: pending, icon: "Clock", color: "bg-amber-50 text-amber-600" },
          { label: "Поступило EUR", value: `${totalRevenue.toLocaleString("ru")}`, icon: "Banknote", color: "bg-violet-50 text-violet-600" },
        ].map((stat, i) => (
          <div key={i} className="ocean-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <Icon name={stat.icon} size={17} />
            </div>
            <p className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="ocean-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">Последние бронирования</h3>
          <button onClick={() => setSection("bookings")} className="text-xs text-[hsl(199,65%,45%)] hover:underline font-medium">Все →</button>
        </div>
        <div className="space-y-3">
          {managerBookings.slice(0, 3).map((b, idx) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="w-9 h-9 rounded-full bg-[hsl(213,70%,28%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {b.client.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[hsl(213,80%,15%)] truncate">{b.client}</p>
                <p className="text-xs text-muted-foreground truncate">{b.yacht} · {b.marina}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-[hsl(213,80%,15%)]">{b.dateFrom} — {b.dateTo}</p>
                <MgrStatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setSection("create")}
        className="w-full wave-bg text-white rounded-2xl p-5 flex items-center justify-between group hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(45,85%,55%)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Icon name="Plus" size={20} className="text-[hsl(213,80%,15%)]" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">Новое бронирование</p>
            <p className="text-blue-200 text-xs">Заполните данные яхты, клиента и марины</p>
          </div>
        </div>
        <Icon name="ArrowRight" size={18} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

// ─── Manager Bookings List ────────────────────────────────────────────────────
function ManagerBookingsList() {
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "new">("all");
  const filtered = filter === "all" ? managerBookings : managerBookings.filter((b) => b.status === filter);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex gap-2 flex-wrap">
        {(["all", "confirmed", "pending", "new"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-[hsl(213,70%,28%)] text-white" : "bg-white border border-blue-200 text-[hsl(213,70%,28%)] hover:bg-blue-50"}`}
          >
            {{ all: "Все", confirmed: "Подтверждённые", pending: "Ожидают", new: "Новые" }[f]}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((b, idx) => {
          const paidPct = Math.round((b.paid / b.total) * 100);
          return (
            <div key={b.id} className="ocean-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${idx * 0.07}s` }}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="font-semibold text-[hsl(213,80%,15%)]">{b.client}</p>
                  <p className="text-sm text-muted-foreground">{b.yacht}</p>
                </div>
                <MgrStatusBadge status={b.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { icon: "MapPin", val: b.marina },
                  { icon: "Calendar", val: `${b.dateFrom} — ${b.dateTo}` },
                  { icon: "Users", val: `${b.crew} чел.` },
                ].map((item) => (
                  <span key={item.val} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name={item.icon} size={12} className="text-[hsl(199,65%,45%)] flex-shrink-0" />
                    <span className="truncate">{item.val}</span>
                  </span>
                ))}
              </div>
              <div className="border-t border-blue-100 pt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Оплата</span>
                  <span className="font-medium text-[hsl(213,80%,15%)]">{b.paid.toLocaleString("ru")} / {b.total.toLocaleString("ru")} EUR</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[hsl(213,70%,28%)] transition-all" style={{ width: `${paidPct}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 border border-[hsl(213,70%,28%)] text-[hsl(213,70%,28%)] py-2 rounded-xl text-xs font-semibold hover:bg-[hsl(213,70%,28%)] hover:text-white transition-all">
                  Открыть
                </button>
                <button className="flex-1 border border-blue-200 text-muted-foreground py-2 rounded-xl text-xs font-medium hover:bg-blue-50 transition-colors">
                  Сообщение
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Manager Create Booking ───────────────────────────────────────────────────
function ManagerCreateBooking() {
  const [form, setForm] = useState({ client: "", yacht: "", marina: "", dateFrom: "", dateTo: "", crew: "", status: "new", notes: "" });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div className="space-y-5 animate-fade-in">
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <Icon name="CheckCircle" size={16} />
          Бронирование создано успешно
        </div>
      )}
      <div className="ocean-card rounded-2xl p-6 space-y-5">
        <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">Данные клиента</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "client", label: "Имя клиента", placeholder: "Иван Иванов" },
          ].map((field) => (
            <div key={field.key} className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
              <input
                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] focus:border-transparent"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ocean-card rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">Яхта и марина</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "yacht", label: "Название яхты", placeholder: "Beneteau Oceanis 51.1" },
            { key: "marina", label: "Марина", placeholder: "ACI Marina Split" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
              <input
                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] focus:border-transparent"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ocean-card rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">Даты и экипаж</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "dateFrom", label: "Дата начала", placeholder: "14.07.2025", type: "date" },
            { key: "dateTo", label: "Дата конца", placeholder: "21.07.2025", type: "date" },
            { key: "crew", label: "Кол-во человек", placeholder: "4", type: "number" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
              <input
                type={field.type || "text"}
                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] focus:border-transparent"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ocean-card rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold text-[hsl(213,80%,15%)]">Статус и заметки</h3>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Статус</label>
          <select
            className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] appearance-none"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="new">Новое</option>
            <option value="pending">Ожидает подтверждения</option>
            <option value="confirmed">Подтверждено</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Заметки</label>
          <textarea
            className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(199,65%,45%)] resize-none"
            rows={3}
            placeholder="Пожелания клиента, особые условия..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-[hsl(213,70%,28%)] text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-[hsl(213,80%,20%)] transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="Plus" size={16} />
        Создать бронирование
      </button>
    </div>
  );
}

// ─── Manager Clients ──────────────────────────────────────────────────────────
function ManagerClients() {
  return (
    <div className="space-y-4 animate-fade-in">
      {managerClients.map((c, idx) => (
        <div key={c.id} className="ocean-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${idx * 0.07}s` }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-[hsl(213,70%,28%)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-[hsl(213,80%,15%)]">{c.name}</p>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {c.bookings} {c.bookings === 1 ? "бронирование" : "бронирования"}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon name="Mail" size={11} className="text-[hsl(199,65%,45%)]" />{c.email}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon name="Phone" size={11} className="text-[hsl(199,65%,45%)]" />{c.phone}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon name="Calendar" size={11} className="text-[hsl(199,65%,45%)]" />Последнее: {c.lastBooking}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 border border-[hsl(213,70%,28%)] text-[hsl(213,70%,28%)] py-2 rounded-xl text-xs font-semibold hover:bg-[hsl(213,70%,28%)] hover:text-white transition-all">Профиль</button>
            <button className="flex-1 border border-blue-200 text-muted-foreground py-2 rounded-xl text-xs font-medium hover:bg-blue-50 transition-colors">Написать</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Manager Panel ────────────────────────────────────────────────────────────
const managerNavItems: { id: ManagerSection; label: string; icon: string; badge?: number }[] = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "bookings", label: "Бронирования", icon: "CalendarCheck", badge: managerBookings.filter(b => b.status === "new").length },
  { id: "create", label: "Новое бронирование", icon: "Plus" },
  { id: "clients", label: "Клиенты", icon: "Users" },
  { id: "messages", label: "Сообщения", icon: "MessageCircle", badge: 2 },
];

const managerSectionTitles: Record<ManagerSection, string> = {
  dashboard: "Дашборд",
  bookings: "Бронирования",
  create: "Новое бронирование",
  clients: "Клиенты",
  messages: "Сообщения",
};

function ManagerPanel({ onLogout }: { onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState<ManagerSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <ManagerDashboard setSection={setActiveSection} />;
      case "bookings": return <ManagerBookingsList />;
      case "create": return <ManagerCreateBooking />;
      case "clients": return <ManagerClients />;
      case "messages": return <MessagesSection />;
      default: return <ManagerDashboard setSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "hsl(213,75%,11%)" }}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(45,85%,55%)] flex items-center justify-center">
              <Icon name="Anchor" size={20} className="text-[hsl(213,80%,15%)]" />
            </div>
            <div>
              <p className="font-display text-white text-lg font-semibold leading-tight">YachtCharter</p>
              <p className="text-[hsl(45,85%,65%)] text-xs font-medium">Панель менеджера</p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/8 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[hsl(45,85%,55%)] flex items-center justify-center text-[hsl(213,80%,15%)] text-xs font-bold flex-shrink-0">ЕМ</div>
            <div>
              <p className="text-white text-sm font-semibold">Елена Морская</p>
              <p className="text-blue-300 text-xs">Старший менеджер</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
          {managerNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? "bg-white/15 text-white" : "text-blue-200 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span className="w-5 h-5 rounded-full bg-[hsl(45,85%,55%)] text-[hsl(213,80%,15%)] text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-blue-300 hover:text-white hover:bg-white/8 transition-all">
            <Icon name="LogOut" size={15} />
            Сменить роль
          </button>
        </div>
      </aside>
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-blue-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-xl bg-[hsl(199,60%,88%)] flex items-center justify-center" onClick={() => setMobileMenuOpen(true)}>
              <Icon name="Menu" size={17} className="text-[hsl(213,70%,28%)]" />
            </button>
            <h1 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">{managerSectionTitles[activeSection]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-[hsl(45,85%,90%)] text-[hsl(38,75%,35%)] border border-[hsl(45,85%,70%)] px-3 py-1.5 rounded-full font-medium">
              <Icon name="Settings" size={12} />
              Менеджер
            </span>
            <div className="w-9 h-9 rounded-xl bg-[hsl(45,85%,55%)] flex items-center justify-center text-[hsl(213,80%,15%)] text-xs font-bold">ЕМ</div>
          </div>
        </header>
        <div className="flex-1 px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

// ─── Client Panel ──────────────────────────────────────────────────────────────
function ClientPanel({ onLogout }: { onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState<Section>("booking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "booking": return <BookingSection />;
      case "crew": return <CrewSection />;
      case "documents": return <DocumentsSection />;
      case "payments": return <PaymentsSection />;
      case "messages": return <MessagesSection />;
      case "marina": return <MarinaSection />;
      case "reminders": return <RemindersSection />;
      case "routes": return <RoutesSection />;
      default: return <BookingSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[hsl(213,80%,13%)] flex flex-col transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(45,85%,55%)] flex items-center justify-center">
              <Icon name="Anchor" size={20} className="text-[hsl(213,80%,15%)]" />
            </div>
            <div>
              <p className="font-display text-white text-lg font-semibold leading-tight">YachtCharter</p>
              <p className="text-blue-300 text-xs">Личный кабинет</p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/8 border border-white/10">
          <p className="text-blue-300 text-xs mb-1">Рейс</p>
          <p className="text-white text-sm font-semibold leading-tight">{booking.yachtName}</p>
          <p className="text-blue-300 text-xs mt-1 flex items-center gap-1">
            <Icon name="Calendar" size={10} />
            {booking.dateFrom} — {booking.dateTo}
          </p>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? "bg-white/15 text-white" : "text-blue-200 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-[hsl(45,85%,55%)] text-[hsl(213,80%,15%)] text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-3 px-1 mb-2">
            <div className="w-9 h-9 rounded-full bg-[hsl(199,65%,45%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">ЕМ</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Елена Морская</p>
              <p className="text-blue-300 text-xs">Ваш менеджер</p>
            </div>
            <button onClick={() => setActiveSection("messages")} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Icon name="MessageCircle" size={14} className="text-blue-200" />
            </button>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-blue-300 hover:text-white hover:bg-white/8 transition-all">
            <Icon name="LogOut" size={14} />
            Сменить роль
          </button>
        </div>
      </aside>
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-blue-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-xl bg-[hsl(199,60%,88%)] flex items-center justify-center" onClick={() => setMobileMenuOpen(true)}>
              <Icon name="Menu" size={17} className="text-[hsl(213,70%,28%)]" />
            </button>
            <h1 className="font-display text-2xl font-semibold text-[hsl(213,80%,15%)]">{sectionTitles[activeSection]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSection("reminders")} className="relative w-9 h-9 rounded-xl bg-[hsl(199,60%,88%)] hover:bg-[hsl(199,50%,80%)] flex items-center justify-center transition-colors">
              <Icon name="Bell" size={16} className="text-[hsl(213,70%,28%)]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[hsl(213,70%,28%)] flex items-center justify-center text-white text-xs font-semibold">ДО</div>
          </div>
        </header>
        <div className="flex-1 px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const sectionTitles: Record<Section, string> = {
  booking: "Бронирование",
  crew: "Экипаж",
  documents: "Документы",
  payments: "Платежи",
  messages: "Сообщения",
  marina: "Марина",
  reminders: "Напоминания",
  routes: "Маршруты",
};

const Index = () => {
  const [role, setRole] = useState<Role>("select");

  if (role === "select") return <RoleSelect onSelect={setRole} />;
  if (role === "manager") return <ManagerPanel onLogout={() => setRole("select")} />;
  return <ClientPanel onLogout={() => setRole("select")} />;
};

export default Index;