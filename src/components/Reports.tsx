import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Calendar, Filter } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#ffd700', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

export default function Reports() {
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    // Fetch daily revenue data
    fetch('/api/reports/daily')
      .then(res => res.json())
      .then(data => {
        setDailyData(data.reverse().map((d: any) => ({
          name: format(new Date(d.date), 'MMM dd'),
          revenue: d.revenue
        })));
        setTotalRevenue(data.reduce((sum: number, d: any) => sum + d.revenue, 0));
      });

    // Fetch real category distribution data
    fetch('/api/reports/categories')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setCategoryData(data);
        } else {
          // Fallback if no sales yet
          setCategoryData([
            { name: 'No Sales Yet', value: 1 }
          ]);
        }
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={16} />
            Last 30 Days
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={18} />
          Download Full Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Summary */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Revenue Growth</h3>
              <p className="text-slate-400 text-sm">Daily revenue performance</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-bold text-gold">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#112240', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffd700' }}
                />
                <Bar dataKey="revenue" fill="#ffd700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Sales by Category</h3>
          <p className="text-slate-400 text-sm mb-8">Product performance distribution</p>
          
          <div className="flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#112240', border: '1px solid #ffffff10', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value} sales</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Average Order Value</p>
          <h4 className="text-2xl font-bold text-white">${(totalRevenue / (dailyData.length || 1)).toFixed(2)}</h4>
        </div>
        <div className="glass-card p-6 border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Peak Sales Day</p>
          <h4 className="text-2xl font-bold text-white">Friday</h4>
        </div>
        <div className="glass-card p-6 border-l-4 border-gold">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Customer Retention</p>
          <h4 className="text-2xl font-bold text-white">84%</h4>
        </div>
      </div>
    </div>
  );
}
