'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'archive'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    // جلب الطلبات غير المكتملة
    const { data: currentData } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'completed')
      .order('id', { ascending: false });

    // جلب الطلبات المكتملة (الأرشيف)
    const { data: archiveData } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .order('id', { ascending: false });

    if (currentData) setOrders(currentData);
    if (archiveData) setArchivedOrders(archiveData);
    setLoading(false);
  }

  // دالة تسليم وأرشفة الطلب بضغطة زر وحدة
  const handleCompleteOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders(); // تحديث القوائم فوراً
    } catch (err) {
      alert('حدث خطأ أثناء أرشفة الطلب');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-amber-500">📦 إدارة الطلبات والديلفري</h1>
          <Link href="/" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs transition">
            العودة للمتجر 🛍️
          </Link>
        </div>

        {/* أزرار التبديل بين الطلبات الجارية والأرشيف */}
        <div className="flex gap-4 border-b border-slate-800 pb-4">
          <button 
            onClick={() => setActiveTab('current')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'current' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الطلبات الجارية ({orders.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('archive')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'archive' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            أرشيف الطلبات المكتملة ({archivedOrders.length})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-12">جاري تحميل الطلبات...</p>
        ) : activeTab === 'current' ? (
          /* عرض الطلبات الجارية */
          orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
              <p className="text-slate-400 text-base">لا توجد طلبات جارية حالياً ✨</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-black text-lg">طلب #{order.id}</span>
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">
                        قيد التحضير 👨‍🍳
                      </span>
                      <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('ar-IQ')}</span>
                    </div>

                    <div className="text-sm space-y-1 text-slate-300">
                      <p>👤 <strong>الاسم:</strong> {order.customer_name}</p>
                      <p>📞 <strong>الهاتف:</strong> <a href={`tel:${order.customer_phone}`} className="text-amber-400 underline">{order.customer_phone}</a></p>
                      <p>📍 <strong>العنوان:</strong> {order.customer_address}</p>
                      {order.location_url && (
                        <p>
                          <a href={order.location_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg inline-block mt-1">
                            🗺️ عرض الموقع على الخريطة (GPS)
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1 max-w-md">
                      <p className="font-bold text-amber-400 mb-1">الوجبات المطلوبة:</p>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="text-amber-400">{(Number(item.price) * item.quantity).toLocaleString()} د.ع</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                    <div className="text-left text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 w-full md:w-44">
                      <div className="flex justify-between text-slate-400"><span>الوجبات:</span><span>{Number(order.food_total || 0).toLocaleString()} د.ع</span></div>
                      <div className="flex justify-between text-slate-400"><span>التوصيل:</span><span>{Number(order.delivery_fee || 0).toLocaleString()} د.ع</span></div>
                      <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1"><span>الكلي:</span><span>{Number(order.grand_total || 0).toLocaleString()} د.ع</span></div>
                    </div>

                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                      >
                        ✓ تسليم وأرشفة الطلب
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2.5 rounded-xl text-xs transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* عرض الأرشيف (الطلبات المكتملة) */
          archivedOrders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
              <p className="text-slate-400 text-base">الأرشيف فارغ حالياً 📂</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedOrders.map((order) => (
                <div key={order.id} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-black text-lg">طلب #{order.id}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold">
                        تم التسليم والأرشفة ✅
                      </span>
                      <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('ar-IQ')}</span>
                    </div>

                    <div className="text-sm space-y-1 text-slate-400">
                      <p>👤 <strong>الاسم:</strong> {order.customer_name}</p>
                      <p>📞 <strong>الهاتف:</strong> {order.customer_phone}</p>
                      <p>📍 <strong>العنوان:</strong> {order.customer_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <span className="text-emerald-400 font-bold text-sm">
                      {Number(order.grand_total || 0).toLocaleString()} د.ع
                    </span>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs transition"
                    >
                      حذف نهائي
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
}
