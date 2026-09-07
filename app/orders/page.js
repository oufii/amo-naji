'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active'); // active or archive

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // تحديث تلقائي كل 5 ثواني
    return () => clearInterval(interval);
  }, [tab]);

  async function fetchOrders() {
    const isCompleted = tab === 'archive';
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_completed', isCompleted)
      .order('id', { ascending: false });

    if (data) setOrders(data);
  }

  const handleCompleteOrder = async (id) => {
    const { error } = await supabase
      .from('orders')
      .update({ is_completed: true })
      .eq('id', id);

    if (error) alert('حدث خطأ أثناء تحديث الطلب');
    else fetchOrders();
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) alert('خطأ في الحذف');
    else fetchOrders();
  };

  // دالة طباعة الوصل الحراري
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsList = Array.isArray(order.items) 
      ? order.items.map(i => `<tr><td>${i.name || i.title}</td><td>${i.quantity || 1}</td><td>${Number(i.price || 0).toLocaleString()} د.ع</td></tr>`).join('')
      : `<tr><td colspan="3">تفاصيل الطلب غير متوفرة</td></tr>`;

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>وصل طلب #${order.id}</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; width: 80mm; margin: 0 auto; padding: 10px; color: #000; direction: rtl; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 20px; margin: 0 0 5px 0; font-weight: bold; }
            .header p { font-size: 14px; margin: 0; }
            .info { margin-bottom: 10px; font-size: 13px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
            th, td { border-bottom: 1px solid #ddd; padding: 6px 4px; text-align: right; }
            th { background: #f2f2f2; }
            .totals { font-size: 13px; border-top: 1px dashed #000; padding-top: 8px; }
            .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
            .total-final { font-weight: bold; font-size: 15px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
            .footer { text-align: center; font-size: 11px; margin-top: 15px; border-top: 2px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>جكن عمو ناجي</h1>
            <p>هاتف: 07722447722</p>
          </div>
          
          <div class="info">
            <p><strong>رقم الطلب:</strong> #${order.id}</p>
            <p><strong>اسم الزبون:</strong> ${order.customer_name || order.name || 'غير محدد'}</p>
            <p><strong>رقم الهاتف:</strong> ${order.phone || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${order.address || 'غير محدد'}</p>
            <p><strong>الوقت:</strong> ${new Date(order.created_at).toLocaleString('ar-IQ')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>الوجبة</th>
                <th>العدد</th>
                <th>السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="totals">
            <div><span>مجموع الوجبات:</span> <span>${Number(order.subtotal || order.total_price - 500 || 0).toLocaleString()} د.ع</span></div>
            <div><span>سعر التوصيل:</span> <span>${Number(order.delivery_fee || 500).toLocaleString()} د.ع</span></div>
            <div class="total-final"><span>المبلغ الكلي:</span> <span>${Number(order.total_price || 0).toLocaleString()} د.ع</span></div>
          </div>

          <div class="footer">
            <p>شكراً لطلبكم من جكن عمو ناجي ❤️ بالعافية مقدماً</p>
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
          <Link href="/" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs transition">
            العودة للمتجر 🛍️
          </Link>
        </div>

        {/* تابات التنقل بين الطلبات الجارية والأرشيف */}
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button 
            onClick={() => setTab('active')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${tab === 'active' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            الطلبات الجارية ({orders.length})
          </button>
          <button 
            onClick={() => setTab('archive')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${tab === 'archive' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            أرشيف الطلبات المكتملة
          </button>
        </div>

        {/* قائمة الطلبات */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              لا توجد طلبات هنا حالياً 📭
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl text-sm font-black">
                      طلب #{order.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleString('ar-IQ')}
                    </span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${order.is_completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                    {order.is_completed ? 'مكتمل ✓' : 'قيد التحضير 👨‍🍳'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <p><span className="text-slate-400">👤 الاسم:</span> <strong className="text-white">{order.customer_name || order.name || 'غير محدد'}</strong></p>
                    <p><span className="text-slate-400">📞 الهاتف:</span> <a href={`tel:${order.phone}`} className="text-amber-400 underline font-bold">{order.phone || 'غير محدد'}</a></p>
                    <p><span className="text-slate-400">📍 العنوان:</span> {order.address || 'غير محدد'}</p>
                    {order.location_url && (
                      <a href={order.location_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg font-bold">
                        🗺️ عرض الموقع على الخريطة (GPS)
                      </a>
                    )}
                  </div>

                  <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>مجموع الوجبات:</span>
                        <span>{Number(order.subtotal || order.total_price - 500 || 0).toLocaleString()} د.ع</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>سعر التوصيل:</span>
                        <span>{Number(order.delivery_fee || 500).toLocaleString()} د.ع</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-amber-400 border-t border-slate-800 pt-1 mt-1">
                        <span>المبلغ الكلي:</span>
                        <span>{Number(order.total_price || 0).toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* تفاصيل الوجبات المطلوبة */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">🍽️ الوجبات المطلوبة:</span>
                  <div className="space-y-1">
                    {Array.isArray(order.items) ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-slate-900 p-2 rounded-lg">
                          <span>{item.name || item.title} × {item.quantity || 1}</span>
                          <span className="text-amber-400 font-bold">{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()} د.ع</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">لا توجد تفاصيل متاحة للوجبات</p>
                    )}
                  </div>
                </div>

                {/* أزرار الإجراءات (طباعة، تسليم، حذف) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => handlePrintReceipt(order)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                  >
                    🖨️ طباعة الوصل
                  </button>

                  <div className="flex items-center gap-2">
                    {!order.is_completed && (
                      <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1"
                      >
                        ✓ تسليم وأرشفة الطلب
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
