import { Trophy, Star, Flame, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification, ACHIEVEMENTS } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';

export function GamificationWidget() {
  const { stats, achievements, leaderboard, userRank, isLoading, getLevelTitle, getNextLevelPoints } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPoints = stats?.total_points || 0;
  const currentLevel = stats?.level || 1;
  const nextLevelPoints = getNextLevelPoints(currentPoints);
  const progressToNextLevel = ((currentPoints % 100) / 100) * 100;

  const earnedAchievementNames = achievements.map(a => a.achievement_name);

  return (
    <Tabs defaultValue="progress" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="progress">Progresso</TabsTrigger>
        <TabsTrigger value="achievements">Conquistas</TabsTrigger>
        <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="space-y-4">
        {/* Level Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {currentLevel}
                </div>
                <div>
                  <CardTitle className="text-lg">{getLevelTitle(currentLevel)}</CardTitle>
                  <CardDescription>{currentPoints} pontos totais</CardDescription>
                </div>
              </div>
              {stats?.current_streak && stats.current_streak > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {stats.current_streak} dias
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Próximo nível</span>
                <span>{currentPoints % 100} / 100</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Contatos
            </div>
            <p className="text-2xl font-bold">{stats?.contacts_created || 0}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              Negócios
            </div>
            <p className="text-2xl font-bold">{stats?.deals_won || 0}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Star className="h-4 w-4" />
              Tarefas
            </div>
            <p className="text-2xl font-bold">{stats?.tasks_completed || 0}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Ranking
            </div>
            <p className="text-2xl font-bold">{userRank ? `#${userRank}` : '-'}</p>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="achievements" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conquistas</CardTitle>
            <CardDescription>
              {achievements.length} de {Object.keys(ACHIEVEMENTS).length} desbloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
                const isEarned = earnedAchievementNames.includes(achievement.name);
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center ${
                      isEarned
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/50 border-muted opacity-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{achievement.icon}</span>
                    <span className="text-xs font-medium truncate w-full">{achievement.name}</span>
                    <span className="text-xs text-muted-foreground">+{achievement.points}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Conquistas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{achievement.achievement_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">+{achievement.points}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="leaderboard" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top 10 da Organização</CardTitle>
            <CardDescription>Ranking baseado em pontos totais</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário no ranking ainda. Comece a interagir para ganhar pontos!
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      idx < 3 ? 'bg-gradient-to-r from-primary/10 to-transparent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0
                            ? 'bg-yellow-500 text-white'
                            : idx === 1
                            ? 'bg-gray-400 text-white'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {entry.profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {entry.profile?.full_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">Nível {entry.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.total_points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
