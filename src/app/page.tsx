import KanbanBoard from "@/components/KanbanBoard";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import CommitmentsList from "@/components/CommitmentsList";
import EisenhowerMatrix from "@/components/EisenhowerMatrix";
import PomodoroTimer from "@/components/PomodoroTimer";
import HabitTracker from "@/components/HabitTracker";
import CommunicationProtocol from "@/components/CommunicationProtocol";
import Dashboard from "@/components/Dashboard";
import AIInsightsHistory from "@/components/AIInsightsHistory";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sistema Operacional Pessoal</h1>
          <p className="text-sm text-neutral-500">
            Painel de produtividade — captura, priorização, planejamento e execução.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KanbanBoard />
        <WeeklyPlanner />
        <CommitmentsList />
        <EisenhowerMatrix />
        <PomodoroTimer />
        <HabitTracker />
        <CommunicationProtocol />
        <Dashboard />
        <AIInsightsHistory />
      </main>
    </div>
  );
}
