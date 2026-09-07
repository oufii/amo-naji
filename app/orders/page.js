'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // تحديث تلقائي كل 10 ثوانٍ لوكو طلبات جديدة
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (data) {
      setOrders(data);
    }
    setLoading(false);
  }

  // دالة حذف أو إلغاء الطلب
  async function deleteOrder(id) {
    if (!confirm('هل أنت متأكد من حذف أو إلغاء هذا الطلب؟')) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (!error) {
      setOrders(orders.filter(order => order.id !== id));
    } else {
      alert('حدث خطأ أثناء الحذف');
    }
  }

  // دالة طباعة الفاتورة بشكل احترافي ومرتب
  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    
    const itemsList = Array.isArray(order.items) 
      ? order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:left;">${(Number(i.price) * i.quantity).toLocaleString()} د.ع</td></tr>`).join('')
      : '<tr><td colspan="3">تفاصيل الوجبات غير متوفرة</td></tr>';

    const printContent = `
      <html dir="rtl">
        <head>
          <title>فاتورة طلب #${order.id}</title>
          <style>
            body { font-family: 'Cairo', Tahoma, sans-serif; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 20px; }
            .sub-title { text-align: center; font-size: 12px; margin-bottom: 15px; color: #555; }
            .info { margin-bottom: 10px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border-bottom: 1px dashed #ccc; padding: 6px 2px; }
            th { text-align: right; }
            .totals { margin-top: 15px; font-size: 13px; border-top: 2px solid #000; padding-top: 5px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .grand-total { font-weight: bold; font-size: 15px; border-top: 1px solid #000; padding-top: 4px; }
          </style>
        </head>
        <body>
          <h2>مطعم عمو ناجي 🍔</h2>
          <div class="sub-title">فاتورة طلب زبون</div>
          
          <div class="info">
            <div><strong>رقم الطلب:</strong> #${order.id}</div>
            <div><strong>اسم الزبون:</strong> ${order.customer_name || 'غير محدد'}</div>
            <div><strong>الهاتف:</strong> ${order.customer_phone || 'غير محدد'}</div>
            <div><strong>العنوان:</strong> ${order.customer_address || 'غير محدد'}</div>
            <div><strong>الوقت:</strong> ${new Date(order.created_at).toLocaleString('ar-IQ')}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>الوجبة</th>
                <th style="text-align:center;">الكمية</th>
                <th style="text-align:left;">السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="totals">
            <div><span>مجموع الوجبات:</span> <span>${(order.food_total || 0).toLocaleString()} د.ع</span></div>
            <div><span>رسوم التوصيل:</span> <span>${(order.delivery_fee || 0).toLocaleString()} د.ع</span></div>
            <div class="grand-total"><span>المجموع الكلي:</span> <span>${(order.grand_total || 0).toLocaleString()} د.ع</span></div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 dir-rtl font-sans">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-amber-500">📦 لوحة طلبات الزبائن ({orders.length})</h1>
        <Link href="/" className="bg-slate-900 border border-slate-700 hover:border-amber-500 px-4 py-2 rounded-xl text-sm font-semibold transition">
          🛠️ العودة للإدارة
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <p className="text-center text-slate-500 py-10">جاري تحميل الطلبات...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-slate-500 py-10">لا توجد طلبات جديدة حالياً.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6">
              
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-amber-400 font-bold text-lg">طلب #{order.id}</span>
                  <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('ar-IQ')}</span>
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

              <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-r border-slate-800 pt-4 md:pt-0 md:pr-6 min-w-[200px]">
                <div className="bg-slate-950 p-3 rounded-xl w-full text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between text-slate-400"><span>المجموع:</span><span>{(order.food_total || 0).toLocaleString()} د.ع</span></div>
                  <div className="flex justify-between text-slate-400"><span>التوصيل:</span><span>{(order.delivery_fee || 0).toLocaleString()} د.ع</span></div>
                  <div className="flex justify-between text-emerald-400 font-bold text-sm border-t border-slate-800 pt-1"><span>الكلي:</span><span>{(order.grand_total || 0).toLocaleString()} د.ع</span></div>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => handlePrint(order)} 
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition text-center"
                  >
                    🖨️ طباعة الفاتورة
                  </button>
                  <button 
                    onClick={() => deleteOrder(order.id)} 
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold px-3 py-2 rounded-xl text-xs transition"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
