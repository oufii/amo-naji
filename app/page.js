'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({ 
    whatsapp_number: '9647722447722', 
    delivery_fee: 0,
    is_delivery_available: true
  });
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [locationUrl, setLocationUrl] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [myLatestOrder, setMyLatestOrder] = useState(null);

  useEffect(() => {
    fetchData();
    const savedOrderId = localStorage.getItem('amo_naji_last_order_id');
    if (savedOrderId) {
      fetchOrderStatus(savedOrderId);
      const interval = setInterval(() => {
        fetchOrderStatus(savedOrderId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  async function fetchOrderStatus(orderId) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (data) {
      setMyLatestOrder(data);
    }
  }

  async function fetchData() {
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: false });
    
    const { data: setData } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (menuData) {
      const formattedMenu = menuData.map(item => ({
        ...item,
        name: item.title || item.name,
        image_url: item.image || item.image_url,
        is_offer: item.is_special ?? item.is_offer
      }));
      setMenu(formattedMenu);
    }

    if (setData) {
      setSettings({
        whatsapp_number: setData.whatsapp_number || '9647722447722',
        delivery_fee: Number(setData.delivery_fee || 0),
        is_delivery_available: setData.is_delivery_available ?? true
      });
    }
    setLoading(false);
  }

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const decreaseQuantity = (id) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === id);
      if (existing.quantity === 1) {
        return prevCart.filter(item => item.id !== id);
      }
      return prevCart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const url = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        setLocationUrl(url);
        setGettingLocation(false);
      },
      (error) => {
        alert('تعذر جلب الموقع الجغرافي. يرجى التأكد من تفعيل الـ GPS والسماح بالإذن.');
        setGettingLocation(false);
      }
    );
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const foodTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const currentDeliveryFee = settings.is_delivery_available ? Number(settings.delivery_fee) : 0;
  const grandTotal = foodTotal + currentDeliveryFee;

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('السلة فارغة!');
    if (!settings.is_delivery_available) return alert('عذراً، التوصيل غير متاح حالياً!');

    try {
      const { data } = await supabase.from('orders').insert([
        {
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          location_url: locationUrl || '',
          items: cart,
          food_total: foodTotal,
          delivery_fee: currentDeliveryFee,
          grand_total: grandTotal,
          status: 'pending'
        }
      ]).select();

      if (data && data.length > 0) {
        const newOrderId = data[0].id;
        localStorage.setItem('amo_naji_last_order_id', newOrderId);
        setMyLatestOrder(data[0]);
      }
    } catch (err) {
      console.log('Error saving order:', err);
    }

    const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.name} × ${item.quantity} = ${(Number(item.price) * item.quantity).toLocaleString()} د.ع`).join('\n');

    let message = `🍔 *طلب جديد من مطعم عمو ناجي* 🍔\n\n` +
      `👤 *الاسم:* ${customerInfo.name}\n` +
      `📞 *الهاتف:* ${customerInfo.phone}\n` +
      `📍 *العنوان:* ${customerInfo.address}\n`;

    if (locationUrl) {
      message += `🗺️ *رابط الموقع:* ${locationUrl}\n`;
    }

    message += `\n🛒 *الوجبات:*\n${itemsList}\n\n` +
      `💵 *مجموع الوجبات:* ${foodTotal.toLocaleString()} د.ع\n` +
      `🚚 *التوصيل:* ${currentDeliveryFee.toLocaleString()} د.ع\n` +
      `💰 *المجموع الكلي:* ${grandTotal.toLocaleString()} د.ع`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodedMessage}`, '_blank');
    setIsCheckoutOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl">
      <header className="border-b border-slate-800 p-6 flex justify-between items-center max-w-6xl mx-auto sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
        <h1 className="text-3xl font-black text-amber-500">مطعم عمو ناجي 🍔</h1>
        <button 
          onClick={() => setIsCheckoutOpen(true)}
          className="bg-slate-900 border border-slate-700 hover:border-amber-500 px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2"
        >
          <span>🛒 السلة: <strong className="text-amber-400">{totalItemsCount}</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">{foodTotal.toLocaleString()} د.ع</span>
        </button>
      </header>

      {/* شاشة تتبع الطلب الحية للزبون */}
      {myLatestOrder && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-amber-500/5">
            <div className="space-y-1.5 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-amber-400 font-black text-lg">طلب رقم #{myLatestOrder.id}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  myLatestOrder.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  myLatestOrder.status === 'on_the_way' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {myLatestOrder.status === 'completed' ? '✅ تم تسليم الطلب وأرشفته بنجاح' :
                   myLatestOrder.status === 'on_the_way' ? '🛵 المندوب في الطريق إليك' : 
                   '👨‍🍳 الطلب قيد التحضير في المطعم'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {myLatestOrder.status === 'completed' ? 'شكراً لطلبك من مطعم عمو ناجي، نتمنى لك وجبة شهية وعليكم بالعافية!' : 
                 myLatestOrder.status === 'on_the_way' ? 'طلبك طلع وي المندوب وقريب يوصل لعنوانك.' :
                 'تم استلام طلبك بنجاح وجاري تجهيزه من قبل الشيف.'}
              </p>
            </div>
            
            <button 
              onClick={() => fetchOrderStatus(myLatestOrder.id)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2"
            >
              <span>🔄 تحديث الحالة</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6 space-y-10">
        {menu.some(i => i.is_offer) && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-amber-400 flex items-center gap-2">🔥 عروض خاصة ومميزة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menu.filter(i => i.is_offer).map((item) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="text-amber-400 font-extrabold text-lg my-1">{Number(item.price).toLocaleString()} د.ع</p>
                      {inCart ? (
                        <div className="flex items-center gap-3 mt-3 bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-1.5 w-fit">
                          <button onClick={() => decreaseQuantity(item.id)} className="text-amber-400 text-lg font-bold px-1">-</button>
                          <span className="font-bold text-sm">{inCart.quantity}</span>
                          <button onClick={() => addToCart(item)} className="text-amber-400 text-lg font-bold px-1">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} className="mt-2 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm">+ أضف العرض</button>
                      )}
                    </div>
                    {item.image_url && <img src={item.image_url} alt="" className="w-24 h-24 object-cover rounded-xl" />}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-4 text-slate-200">قائمة الوجبات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menu.filter(i => !i.is_offer).map((item) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  {item.image_url && <img src={item.image_url} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />}
                  <div>
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <p className="text-amber-400 font-extrabold text-lg my-2">{Number(item.price).toLocaleString()} د.ع</p>
                  </div>
                  {inCart ? (
                    <div className="flex justify-between items-center mt-4 bg-slate-950 border border-amber-500/50 rounded-xl p-2">
                      <button onClick={() => decreaseQuantity(item.id)} className="bg-amber-500 text-slate-950 font-black w-8 h-8 rounded-lg flex items-center justify-center text-lg">-</button>
                      <span className="font-bold text-lg">{inCart.quantity}</span>
                      <button onClick={() => addToCart(item)} className="bg-amber-500 text-slate-950 font-black w-8 h-8 rounded-lg flex items-center justify-center text-lg">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="w-full mt-4 bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl">+ إضافة للسلة</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-amber-500">سلة الطلبات</h3>
              <button onClick={() => setIsCheckoutOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-slate-400 text-center py-6">السلة فارغة حالياً</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl mb-2">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-amber-400 text-xs mt-0.5">{(Number(item.price) * item.quantity).toLocaleString()} د.ع</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                      <button onClick={() => decreaseQuantity(item.id)} className="text-amber-400 font-bold px-1">-</button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="text-amber-400 font-bold px-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-xs">حذف</button>
                  </div>
                </div>
              ))
            )}

            <div className="space-y-1 my-4 text-sm border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400"><span>الوجبات:</span><span>{foodTotal.toLocaleString()} د.ع</span></div>
              <div className="flex justify-between text-slate-400">
                <span>التوصيل:</span>
                <span>
                  {settings.is_delivery_available 
                    ? `${currentDeliveryFee.toLocaleString()} د.ع` 
                    : <span className="text-red-400 font-bold">مغلق حالياً</span>
                  }
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-base pt-1"><span>المجموع الكلي:</span><span>{grandTotal.toLocaleString()} د.ع</span></div>
            </div>

            <form onSubmit={handleSendWhatsApp} className="space-y-3">
              <input type="text" placeholder="الاسم" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white" />
              <input type="tel" placeholder="رقم الهاتف" required value={customerInfo.phone} onChange=_{e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white" />
              <textarea placeholder="العنوان التفصيلي" required value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm h-20 text-white"></textarea>

              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-sm border border-slate-700 flex items-center justify-center gap-2"
              >
                📍 {gettingLocation ? 'جاري تحديد موقعك...' : locationUrl ? 'تم إرفاق الموقع الجغرافي ✓' : 'إرفاق موقعي الحالي (GPS)'}
              </button>

              <button 
                type="submit" 
                disabled={!settings.is_delivery_available}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold py-3 rounded-xl text-white transition"
              >
                {settings.is_delivery_available ? 'إرسال عبر الواتساب 📲' : 'التوصيل مغلق حالياً ❌'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
