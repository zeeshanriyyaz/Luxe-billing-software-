import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn, Sale } from '../types';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetch('/api/sales').then(res => res.json()).then(setSales);
  }, []);

  const filteredSales = sales.filter(sale => {
    const matchesId = sale.id.toString().includes(search);
    const matchesDate = dateFilter ? sale.created_at.startsWith(dateFilter) : true;
    return matchesId && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID..." 
              className="input-field w-full pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="date" 
              className="input-field w-full pl-10"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Download size={18} />
          Export All
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-sm font-semibold text-slate-400">Order ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400">Date & Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-right">Subtotal</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-right">Tax</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-right">Discount</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-right font-bold">Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">#{sale.id}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">${(sale.total - sale.tax + sale.discount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-slate-400">${sale.tax.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-red-400">-${sale.discount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gold">${sale.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No transactions found for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
