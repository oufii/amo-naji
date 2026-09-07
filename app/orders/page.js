'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active أو archive

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (data) {
      setOrders(data);
    }
    setLoading(false);
  }

  // تحديث حالة الطلب (قيد التحضير، في الطريق، تم التسليم)
  async function updateOrderStatus(id, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } else {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  }

  // حذف طلب فردي
  async function deleteOrder(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (!error) {
      setOrders(orders.filter(order => order.id !== id));
    }
  }

  // تصفير وأرشفة كل الطلبات المكتملة
  async function clearArchive() {
    if (!confirm('هل تريد حذف جميع الطلبات المؤرشفة (المكتملة) نهائياً؟')) return;

    const completedIds = orders.filter(o => o.status === 'completed').map(o => o.id);
    if (completedIds.length === 0) return alert('لا توجد طلبات مؤرشفة لحذفها');

    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', completedIds);

    if (!error) {
      setOrders(orders.filter(o => o.status !== 'completed'));
    }
  }

  // طباعة الفاتورة
  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsList = Array.isArray(order.items) 
      ? order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:left;">${(Number(i.price) * i.quantity).toLocaleString()} د.ع</td></tr>`).join('')
      : '';

    const printContent = `
      <html dir="rtl">
        <head>
          <title>فاتورة طلب #${order.id}</title>
          <style>
            body { font-family: Tahoma, sans-serif; padding: 15px; color: #000; width: 280px; margin: 0 auto; }
            h2 { text-align: center; margin-bottom: 2px; font-size: 18px; }
            .sub { text-align: center; font-size: 11px; margin-bottom: 10px; color: #444; }
            .info { font-size: 12px; margin-bottom: 8px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
            th, td { border-bottom: 1px dashed #999; padding: 4px 2px; }
            th { text-align: right; }
            .totals { margin-top: 10px; font-size: 12px; border-top: 1px solid #000; padding-top: 5px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .grand { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>مطعم عمو ناجي 🍔</h2>
          <div class="sub">فاتورة مبيعات</div>
          <div class="info">
            <div><strong>رقم الطلب:</strong> #${order.id}</div>
            <div><strong>الزبون:</strong> ${order.customer_name}</div>
            <div><strong>الهاتف:</strong> ${order.customer_phone}</div>
            <div><strong>العنوان:</strong> ${order.customer_address}</div>
            <div><strong>الوقت:</strong> ${new Date(order.created_at).toLocaleString('ar-IQ')}</div>
          </div>
          <table>
            <thead><tr><th>الوجبة</th><th style="text-align:center;">كمية</th><th style="text-align:left;">السعر</th></tr></thead>
            <tbody>${itemsList}</tbody>
          </table>
          <div class="totals">
            <div><span>مجموع الوجبات:</span> <span>${(order.food_total || 0).toLocaleString()} د.ع</span></div>
            <div><span>التوصيل:</span> <span>${(order.delivery_fee || 0).toLocaleString()} د.ع</span></div>
            <div class="grand"><span>الكلي:</span> <span>${(order.grand_total || 0).toLocaleString()} د.ع</span></div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const activeOrders = orders.filter(o => o.status !== 'completed');
  const archivedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 dir-rtl font-sans">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-amber-500">📦 إدارة الطلبات والديليفري</h1>
        <Link href="/" className="bg-slate-900 border border-slate-700 hover:border-amber-500 px-4 py-2 rounded-xl text-sm font-semibold transition">
          🛠️ العودة للمتجر
        </Link>
      </div>

      {/* أزرار التبديل بين الطلبات الجديدة والأرشيف */}
      <div className="max-w-4xl mx-auto flex gap-3 mb-6">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${activeTab === 'active' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-800'}`}
        >
          🚨 الطلبات الجديدة والجارية ({activeOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('archive')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${activeTab === 'archive' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-800'}`}
        >
          📂 أرشيف الطلبات المكتملة ({archivedOrders.length})
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <p className="text-center text-slate-500 py-10">جاري تحميل الطلبات...</p>
        ) : (activeTab === 'active' ? activeOrders : archivedOrders).length === 0 ? (
          <p className="text-center text-slate-500 py-10">لا توجد طلبات هنا حالياً.</p>
        ) : (
          (activeTab === 'active' ? activeOrders : archivedOrders).map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6 shadow-lg">
              
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-amber-400 font-bold text-lg">طلب #{order.id}</span>
                  <div className="flex items-center gap-2">
                    {/* اختيار حالة التوصيل */}
                    <select 
                      value={order.status || 'pending'} 
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        order.status === 'on_the_way' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <option value="pending" className="bg-slate-900 text-white">👨‍🍳 قيد التحضير</option>
                      <option value="on_the_way" className="bg-slate-900 text-white">🛵 المندوب في الطريق</option>
                      <option value="completed" className="bg-slate-900 text-white">✅ تم التسليم (أرشفة)</option>
                    </select>
                    <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('ar-IQ')}</span>
                  </div>
                </div>
                
                <div className="text-sm space-y-1 text-slate-300">
                  <p>👤 <strong>الاسم:</strong> {order.customer_name}</p>
                  <p>📞 <strong>الهاتف:</strong> <a href={`tel:${order.customer_phone}`} className="text-amber-400 underline">{order.customer_phone}</a></p>
                  <p>📍 <strong>العنوان:</strong> {order.customer_address}</p>
                </div>

                {order.items && Array.isArray(order.items) && (
                  <div className="bg-slate-950 p-3 rounded-xl mt-3">
                    <p className="text-xs font-bold text-amber-500 mb-2">الوجبات المطلوبة:</p>
                    <div className="space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="text-amber-400">{(Number(item.price) * item.quantity).toLocaleString()} د.ع</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-r border-slate-800 pt-4 md:pt-0 md:pr-6 min-w-[210px]">
                <div className="bg-slate-950 p-3 rounded-xl w-full text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between text-slate-400"><span>المجموع:</span><span>{(order.food_total || 0).toLocaleString()} د.ع</span></div>
                  <div className="flex justify-between text-slate-400"><span>التوصيل:</span><span>{(order.delivery_fee || 0).toLocaleString()} د.ع</span></div>
                  <div className="flex justify-between text-emerald-400 font-bold text-sm border-t border-slate-800 pt-1"><span>الكلي:</span><span>{(order.grand_total || 0).toLocaleString()} د.ع</span></div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={() => handlePrint(order)} 
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition text-center"
                  >
                    🖨️ طباعة الفاتورة
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'completed')} 
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/30 font-bold py-2 rounded-xl text-xs transition"
                  >
                    ✓ تسليم وأرشفة الطلب
                  </button>
                  <button 
                    onClick={() => deleteOrder(order.id)} 
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold py-1.5 rounded-xl text-xs transition"
                  >
                    🗑️ حذف نهائي
                  </button>
                </div>
              </div>

            </div>
          ))
        )}

        {/* زر تصفير الأرشيف إذا كنا في تبويب الأرشيف */}
        {activeTab === 'archive' && archivedOrders.length > 0 && (
          <div className="text-center pt-4">
            <button 
              onClick={clearArchive}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/40 px-6 py-2.5 rounded-xl text-sm font-bold transition"
            >
              🗑️ تصفير وحذف كل الأرشيف القديم
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
