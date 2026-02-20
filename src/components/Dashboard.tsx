import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="glass-card p-6 flex items-center justify-between">
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs mt-2",
          trend > 0 ? "text-emerald-400" : "text-red-400"
        )}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
    <div className={cn("p-4 rounded-xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

import { cn } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);

    fetch('/api/reports/daily')
      .then(res => res.json())
      .then(data => {
        setChartData(data.reverse().map((d: any) => ({
          name: format(new Date(d.date), 'MMM dd'),
          revenue: d.revenue
        })));
      });
  }, []);

  if (!stats) return <div className="text-gold">Loading stats...</div>;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`$${stats.todaySales.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-emerald-500/20 text-emerald-500"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${stats.monthSales.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-gold/20 text-gold"
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-blue-500/20 text-blue-500"
        />
        <StatCard 
          title="Recent Orders" 
          value={stats.recentTransactions.length} 
          icon={Clock} 
          color="bg-purple-500/20 text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#112240', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffd700' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ffd700" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent Sales</h3>
          <div className="space-y-4">
            {stats.recentTransactions.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Order #{sale.id}</p>
                    <p className="text-xs text-slate-500">{format(new Date(sale.created_at), 'hh:mm a')}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gold">+${sale.total.toFixed(2)}</p>
              </div>
            ))}
            {stats.recentTransactions.length === 0 && (
              <p className="text-center text-slate-500 py-8">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
