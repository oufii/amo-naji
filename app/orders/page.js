'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // تحديث تلقائي كل 10 ثوانٍ حتى تنزل الطلبات الجديدة فوراً بدون ما تحدث الصفحة
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false });
      if (data) {
        setOrders(data);
      }
    } catch (e) {
      console.log('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    let itemsHtml = '';
    if (Array.isArray(order.items)) {
      itemsHtml = order.items.map((item, i) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dashed #ddd; padding-bottom: 4px;">
          <span>${i + 1}. ${item.name} × ${item.quantity}</span>
          <span>${(item.price * item.quantity).toLocaleString()} د.ع</span>
        </div>
      `).join('');
    }

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة طلب رقم #${order.id}</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; padding: 15px; width: 300px; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; }
            .info { margin-bottom: 15px; font-size: 14px; }
            .totals { margin-top: 15px; border-top: 2px solid #000; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>مطعم عمو ناجي 🍔</h2>
          <p style="text-align: center; font-size: 12px; margin-top: 0;">طلب رقم: #${order.id}</p>
          <div class="info">
            <p><strong>الاسم:</strong> ${order.customer_name}</p>
            <p><strong>الهاتف:</strong> ${order.customer_phone}</p>
            <p><strong>العنوان:</strong> ${order.customer_address}</p>
            ${order.location_url ? `<p><strong>الموقع:</strong> <a href="${order.location_url}" target="_blank">رابط الخريطة</a></p>` : ''}
          </div>
          <hr/>
          <div style="font-size: 14px;">
            <strong>الوجبات:</strong>
            <div style="margin-top: 5px;">${itemsHtml}</div>
          </div>
          <div class="totals" style="font-size: 14px;">
            <div>مجموع الوجبات: ${Number(order.food_total).toLocaleString()} د.ع</div>
            <div>سعر التوصيل: ${Number(order.delivery_fee).toLocaleString()} د.ع</div>
            <div style="font-size: 16px; margin-top: 5px;">المجموع الكلي: ${Number(order.grand_total).toLocaleString()} د.ع</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div style={{ background: '#0f172a', color: '#fff', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>جاري التحميل...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', margin: 0 }}>📦 لوحة طلبات الزبائن ({orders.length})</h1>
          <a href="/admin" style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>العودة للإدارة 🛠️</a>
        </div>

        {orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>لا توجد طلبات جديدة حالياً.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#38bdf8' }}>طلب #{order.id}</h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(order.created_at).toLocaleString('ar-IQ')}</span>
                  </div>
                  <p style={{ margin: '4px 0' }}><strong>👤 الاسم:</strong> {order.customer_name}</p>
                  <p style={{ margin: '4px 0' }}><strong>📞 الهاتف:</strong> <a href={`tel:${order.customer_phone}`} style={{ color: '#60a5fa' }}>{order.customer_phone}</a></p>
                  <p style={{ margin: '4px 0' }}><strong>📍 العنوان:</strong> {order.customer_address}</p>
                  {order.location_url && (
                    <p style={{ margin: '4px 0' }}>
                      <a href={order.location_url} target="_blank" style={{ color: '#34d399', textDecoration: 'underline' }}>📍 فتح موقع الزبون على الخريطة</a>
                    </p>
                  )}

                  <div style={{ marginTop: '10px', background: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#fbbf24' }}>الوجبات المطلوبة:</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingRight: '20px', fontSize: '13px' }}>
                      {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} × {item.quantity} ({(item.price * item.quantity).toLocaleString()} د.ع)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minWidth: '180px' }}>
                  <div style={{ textAlign: 'left', background: '#0f172a', padding: '12px', borderRadius: '8px', width: '100%', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>المجموع: {Number(order.food_total).toLocaleString()} د.ع</div>
                    <div style={{ fontSize: '12px', color: '#94a3,b8' }}>التوصيل: {Number(order.delivery_fee).toLocaleString()} د.ع</div>
                    <div style={{ fontSize: '16px', color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>الكلي: {Number(order.grand_total).toLocaleString()} د.ع</div>
                  </div>

                  <button 
                    onClick={() => handlePrint(order)}
                    style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🖨️ طباعة الفاتورة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
