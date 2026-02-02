import { GamificationWidget } from '@/components/gamification/GamificationWidget';

const Gamification = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamificação</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, conquistas e compare-se com sua equipe.
        </p>
      </div>

      <div className="max-w-2xl">
        <GamificationWidget />
      </div>
    </div>
  );
};

export default Gamification;
