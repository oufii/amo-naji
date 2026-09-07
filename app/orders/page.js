'use client'; 
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [tab]);

  async function fetchOrders() {
    // جلب كل الطلبات بدون شروط معقدة لتجنب أي خطأ بالفلترة
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الطلبات:', error);
      return;
    }

    if (data) {
      // فلترة الطلبات بناءً على التبويب المختار محلياً لضمان عدم اختفائها
      const filtered = data.filter(order => {
        const status = order.status || 'pending';
        if (tab === 'active') {
          return status !== 'completed';
        } else {
          return status === 'completed';
        }
      });
      setOrders(filtered);
    }
  }

  const handleCompleteOrder = async (id) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    } else {
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) alert('خطأ في حذف الطلب');
    else fetchOrders();
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let itemsList = '';
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items) && items.length > 0) {
        itemsList = items.map(i => `<tr><td>${i.name || i.title || 'وجبة'}</td><td style="text-align: center;">${i.quantity || 1}</td><td style="text-align: left;">${Number((i.price || 0) * (i.quantity || 1)).toLocaleString()} د.ع</td></tr>`).join('');
      } else {
        itemsList = `<tr><td colspan="3" style="text-align: center;">طلب عام / لا توجد تفاصيل</td></tr>`;
      }
    } catch (e) {
      itemsList = `<tr><td colspan="3" style="text-align: center;">تفاصيل الوجبات غير متوفرة</td></tr>`;
    }

    const foodTotal = order.food_total || order.subtotal || 0;
    const deliveryFee = order.delivery_fee ?? 0;
    const grandTotal = order.grand_total || order.total_price || (foodTotal + deliveryFee);

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>وصل طلب #${order.id}</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; width: 80mm; margin: 0 auto; padding: 5px; color: #000; direction: rtl; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .header h1 { font-size: 20px; margin: 0 0 3px 0; font-weight: bold; }
            .header p { font-size: 13px; margin: 0; font-weight: bold; }
            .info { margin-bottom: 8px; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
            th, td { border-bottom: 1px solid #ddd; padding: 5px 2px; text-align: right; }
            th { background: #eee; font-weight: bold; }
            .totals { font-size: 12px; border-top: 1px dashed #000; padding-top: 6px; }
            .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 3px; }
            .footer { text-align: center; font-size: 11px; margin-top: 10px; border-top: 2px dashed #000; padding-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>مطعم عمو ناجي</h1>
            <p>هاتف: 07722447722</p>
          </div>
          
          <div class="info">
            <p><strong>رقم الطلب:</strong> #${order.id}</p>
            <p><strong>اسم الزبون:</strong> ${order.customer_name || order.name || 'غير محدد'}</p>
            <p><strong>رقم الهاتف:</strong> ${order.customer_phone || order.phone || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${order.customer_address || order.address || 'غير محدد'}</p>
            <p><strong>الوقت:</strong> ${new Date(order.created_at).toLocaleString('ar-IQ')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>الوجبة</th>
                <th style="text-align: center;">العدد</th>
                <th style="text-align: left;">السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="totals">
            <div><span>مجموع الوجبات:</span> <span>${Number(foodTotal).toLocaleString()} د.ع</span></div>
            <div><span>سعر التوصيل:</span> <span>${Number(deliveryFee).toLocaleString()} د.ع</span></div>
            <div class="total-final"><span>المبلغ الكلي:</span> <span>${Number(grandTotal).toLocaleString()} د.ع</span></div>
          </div>

          <div class="footer">
            <p>شكراً لطلبكم من مطعم عمو ناجي ❤️</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-amber-500">إدارة الطلبات والديليفري 📦</h1>
          <Link href="/" className="bg-slate-900 border border-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs">
            العودة للمتجر 🛍️
          </Link>
        </div>

        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button onClick={() => setTab('active')} className={`px-5 py-2.5 rounded-xl text-xs font-bold ${tab === 'active' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
            الطلبات الجارية
          </button>
          <button onClick={() => setTab('archive')} className={`px-5 py-2.5 rounded-xl text-xs font-bold ${tab === 'archive' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
            الأرشيف (المكتملة)
          </button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              لا توجد طلبات هنا حالياً 📭
            </div>
          ) : (
            orders.map((order) => {
              const foodTotal = order.food_total || order.subtotal || 0;
              const deliveryFee = order.delivery_fee ?? 0;
              const grandTotal = order.grand_total || order.total_price || (foodTotal + deliveryFee);
              const isCompleted = order.status === 'completed';

              return (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl text-sm font-black">
                        طلب #{order.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleString('ar-IQ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePrintReceipt(order)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg flex items-center gap-1.5"
                      >
                        🖨️ طباعة الوصل الحراري
                      </button>

                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                        {isCompleted ? 'مكتمل ✓' : 'قيد التحضير 👨‍🍳'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <p><span className="text-slate-400">👤 الاسم:</span> <strong className="text-white">{order.customer_name || order.name || 'غير محدد'}</strong></p>
                      <p><span className="text-slate-400">📞 الهاتف:</span> <a href={`tel:${order.customer_phone || order.phone}`} className="text-amber-400 underline font-bold">{order.customer_phone || order.phone || 'غير محدد'}</a></p>
                      <p><span className="text-slate-400">📍 العنوان:</span> {order.customer_address || order.address || 'غير محدد'}</p>
                      {order.location_url && (
                        <a href={order.location_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg font-bold">
                          🗺️ عرض الموقع (GPS)
                        </a>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>مجموع الوجبات:</span>
                          <span>{Number(foodTotal).toLocaleString()} د.ع</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>سعر التوصيل:</span>
                          <span>{Number(deliveryFee).toLocaleString()} د.ع</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-amber-400 border-t border-slate-800 pt-1 mt-1">
                          <span>المبلغ الكلي:</span>
                          <span>{Number(grandTotal).toLocaleString()} د.ع</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">🍽️ الوجبات المطلوبة:</span>
                    <div className="space-y-1">
                      {(() => {
                        try {
                          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                          if (Array.isArray(items) && items.length > 0) {
                            return items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs bg-slate-900 p-2 rounded-lg">
                                <span>{item.name || item.title} × {item.quantity || 1}</span>
                                <span className="text-amber-400 font-bold">{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()} د.ع</span>
                              </div>
                            ));
                          }
                        } catch(e) {}
                        return <p className="text-xs text-slate-400">طلب عام</p>;
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    {!isCompleted && (
                      <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                      >
                        ✓ تسليم وأرشفة الطلب
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="bg-red-500/10 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold"
                    >
                      حذف
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
