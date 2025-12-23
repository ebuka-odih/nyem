import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Users, Heart, Package, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
  };
  matches: {
    total: number;
    today: number;
    this_week: number;
  };
  items: {
    total: number;
    active: number;
    today: number;
  };
  swipes: {
    total: number;
    today: number;
  };
  messages: {
    total: number;
    today: number;
  };
  reports: {
    total: number;
    pending: number;
  };
}

interface Props {
  stats: DashboardStats;
}

export default function Dashboard({ stats }: Props) {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      change: `+${stats.users.new_this_week} this week`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Users',
      value: stats.users.active,
      change: `${stats.users.new_today} new today`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Matches',
      value: stats.matches.total,
      change: `+${stats.matches.this_week} this week`,
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Total Items',
      value: stats.items.total,
      change: `${stats.items.active} active`,
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Swipes',
      value: stats.swipes.total,
      change: `${stats.swipes.today} today`,
      icon: MessageSquare,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Reports',
      value: stats.reports.total,
      change: `${stats.reports.pending} pending`,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <AdminLayout currentPath="/admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="p-6 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{card.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">{card.change}</p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}






