import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Receipt, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { cn, Product } from '../types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(10); // 10%
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState<any>(null);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total,
          tax: taxAmount,
          discount
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowInvoice({
          id: data.saleId,
          items: [...cart],
          subtotal,
          tax: taxAmount,
          discount,
          total,
          date: new Date().toLocaleString()
        });
        setCart([]);
        setDiscount(0);
        // Refresh products to update stock
        fetch('/api/products').then(res => res.json()).then(setProducts);
      }
    } catch (error) {
      alert('Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!showInvoice) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('LuxePOS INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Invoice ID: #${showInvoice.id}`, 20, 40);
    doc.text(`Date: ${showInvoice.date}`, 20, 45);
    
    doc.line(20, 50, 190, 50);
    
    doc.text('Item', 20, 60);
    doc.text('Qty', 120, 60);
    doc.text('Price', 140, 60);
    doc.text('Total', 170, 60);
    
    let y = 70;
    showInvoice.items.forEach((item: any) => {
      doc.text(item.name, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`$${item.price.toFixed(2)}`, 140, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, y);
      y += 10;
    });
    
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.text(`Subtotal: $${showInvoice.subtotal.toFixed(2)}`, 140, y);
    y += 7;
    doc.text(`Tax (${taxRate}%): $${showInvoice.tax.toFixed(2)}`, 140, y);
    y += 7;
    doc.text(`Discount: -$${showInvoice.discount.toFixed(2)}`, 140, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.text(`TOTAL: $${showInvoice.total.toFixed(2)}`, 140, y);
    
    doc.save(`invoice-${showInvoice.id}.pdf`);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="input-field w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              disabled={product.stock <= 0}
              onClick={() => addToCart(product)}
              className={cn(
                "glass-card p-4 text-left transition-all hover:border-gold/30 group relative overflow-hidden",
                product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
              <div className="mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{product.category}</span>
                <h4 className="text-white font-bold truncate">{product.name}</h4>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-gold font-bold text-lg">${product.price.toFixed(2)}</p>
                <p className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  product.stock <= product.min_stock ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {product.stock} left
                </p>
              </div>
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Billing */}
      <div className="glass-card flex flex-col h-full">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-gold" size={20} />
            <h3 className="text-lg font-bold text-white">Current Order</h3>
          </div>
          <span className="text-xs text-slate-500">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2 bg-navy rounded-lg p-1 border border-white/5">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-white"><Minus size={14} /></button>
                <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-white"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <ShoppingCart size={48} className="mb-4" />
              <p>Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-navy-light/50 border-t border-white/5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({taxRate}%)</span>
              <span className="text-white">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">Discount ($)</span>
              <input 
                type="number" 
                className="bg-navy border border-white/10 rounded px-2 py-1 text-right text-sm text-white w-24 focus:outline-none focus:border-gold/50"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-lg font-bold text-white">Total</span>
            <span className="text-2xl font-bold text-gold">${total.toFixed(2)}</span>
          </div>

          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            {isProcessing ? 'Processing...' : (
              <>
                <Receipt size={20} />
                Complete Checkout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white text-navy p-10 rounded-none shadow-2xl font-serif"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">LuxePOS</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Premium Retail Solutions</p>
              </div>

              <div className="flex justify-between text-xs mb-8 border-y border-navy/10 py-4">
                <div>
                  <p className="font-bold uppercase mb-1">Invoice To:</p>
                  <p>Guest Customer</p>
                </div>
                <div className="text-right">
                  <p className="font-bold uppercase mb-1">Invoice Details:</p>
                  <p>ID: #{showInvoice.id}</p>
                  <p>{showInvoice.date}</p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-navy text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {showInvoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto w-48 space-y-2 text-sm border-t-2 border-navy pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${showInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${showInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${showInvoice.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-navy/10">
                  <span>Total</span>
                  <span>${showInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-12 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                Thank you for your business
              </div>

              <div className="mt-8 flex gap-4 no-print">
                <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-lg hover:bg-navy/90 transition-all">
                  <Download size={18} /> Download PDF
                </button>
                <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-navy py-3 rounded-lg hover:bg-navy/5 transition-all">
                  <Printer size={18} /> Print
                </button>
                <button onClick={() => setShowInvoice(null)} className="px-6 py-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
