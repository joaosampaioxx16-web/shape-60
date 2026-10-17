import React, { useMemo, useState } from "react";

const DAY_MS = 86400000;

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateToUTC(date) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function shiftDate(date, days) {
  return new Date(dateToUTC(date) + days * DAY_MS).toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

const GOALS = [
  { id: "workout", label: "Treino planejado", detail: "Treino realizado ou sessão alternativa prevista." },
  { id: "logWorkout", label: "Registrei o treino", detail: "Exercícios, séries, repetições e cargas, quando aplicável." },
  { id: "cardio", label: "Cardio planejado", detail: "Marque como não aplicável nos dias sem cardio." },
  { id: "meal1", label: "Primeira refeição", detail: "Refeição realizada ou substituída." },
  { id: "meal2", label: "Segunda refeição", detail: "Refeição realizada ou substituída." },
  { id: "meal3", label: "Terceira refeição", detail: "Refeição realizada ou substituída." },
  { id: "nutrition", label: "Aderência alimentar", detail: "Segui o planejamento de forma flexível." },
  { id: "water", label: "Meta de hidratação", detail: "Atingi a meta configurada para hoje." },
  { id: "rest", label: "Rotina de recuperação", detail: "Respeitei o descanso e cuidei da recuperação." },
  { id: "plan", label: "Planejei o próximo dia", detail: "Organizei treino e alimentação de amanhã." },
  { id: "reflection", label: "Registrei meu dia", detail: "Adicionei uma observação ou revisei meu progresso." },
];

const MEAL_DEFAULTS = [
  { name: "Almoço", suggestion: "Arroz, feijão, frango ou ovos e legumes/verduras." },
  { name: "Café da tarde", suggestion: "Ovos, pão, aveia ou fruta; adapte ao seu planejamento." },
  { name: "Jantar", suggestion: "Arroz, feijão, uma proteína disponível e legumes/verduras." },
];

const navItems = [
  ["home", "Início", "⌂"],
  ["checklist", "Checklist", "✓"],
  ["training", "Treino", "⌁"],
  ["food", "Refeições", "◉"],
  ["progress", "Evolução", "↗"],
  ["report", "Relatório", "▤"],
  ["settings", "Ajustes", "⚙"],
];

function App() {
  const today = todayInSaoPaulo();
  const [page, setPage] = useState("home");
  const [selectedDate, setSelectedDate] = useState(today);
  const [startDate, setStartDate] = useState(today);
  const [profile, setProfile] = useState({ name: "João", age: 23, height: 175, startWeight: 78.5 });
  const [waterGoal, setWaterGoal] = useState(2000);
  const [workoutDays, setWorkoutDays] = useState([1, 2, 3, 4, 5]);
  const [cardioDays, setCardioDays] = useState([2, 4, 6]);
  const [enabledGoals, setEnabledGoals] = useState(Object.fromEntries(GOALS.map((g) => [g.id, true])));
  const [records, setRecords] = useState({});
  const [waterCustom, setWaterCustom] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [mealInputs, setMealInputs] = useState(["", "", ""]);
  const [workoutName, setWorkoutName] = useState("Treino do dia");
  const [workoutStatus, setWorkoutStatus] = useState("Planejado");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("Boa");

  const endDate = shiftDate(startDate, 59);
  const projectDay = Math.floor((dateToUTC(today) - dateToUTC(startDate)) / DAY_MS) + 1;
  const isBefore = today < startDate;
  const isFinished = today > endDate;
  const activeDay = Math.min(60, Math.max(0, projectDay));
  const temporalProgress = Math.min(100, Math.max(0, (activeDay / 60) * 100));
  const selectedRecord = records[selectedDate] || { checks: {}, waterEvents: [], meals: {}, weights: [] };
  const selectedWeekday = new Date(`${selectedDate}T12:00:00Z`).getUTCDay();
  const selectedIsWorkoutDay = workoutDays.includes(selectedWeekday);
  const selectedIsCardioDay = cardioDays.includes(selectedWeekday);

  function applicableGoals(date) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const training = workoutDays.includes(weekday);
    const cardio = cardioDays.includes(weekday);
    return GOALS.filter((goal) => {
      if (!enabledGoals[goal.id]) return false;
      if (goal.id === "workout" || goal.id === "logWorkout") return training;
      if (goal.id === "cardio") return cardio;
      return true;
    });
  }

  function getRecord(date) {
    return records[date] || { checks: {}, waterEvents: [], meals: {}, weights: [] };
  }

  function updateRecord(date, updater) {
    setRecords((previous) => {
      const current = previous[date] || { checks: {}, waterEvents: [], meals: {}, weights: [] };
      return { ...previous, [date]: updater(current) };
    });
  }

  function toggleGoal(id) {
    updateRecord(selectedDate, (record) => ({
      ...record,
      checks: { ...record.checks, [id]: !record.checks?.[id] },
      updatedAt: new Date().toISOString(),
    }));
  }

  function setCheck(id, value) {
    updateRecord(selectedDate, (record) => ({
      ...record,
      checks: { ...record.checks, [id]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function addWater(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateRecord(selectedDate, (record) => ({
      ...record,
      waterEvents: [...(record.waterEvents || []), { amount, time: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    }));
    setCheck("water", waterTotal(selectedDate) + amount >= waterGoal);
  }

  function waterTotal(date) {
    return (getRecord(date).waterEvents || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  function undoWater() {
    updateRecord(selectedDate, (record) => ({
      ...record,
      waterEvents: (record.waterEvents || []).slice(0, -1),
      updatedAt: new Date().toISOString(),
    }));
  }

  function toggleMeal(index) {
    const key = `meal${index + 1}`;
    const next = !selectedRecord.meals?.[key]?.done;
    updateRecord(selectedDate, (record) => ({
      ...record,
      meals: { ...record.meals, [key]: { ...record.meals?.[key], done: next, foods: mealInputs[index] } },
      checks: { ...record.checks, [key]: next },
      updatedAt: new Date().toISOString(),
    }));
  }

  function saveWeight() {
    const value = Number(weightInput.replace(",", "."));
    if (!value || value < 20 || value > 300) return;
    updateRecord(selectedDate, (record) => ({
      ...record,
      weights: [...(record.weights || []), { value, date: selectedDate }],
      updatedAt: new Date().toISOString(),
    }));
    setWeightInput("");
  }

  function saveNote() {
    updateRecord(selectedDate, (record) => ({
      ...record,
      note: noteInput.trim(),
      updatedAt: new Date().toISOString(),
    }));
    setCheck("reflection", Boolean(noteInput.trim()));
  }

  function saveWorkout() {
    updateRecord(selectedDate, (record) => ({
      ...record,
      workout: { name: workoutName, status: workoutStatus, time: new Date().toISOString() },
      checks: {
        ...record.checks,
        workout: workoutStatus === "Concluído" || workoutStatus === "Substituído",
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  const projectDates = useMemo(() => {
    const end = today < endDate ? today : endDate;
    if (end < startDate) return [];
    const dates = [];
    for (let d = startDate; d <= end; d = shiftDate(d, 1)) dates.push(d);
    return dates;
  }, [startDate, endDate, today, workoutDays, cardioDays, enabledGoals]);

  const totals = useMemo(() => {
    let applicable = 0;
    let completed = 0;
    let registered = 0;
    let perfect = 0;
    let atLeast80 = 0;
    let below50 = 0;
    let dayPercentSum = 0;
    let daysEvaluated = 0;

    for (const date of projectDates) {
      const goals = applicableGoals(date);
      if (!goals.length) continue;
      const record = getRecord(date);
      const hasRecord = Boolean(records[date]);
      if (hasRecord) registered++;
      const done = goals.filter((goal) => record.checks?.[goal.id]).length;
      const percent = hasRecord ? (done / goals.length) * 100 : 0;
      applicable += goals.length;
      completed += done;
      dayPercentSum += percent;
      daysEvaluated++;
      if (percent >= 99.99) perfect++;
      if (percent >= 80) atLeast80++;
      if (percent < 50) below50++;
    }

    let currentStreak = 0;
    for (let d = today; d >= startDate && d <= endDate; d = shiftDate(d, -1)) {
      const goals = applicableGoals(d);
      if (!goals.length) continue;
      const record = getRecord(d);
      const done = goals.filter((goal) => record.checks?.[goal.id]).length;
      if (records[d] && done === goals.length) currentStreak++;
      else break;
    }

    let bestStreak = 0;
    let running = 0;
    for (const date of projectDates) {
      const goals = applicableGoals(date);
      const record = getRecord(date);
      const done = goals.filter((goal) => record.checks?.[goal.id]).length;
      if (goals.length && records[date] && done === goals.length) {
        running++;
        bestStreak = Math.max(bestStreak, running);
      } else if (goals.length) running = 0;
    }

    return {
      consistency: applicable ? (completed / applicable) * 100 : 0,
      dailyAverage: daysEvaluated ? dayPercentSum / daysEvaluated : 0,
      registered, perfect, atLeast80, below50, currentStreak, bestStreak,
      completed, applicable,
    };
  }, [records, projectDates, today, startDate, endDate, workoutDays, cardioDays, enabledGoals]);

  const allWeights = Object.entries(records)
    .flatMap(([date, record]) => (record.weights || []).map((item) => ({ ...item, date: item.date || date })))
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = allWeights[allWeights.length - 1];
  const firstWeight = allWeights[0];
  const currentWater = waterTotal(selectedDate);
  const todayGoals = applicableGoals(selectedDate);
  const doneToday = todayGoals.filter((goal) => selectedRecord.checks?.[goal.id]).length;
  const dayPercent = todayGoals.length ? Math.round((doneToday / todayGoals.length) * 100) : 0;
  const dateIsFuture = selectedDate > today;
  const dateIsPast = selectedDate < today;
  const mealsDone = [1, 2, 3].filter((n) => selectedRecord.meals?.[`meal${n}`]?.done).length;
  const lastSevenWeights = allWeights.slice(-7);
  const averageWeight = lastSevenWeights.length
    ? (lastSevenWeights.reduce((sum, item) => sum + item.value, 0) / lastSevenWeights.length).toFixed(1)
    : null;

  function formatProjectState() {
    if (isBefore) return "Preparação";
    if (isFinished) return "Fase ativa encerrada";
    return `Dia ${activeDay} de 60`;
  }

  function finishDay() {
    const missing = todayGoals.filter((goal) => !selectedRecord.checks?.[goal.id]);
    const completedLabels = todayGoals.filter((goal) => selectedRecord.checks?.[goal.id]).map((goal) => goal.label);
    window.alert(
      `Resumo de ${formatDate(selectedDate)}\n\n${completedLabels.length ? `Concluído: ${completedLabels.join(", ")}` : "Ainda sem metas concluídas."}\n\n${missing.length ? `Pendentes: ${missing.map((goal) => goal.label).join(", ")}` : "Todas as metas aplicáveis foram concluídas."}\n\nVocê pode continuar editando este dia.`
    );
  }

  function exportCSV() {
    const lines = [["Data", "Dia do projeto", "Metas concluídas", "Metas aplicáveis", "Consistência %", "Água ml", "Peso kg", "Observações"]];
    for (const date of projectDates) {
      const goals = applicableGoals(date);
      const record = getRecord(date);
      const done = goals.filter((goal) => record.checks?.[goal.id]).length;
      const percent = goals.length && records[date] ? Math.round((done / goals.length) * 100) : 0;
      const weight = (record.weights || []).at(-1)?.value ?? "";
      const dayNumber = Math.floor((dateToUTC(date) - dateToUTC(startDate)) / DAY_MS) + 1;
      lines.push([date, dayNumber, done, goals.length, percent, waterTotal(date), weight, record.note || ""]);
    }
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = "shape-60-relatorio.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const cardClass = "rounded-2xl border border-white/10 bg-[#171a19] p-4 shadow-lg shadow-black/10";
  const muted = "text-sm text-zinc-400";
  const buttonClass = "rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40";
  const softButton = "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10";
  const inputClass = "w-full rounded-xl border border-white/10 bg-[#101211] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400";
  const percentWidth = (value) => `${Math.max(0, Math.min(100, value))}%`;

  function SectionTitle({ eyebrow, title, description }) {
    return (
      <div className="mb-5">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-lime-300">{eyebrow}</p>}
        <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
        {description && <p className={`mt-1 ${muted}`}>{description}</p>}
      </div>
    );
  }

  function ProgressBar({ value, color = "bg-lime-400" }) {
    return (
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: percentWidth(value) }} />
      </div>
    );
  }

  function DayPicker() {
    return (
      <div className="flex items-center gap-2">
        <button className={softButton} onClick={() => setSelectedDate((d) => shiftDate(d, -1))} aria-label="Dia anterior">←</button>
        <input className={`${inputClass} max-w-[165px]`} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button className={softButton} disabled={selectedDate >= today} onClick={() => setSelectedDate((d) => shiftDate(d, 1))} aria-label="Próximo dia">→</button>
      </div>
    );
  }

  function WaterModule() {
    return (
      <div className={cardClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={muted}>Hidratação do dia</p>
            <p className="mt-1 text-3xl font-black text-white">{currentWater.toLocaleString("pt-BR")} <span className="text-base font-semibold text-zinc-400">ml</span></p>
            <p className="mt-1 text-sm text-zinc-400">Meta: {waterGoal.toLocaleString("pt-BR")} ml · faltam {Math.max(0, waterGoal - currentWater).toLocaleString("pt-BR")} ml</p>
          </div>
          <span className="rounded-xl bg-lime-400/10 px-3 py-2 text-sm font-bold text-lime-300">
            {waterGoal ? Math.min(100, Math.round((currentWater / waterGoal) * 100)) : 0}%
          </span>
        </div>
        <div className="mt-4"><ProgressBar value={waterGoal ? (currentWater / waterGoal) * 100 : 0} /></div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[100, 200, 300, 500].map((amount) => (
            <button key={amount} className={softButton} onClick={() => addWater(amount)} disabled={dateIsFuture}>+{amount}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className={inputClass} type="number" min="1" placeholder="Quantidade personalizada (ml)" value={waterCustom} onChange={(e) => setWaterCustom(e.target.value)} />
          <button className={buttonClass} disabled={dateIsFuture || !waterCustom} onClick={() => { addWater(Number(waterCustom)); setWaterCustom(""); }}>Adicionar</button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className={muted}>{(selectedRecord.waterEvents || []).length} registros hoje</p>
          <button className="text-xs text-zinc-400 underline hover:text-white" onClick={undoWater} disabled={dateIsFuture || !selectedRecord.waterEvents?.length}>Desfazer último</button>
        </div>
      </div>
    );
  }

  function Checklist() {
    return (
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-white">Metas aplicáveis</p>
            <p className={muted}>{doneToday} de {todayGoals.length} concluídas · {dayPercent}%</p>
          </div>
          <span className="text-xl font-black text-lime-300">{dayPercent}%</span>
        </div>
        <ProgressBar value={dayPercent} />
        <div className="mt-4 space-y-2">
          {todayGoals.map((goal) => {
            const checked = Boolean(selectedRecord.checks?.[goal.id]);
            return (
              <button key={goal.id} disabled={dateIsFuture} onClick={() => toggleGoal(goal.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${checked ? "border-lime-300/20 bg-lime-300/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"} ${dateIsFuture ? "opacity-50" : ""}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${checked ? "border-lime-400 bg-lime-400 text-zinc-950" : "border-zinc-600 text-transparent"}`}>✓</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${checked ? "text-lime-100" : "text-zinc-200"}`}>{goal.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{goal.detail}</span>
                </span>
                {checked && <span className="text-xs font-semibold text-lime-300">Feito</span>}
              </button>
            );
          })}
        </div>
        {!todayGoals.length && <p className="mt-4 text-sm text-zinc-400">Configure metas aplicáveis para este dia.</p>}
      </div>
    );
  }

  function HomePage() {
    return (
      <>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-300">Painel pessoal</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">Seu dia, no controle.</h2>
            <p className="mt-1 text-sm text-zinc-400">{formatDate(today)} · {formatProjectState()}</p>
          </div>
          <button className={buttonClass} onClick={() => setPage("checklist")}>Iniciar registro do dia <span className="ml-1">→</span></button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className={`${cardClass} relative overflow-hidden`}>
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-lime-300/5 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className={muted}>SHAPE 60 · PROGRESSO TEMPORAL</p>
                <p className="mt-2 text-4xl font-black text-white">{isBefore ? "—" : `${activeDay}`}<span className="text-xl text-zinc-500"> / 60</span></p>
                <p className="mt-1 text-sm text-zinc-400">{isBefore ? `Início em ${formatDate(startDate)}` : isFinished ? `Concluído em ${formatDate(endDate)}` : `${60 - activeDay} dias restantes`}</p>
              </div>
              <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-right">
                <p className="text-xs text-zinc-400">Consistência acumulada</p>
                <p className="text-2xl font-black text-lime-300">{totals.consistency.toFixed(0)}%</p>
              </div>
            </div>
            <div className="relative mt-5">
              <div className="mb-2 flex justify-between text-xs text-zinc-400"><span>Tempo do projeto</span><span>{temporalProgress.toFixed(0)}%</span></div>
              <ProgressBar value={temporalProgress} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><p className={muted}>Dias registrados</p><p className="mt-1 text-xl font-bold text-white">{totals.registered}</p></div>
              <div><p className={muted}>100% concluídos</p><p className="mt-1 text-xl font-bold text-white">{totals.perfect}</p></div>
              <div><p className={muted}>≥ 80%</p><p className="mt-1 text-xl font-bold text-white">{totals.atLeast80}</p></div>
              <div><p className={muted}>Média diária</p><p className="mt-1 text-xl font-bold text-white">{totals.dailyAverage.toFixed(0)}%</p></div>
            </div>
            <p className="mt-4 border-t border-white/5 pt-3 text-xs text-zinc-500">Consistência acumulada = metas concluídas ÷ metas aplicáveis. Média diária é exibida separadamente. Dias passados sem registro contam como zero.</p>
          </div>

          <div className={`${cardClass} flex flex-col justify-between`}>
            <div>
              <p className={muted}>HOJE · {formatDate(today)}</p>
              <h3 className="mt-2 text-xl font-bold text-white">O que falta para encerrar?</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-zinc-400">Checklist</p><p className="mt-1 font-bold text-white">{doneToday}/{todayGoals.length}</p></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-zinc-400">Água</p><p className="mt-1 font-bold text-white">{currentWater.toLocaleString("pt-BR")} ml</p></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-zinc-400">Treino</p><p className="mt-1 truncate font-bold text-white">{selectedIsWorkoutDay ? (selectedRecord.workout?.status || "Planejado") : "Descanso"}</p></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-zinc-400">Refeições</p><p className="mt-1 font-bold text-white">{mealsDone}/3 registradas</p></div>
              </div>
            </div>
            <button className={`${buttonClass} mt-4 w-full`} onClick={finishDay}>FINALIZAR MEU DIA</button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <WaterModule />
          <div className={cardClass}>
            <div className="flex items-start justify-between">
              <div><p className={muted}>Último peso registrado</p><p className="mt-1 text-3xl font-black text-white">{latestWeight ? `${latestWeight.value.toFixed(1)} kg` : "—"}</p><p className="mt-1 text-xs text-zinc-500">{latestWeight ? formatDate(latestWeight.date) : "Registre quando for conveniente."}</p></div>
              <span className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-300">Peso é uma tendência, não uma avaliação isolada</span>
            </div>
            {firstWeight && latestWeight && <p className="mt-4 text-sm text-zinc-400">Variação desde o primeiro registro: <strong className="text-white">{(latestWeight.value - firstWeight.value).toFixed(1)} kg</strong></p>}
            <button className={`${softButton} mt-4`} onClick={() => setPage("progress")}>Registrar peso ou medidas</button>
          </div>
        </div>

        <div className="mt-4">
          <Checklist />
        </div>
      </>
    );
  }

  function ChecklistPage() {
    return (
      <>
        <SectionTitle eyebrow="Execução diária" title="Checklist" description="Marque, desmarque e corrija seus registros quando precisar." />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <DayPicker />
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${dateIsFuture ? "bg-blue-400/10 text-blue-200" : dateIsPast && !records[selectedDate] ? "bg-white/5 text-zinc-400" : "bg-lime-400/10 text-lime-200"}`}>
            {dateIsFuture ? "Dia futuro · planejado" : dateIsPast && !records[selectedDate] ? "Não registrado · conta como zero" : `${dayPercent}% de execução`}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Checklist />
          <div className="space-y-4">
            <WaterModule />
            <div className={cardClass}>
              <p className="font-bold text-white">Observação do dia</p>
              <p className={`mt-1 ${muted}`}>Uma nota rápida sobre energia, rotina ou dificuldades.</p>
              <textarea className={`${inputClass} mt-3 min-h-24 resize-y`} placeholder="Como foi seu dia?" value={noteInput || selectedRecord.note || ""} onChange={(e) => setNoteInput(e.target.value)} disabled={dateIsFuture} />
              <button className={`${buttonClass} mt-3`} onClick={saveNote} disabled={dateIsFuture}>Salvar observação</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end"><button className={buttonClass} onClick={finishDay}>FINALIZAR MEU DIA</button></div>
      </>
    );
  }

  function TrainingPage() {
    const selectedWorkout = selectedRecord.workout || {};
    return (
      <>
        <SectionTitle eyebrow="Planejamento físico" title="Treino & recuperação" description="Flexibilidade de horário e descanso fazem parte do planejamento." />
        <div className="mb-4"><DayPicker /></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div><p className={muted}>Sessão do dia</p><h3 className="mt-1 text-xl font-bold text-white">{selectedIsWorkoutDay ? "Dia de treino" : "Descanso programado"}</h3></div>
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300">{selectedWorkout.status || "Planejado"}</span>
            </div>
            {selectedIsWorkoutDay ? (
              <>
                <label className="mt-5 block text-xs font-semibold text-zinc-400">Nome da sessão</label>
                <input className={`${inputClass} mt-2`} value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="Ex.: Pernas, superiores..." disabled={dateIsFuture} />
                <label className="mt-4 block text-xs font-semibold text-zinc-400">Estado da sessão</label>
                <select className={`${inputClass} mt-2`} value={workoutStatus} onChange={(e) => setWorkoutStatus(e.target.value)} disabled={dateIsFuture}>
                  {["Planejado", "Em andamento", "Concluído", "Não realizado", "Substituído"].map((status) => <option key={status}>{status}</option>)}
                </select>
                <p className="mt-3 text-xs text-zinc-500">Horário habitual: por volta das 20h; alternativa: 6h30. Trocar o horário não é uma falha.</p>
                <button className={`${buttonClass} mt-4`} onClick={saveWorkout} disabled={dateIsFuture}>Salvar sessão</button>
              </>
            ) : <p className="mt-4 text-sm text-zinc-400">Hoje não exige musculação. O descanso programado não reduz sua consistência.</p>}
            {selectedWorkout.name && <p className="mt-4 border-t border-white/5 pt-3 text-sm text-zinc-300">Sessão registrada: <strong>{selectedWorkout.name}</strong></p>}
          </div>

          <div className={cardClass}>
            <p className={muted}>Cardio</p>
            <h3 className="mt-1 text-xl font-bold text-white">{selectedIsCardioDay ? "Sessão prevista" : "Sem cardio programado"}</h3>
            {selectedIsCardioDay ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-zinc-400">Modalidade<input className={`${inputClass} mt-1`} id="cardio-type" placeholder="Ex.: caminhada" disabled={dateIsFuture} /></label>
                <label className="text-xs text-zinc-400">Duração (min)<input className={`${inputClass} mt-1`} id="cardio-duration" type="number" placeholder="30" disabled={dateIsFuture} /></label>
                <button className={`${buttonClass} sm:col-span-2`} disabled={dateIsFuture} onClick={() => { setCheck("cardio", true); updateRecord(selectedDate, (r) => ({ ...r, cardio: { modality: document.getElementById("cardio-type")?.value || "Cardio", duration: Number(document.getElementById("cardio-duration")?.value || 0) }, updatedAt: new Date().toISOString() })); }}>Registrar cardio concluído</button>
                <button className={`${softButton} sm:col-span-2`} disabled={dateIsFuture} onClick={() => setCheck("cardio", false)}>Desmarcar / corrigir</button>
              </div>
            ) : <p className="mt-3 text-sm text-zinc-400">Dia sem sessão prevista. Não há penalização por não fazer cardio.</p>}
            {selectedRecord.cardio && <p className="mt-3 text-sm text-lime-200">{selectedRecord.cardio.modality} · {selectedRecord.cardio.duration} min</p>}
          </div>

          <div className={cardClass}>
            <p className={muted}>Sono e recuperação</p>
            <h3 className="mt-1 text-lg font-bold text-white">Como você recuperou?</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-zinc-400">Horas aproximadas<input className={`${inputClass} mt-1`} type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="Ex.: 7.5" disabled={dateIsFuture} /></label>
              <label className="text-xs text-zinc-400">Qualidade percebida<select className={`${inputClass} mt-1`} value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)} disabled={dateIsFuture}><option>Boa</option><option>Regular</option><option>Ruim</option></select></label>
            </div>
            <button className={`${softButton} mt-3`} disabled={dateIsFuture} onClick={() => updateRecord(selectedDate, (r) => ({ ...r, sleep: { hours: Number(sleepHours), quality: sleepQuality }, updatedAt: new Date().toISOString() }))}>Salvar recuperação</button>
            {selectedRecord.sleep && <p className="mt-3 text-xs text-zinc-400">{selectedRecord.sleep.hours} h · Sono {selectedRecord.sleep.quality.toLowerCase()}</p>}
          </div>
          <div className={cardClass}>
            <p className={muted}>Consistência sem culpa</p>
            <h3 className="mt-1 text-lg font-bold text-white">Descanso também é planejamento.</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Dor incomum, sintomas persistentes ou piora de desempenho podem ser registrados nas observações e são motivos para adaptar a sessão. O app não substitui orientação profissional.</p>
          </div>
        </div>
      </>
    );
  }

  function FoodPage() {
    return (
      <>
        <SectionTitle eyebrow="Rotina simples e flexível" title="Alimentação" description="Estrutura inicial editável — registre substituições sem exigir alimentos idênticos." />
        <div className="mb-4"><DayPicker /></div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {MEAL_DEFAULTS.map((meal, index) => {
            const key = `meal${index + 1}`;
            return (
              <div key={key} className={cardClass}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-lime-300">Refeição {index + 1}</p><h3 className="mt-1 text-lg font-bold text-white">{meal.name}</h3></div>
                  <button disabled={dateIsFuture} onClick={() => toggleMeal(index)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${selectedRecord.meals?.[key]?.done ? "bg-lime-300/15 text-lime-200" : "bg-white/5 text-zinc-400"}`}>{selectedRecord.meals?.[key]?.done ? "Concluída" : "Marcar"}</button>
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">{meal.suggestion}</p>
                <textarea className={`${inputClass} mt-3 min-h-20 resize-y`} placeholder="O que comeu? Quantidade aproximada ou substituição..." value={mealInputs[index] || selectedRecord.meals?.[key]?.foods || ""} onChange={(e) => setMealInputs((previous) => previous.map((v, i) => i === index ? e.target.value : v))} disabled={dateIsFuture} />
                <button className="mt-2 text-xs text-lime-300 underline" disabled={dateIsFuture} onClick={() => updateRecord(selectedDate, (r) => ({ ...r, meals: { ...r.meals, [key]: { ...r.meals?.[key], foods: mealInputs[index] } }, updatedAt: new Date().toISOString() }))}>Salvar alimentos</button>
              </div>
            );
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <p className={muted}>Resumo do dia</p><p className="mt-1 text-2xl font-black text-white">{mealsDone} <span className="text-base font-medium text-zinc-400">de 3 refeições</span></p>
            <p className="mt-2 text-sm text-zinc-400">A aderência considera o planejamento definido por você, incluindo substituições. Não há cálculo automático de calorias ou macros sem dados suficientes.</p>
          </div>
          <div className={cardClass}>
            <p className={muted}>Estrutura econômica sugerida</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">Arroz, feijão, ovos, frango quando disponível, pão, frutas e legumes. Ajuste quantidades e escolhas conforme sua rotina e orientação adequada; esta sugestão não é uma prescrição nutricional.</p>
          </div>
        </div>
      </>
    );
  }

  function ProgressPage() {
    const measurements = selectedRecord.measurements || {};
    return (
      <>
        <SectionTitle eyebrow="Acompanhamento corporal" title="Evolução física" description="Observe tendências ao longo do tempo; uma pesagem isolada não conta a história toda." />
        <div className="mb-4"><DayPicker /></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <p className={muted}>Peso corporal · kg</p>
            <div className="mt-4 flex gap-2">
              <input className={inputClass} type="number" min="20" max="300" step="0.1" placeholder="Ex.: 78,5" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} disabled={dateIsFuture} />
              <button className={buttonClass} onClick={saveWeight} disabled={dateIsFuture || !weightInput}>Registrar</button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><p className="text-xs text-zinc-500">Primeiro</p><p className="mt-1 font-bold text-white">{firstWeight ? `${firstWeight.value} kg` : "—"}</p></div>
              <div><p className="text-xs text-zinc-500">Mais recente</p><p className="mt-1 font-bold text-white">{latestWeight ? `${latestWeight.value} kg` : "—"}</p></div>
              <div><p className="text-xs text-zinc-500">Média 7 registros</p><p className="mt-1 font-bold text-white">{averageWeight ? `${averageWeight} kg` : "—"}</p></div>
            </div>
            {allWeights.length > 1 && (
              <div className="mt-5 flex h-28 items-end gap-2 border-b border-white/10 pb-2">
                {allWeights.slice(-12).map((item, index, arr) => {
                  const values = arr.map((x) => x.value);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const height = max === min ? 50 : 18 + ((item.value - min) / (max - min)) * 75;
                  return <div key={`${item.date}-${index}`} className="group relative flex flex-1 flex-col items-center justify-end"><div className="w-full rounded-t-md bg-lime-400/80" style={{ height: `${height}%` }} title={`${item.value} kg · ${formatDate(item.date)}`} /><span className="mt-1 text-[9px] text-zinc-600">{item.date.slice(5)}</span></div>;
                })}
              </div>
            )}
            <div className="mt-4 max-h-36 space-y-2 overflow-auto">
              {allWeights.slice().reverse().map((item, index) => <div key={`${item.date}-${index}`} className="flex justify-between border-b border-white/5 pb-2 text-sm"><span className="text-zinc-400">{formatDate(item.date)}</span><strong className="text-white">{item.value} kg</strong></div>)}
              {!allWeights.length && <p className="text-xs text-zinc-500">Ainda não há registros de peso.</p>}
            </div>
          </div>

          <div className={cardClass}>
            <p className={muted}>Medidas corporais · cm</p>
            <p className="mt-1 text-sm text-zinc-400">Todas opcionais. Registre em condições semelhantes para comparar.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["cintura", "quadril", "coxa", "peito", "braço"].map((key) => (
                <label key={key} className="text-xs capitalize text-zinc-400">{key}
                  <input className={`${inputClass} mt-1`} type="number" step="0.1" placeholder="cm" value={measurements[key] || ""} disabled={dateIsFuture} onChange={(e) => updateRecord(selectedDate, (r) => ({ ...r, measurements: { ...r.measurements, [key]: e.target.value }, updatedAt: new Date().toISOString() }))} />
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">Peso e fotos não determinam, por si só, a quantidade exata de gordura perdida ou músculo ganho.</p>
          </div>

          <div className={`${cardClass} lg:col-span-2`}>
            <p className={muted}>Fotos de evolução</p>
            <p className="mt-1 text-sm text-zinc-300">Sugestão: início, dias 15, 30, 45 e encerramento. Mantenha iluminação, distância, postura e horário semelhantes; evite filtros que alterem a aparência.</p>
            <label className={`mt-4 block rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-zinc-400 ${dateIsFuture ? "opacity-50" : "cursor-pointer hover:border-lime-300/40"}`}>
              Adicionar foto deste dia
              <input type="file" accept="image/*" className="hidden" disabled={dateIsFuture} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => updateRecord(selectedDate, (r) => ({ ...r, photos: [...(r.photos || []), { name: file.name, data: reader.result }], updatedAt: new Date().toISOString() }));
                reader.readAsDataURL(file);
              }} />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(selectedRecord.photos || []).map((photo, index) => <div key={index} className="overflow-hidden rounded-xl border border-white/10"><img src={photo.data} alt={`Registro visual ${index + 1}`} className="aspect-[3/4] w-full object-cover" /><p className="truncate px-2 py-1 text-xs text-zinc-400">{formatDate(selectedDate)} · {photo.name}</p></div>)}
            </div>
            <p className="mt-3 text-xs text-amber-200/70">As fotos são mantidas apenas nesta sessão e não são enviadas a armazenamento privado.</p>
          </div>
        </div>
      </>
    );
  }

  function ReportPage() {
    const completedWorkouts = Object.values(records).filter((r) => r.workout?.status === "Concluído" || r.workout?.status === "Substituído").length;
    const cardioSessions = Object.values(records).filter((r) => r.cardio).length;
    const cardioMinutes = Object.values(records).reduce((sum, r) => sum + Number(r.cardio?.duration || 0), 0);
    const mealCount = Object.values(records).reduce((sum, r) => sum + [1, 2, 3].filter((n) => r.meals?.[`meal${n}`]?.done).length, 0);
    const averageWater = projectDates.length ? Math.round(projectDates.reduce((sum, date) => sum + waterTotal(date), 0) / projectDates.length) : 0;
    return (
      <>
        <SectionTitle eyebrow="Visão geral" title={isFinished ? "Relatório final" : "Histórico & relatório"} description={isFinished ? "Resumo honesto dos registros do seu ciclo." : "Relatório parcial, atualizado conforme seus registros."} />
        <div className="mb-4 flex flex-wrap gap-2">
          <button className={buttonClass} onClick={exportCSV}>Exportar histórico CSV</button>
          <button className={softButton} onClick={() => setPage("checklist")}>Revisar dias</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Consistência acumulada", `${totals.consistency.toFixed(1)}%`],
            ["Média diária", `${totals.dailyAverage.toFixed(1)}%`],
            ["Dias registrados", totals.registered],
            ["Dias 100% / ≥80%", `${totals.perfect} / ${totals.atLeast80}`],
            ["Treinos concluídos", completedWorkouts],
            ["Sessões de cardio", `${cardioSessions} · ${cardioMinutes} min`],
            ["Refeições marcadas", mealCount],
            ["Água média por dia", `${averageWater.toLocaleString("pt-BR")} ml`],
          ].map(([label, value]) => <div key={label} className={cardClass}><p className={muted}>{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-bold text-white">Consistência diária</h3>
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {projectDates.slice().reverse().map((date) => {
                const goals = applicableGoals(date);
                const record = getRecord(date);
                const done = goals.filter((goal) => record.checks?.[goal.id]).length;
                const percent = records[date] && goals.length ? Math.round((done / goals.length) * 100) : 0;
                return <button key={date} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5" onClick={() => { setSelectedDate(date); setPage("checklist"); }}>
                  <span className="w-24 text-xs text-zinc-400">{formatDate(date)}</span>
                  <span className="flex-1"><ProgressBar value={percent} color={records[date] ? "bg-lime-400" : "bg-zinc-600"} /></span>
                  <span className="w-10 text-right text-xs font-bold text-zinc-300">{records[date] ? `${percent}%` : "—"}</span>
                </button>;
              })}
              {!projectDates.length && <p className="text-sm text-zinc-500">O projeto ainda não começou.</p>}
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="font-bold text-white">Pontos de acompanhamento</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <p className="flex justify-between"><span>Dias abaixo de 50%</span><strong>{totals.below50}</strong></p>
              <p className="flex justify-between"><span>Sequência atual de dias completos</span><strong>{totals.currentStreak}</strong></p>
              <p className="flex justify-between"><span>Melhor sequência</span><strong>{totals.bestStreak}</strong></p>
              <p className="flex justify-between"><span>Variação de peso registrada</span><strong>{firstWeight && latestWeight ? `${(latestWeight.value - firstWeight.value).toFixed(1)} kg` : "—"}</strong></p>
            </div>
            <p className="mt-5 rounded-xl bg-white/[0.04] p-3 text-xs leading-5 text-zinc-400">A consistência acumulada é a métrica principal. Sequências não representam sucesso absoluto. Este relatório não estima ganho de músculo nem perda exata de gordura.</p>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-lime-300">Observações registradas</p>
              <div className="mt-2 max-h-40 space-y-2 overflow-auto">
                {Object.entries(records).filter(([, record]) => record.note).sort(([a], [b]) => a.localeCompare(b)).map(([date, record]) => <div key={date} className="rounded-lg bg-white/[0.03] p-3"><p className="text-xs text-zinc-500">{formatDate(date)}</p><p className="mt-1 text-sm text-zinc-300">{record.note}</p></div>)}
                {!Object.values(records).some((r) => r.note) && <p className="text-xs text-zinc-500">Nenhuma observação registrada.</p>}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function SettingsPage() {
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    function toggleDay(list, setter, day) {
      setter(list.includes(day) ? list.filter((d) => d !== day) : [...list, day].sort());
    }
    return (
      <>
        <SectionTitle eyebrow="Configuração pessoal" title="Configurações & metas" description="Ajuste o ciclo e a rotina. Alterações não apagam registros já feitos." />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-bold text-white">Perfil e projeto</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-zinc-400">Nome<input className={`${inputClass} mt-1`} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
              <label className="text-xs text-zinc-400">Idade<input className={`${inputClass} mt-1`} type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} /></label>
              <label className="text-xs text-zinc-400">Altura (cm)<input className={`${inputClass} mt-1`} type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} /></label>
              <label className="text-xs text-zinc-400">Peso inicial (kg)<input className={`${inputClass} mt-1`} type="number" step="0.1" value={profile.startWeight} onChange={(e) => setProfile({ ...profile, startWeight: e.target.value })} /></label>
              <label className="text-xs text-zinc-400">Início do projeto<input className={`${inputClass} mt-1`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Período: {formatDate(startDate)} a {formatDate(endDate)} · A data atual é calculada no fuso America/Sao_Paulo.</p>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-white">Meta de hidratação</h3>
            <p className="mt-1 text-xs text-zinc-400">2.000 ml é um ponto inicial configurável, não uma recomendação universal.</p>
            <label className="mt-4 block text-xs text-zinc-400">Meta diária (ml)<input className={`${inputClass} mt-1`} type="number" min="0" step="100" value={waterGoal} onChange={(e) => setWaterGoal(Number(e.target.value))} /></label>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-white">Dias de musculação</h3>
            <p className="mt-1 text-xs text-zinc-400">Dias sem sessão não são penalizados por falta de treino.</p>
            <div className="mt-4 flex flex-wrap gap-2">{weekdays.map((day, index) => <button key={day} className={`rounded-lg px-3 py-2 text-xs font-bold ${workoutDays.includes(index) ? "bg-lime-300 text-zinc-950" : "bg-white/5 text-zinc-400"}`} onClick={() => toggleDay(workoutDays, setWorkoutDays, index)}>{day}</button>)}</div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-white">Dias de cardio</h3>
            <p className="mt-1 text-xs text-zinc-400">Cardio só entra na pontuação nos dias configurados.</p>
            <div className="mt-4 flex flex-wrap gap-2">{weekdays.map((day, index) => <button key={day} className={`rounded-lg px-3 py-2 text-xs font-bold ${cardioDays.includes(index) ? "bg-lime-300 text-zinc-950" : "bg-white/5 text-zinc-400"}`} onClick={() => toggleDay(cardioDays, setCardioDays, index)}>{day}</button>)}</div>
          </div>

          <div className={`${cardClass} lg:col-span-2`}>
            <h3 className="font-bold text-white">Metas acompanhadas</h3>
            <p className="mt-1 text-xs text-zinc-400">Metas desativadas não entram no cálculo de consistência.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {GOALS.map((goal) => <label key={goal.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 text-sm text-zinc-200"><input type="checkbox" className="accent-lime-400" checked={Boolean(enabledGoals[goal.id])} onChange={() => setEnabledGoals((prev) => ({ ...prev, [goal.id]: !prev[goal.id] }))} /><span>{goal.label}</span></label>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-amber-200/70">Nesta versão, metas e registros existem somente enquanto esta página permanece aberta. Para salvar entre sessões, sincronizar dispositivos e proteger dados de conta, é necessário integrar autenticação e banco de dados.</p>
          </div>
        </div>
      </>
    );
  }

  const pages = {
    home: <HomePage />,
    checklist: <ChecklistPage />,
    training: <TrainingPage />,
    food: <FoodPage />,
    progress: <ProgressPage />,
    report: <ReportPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="min-h-screen bg-[#0c0f0e] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-[#101312] p-5 lg:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 font-black text-zinc-950">S</div>
            <div><p className="font-black tracking-wide text-white">SHAPE 60</p><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Disciplina diária</p></div>
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Acompanhamento</p>
          <nav className="space-y-1">
            {navItems.map(([id, label, icon]) => <button key={id} onClick={() => setPage(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${page === id ? "bg-lime-300 text-zinc-950 font-bold" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><span className="w-5 text-center text-base">{icon}</span>{label}</button>)}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs text-zinc-500">{formatProjectState()}</p>
            <p className="mt-1 text-lg font-black text-lime-300">{totals.consistency.toFixed(0)}% <span className="text-xs font-normal text-zinc-500">consistência</span></p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#0c0f0e]/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:hidden">
            <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-300 text-sm font-black text-zinc-950">S</div><span className="font-black tracking-wide">SHAPE 60</span></div>
            <span className="text-xs font-semibold text-lime-300">{formatProjectState()}</span>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-7 sm:py-8">
            {pages[page]}
            <footer className="mt-8 border-t border-white/5 pt-4 text-xs leading-5 text-zinc-600">
              Shape 60 é uma ferramenta de acompanhamento, não substitui orientação médica, nutricional ou de educação física. Sem promessa de resultado físico específico.
            </footer>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-white/10 bg-[#101312]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden">
        {navItems.map(([id, label, icon]) => <button key={id} onClick={() => setPage(id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg py-1.5 ${page === id ? "text-lime-300" : "text-zinc-500"}`}><span className="text-lg leading-none">{icon}</span><span className="max-w-full truncate text-[9px] font-semibold">{label}</span></button>)}
      </nav>
    </div>
  );
}

export default App;
