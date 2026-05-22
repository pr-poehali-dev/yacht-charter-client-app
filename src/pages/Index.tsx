import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";

// ─── Types ────────────────────────────────────────────────────────────────────
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
            <button className="mt-4 w-full bg-[hsl(213,70%,28%)] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[hsl(213,80%,20%)] transition-colors">
              Оплатить
            </button>
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
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[hsl(213,80%,13%)] flex flex-col transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
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

        {/* Booking mini */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/8 border border-white/10">
          <p className="text-blue-300 text-xs mb-1">Рейс</p>
          <p className="text-white text-sm font-semibold leading-tight">{booking.yachtName}</p>
          <p className="text-blue-300 text-xs mt-1 flex items-center gap-1">
            <Icon name="Calendar" size={10} />
            {booking.dateFrom} — {booking.dateTo}
          </p>
        </div>

        {/* Nav */}
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

        {/* Manager */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(199,65%,45%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">ЕМ</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Елена Морская</p>
              <p className="text-blue-300 text-xs">Ваш менеджер</p>
            </div>
            <button onClick={() => setActiveSection("messages")} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Icon name="MessageCircle" size={14} className="text-blue-200" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;