'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [menu, setMenu] = useState([]);
  const [deliverySettings, setDeliverySettings] = useState({ 
    delivery_fee: 500,
    is_delivery_available: true 
  });
  const [newItem, setNewItem] = useState({ name: '', price: '', image_url: '', is_special: false });
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '9090') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      alert('الرمز السري غير صحيح! ❌');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  async function fetchData() {
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: false });
    if (menuData) setMenu(menuData);

    const { data: setData } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (setData) {
      setDeliverySettings({
        delivery_fee: setData.delivery_fee ?? 500,
        is_delivery_available: setData.is_delivery_available ?? true
      });
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('restaurant_settings')
      .update({ 
        delivery_fee: Number(deliverySettings.delivery_fee),
        is_delivery_available: deliverySettings.is_delivery_available 
      })
      .eq('id', 1);

    if (error) alert('حدث خطأ أثناء حفظ إعدادات التوصيل');
    else alert('تم حفظ إعدادات التوصيل بنجاح ✓');
  };

  const handleImageUpload = async () => {
    if (!imageFile) return newItem.image_url;
    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      setUploading(false);
      return data.publicUrl;
    } catch (error) {
      setUploading(false);
      alert('فشل رفع الصورة');
      return '';
    }
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    let imageUrl = newItem.image_url;
    if (imageFile) {
      imageUrl = await handleImageUpload();
    }

    // إرسال الأعمدة المتوافقة حصراً مع قاعدة بياناتك الحقيقية
    const itemData = {
      name: newItem.name,
      price: Number(newItem.price),
      image_url: imageUrl,
      is_special: Boolean(newItem.is_special)
    };

    if (editingId) {
      const { error } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', editingId);
      if (error) {
        console.error(error);
        alert('خطأ في التعديل: ' + error.message);
      } else {
        setEditingId(null);
        alert('تم تعديل الوجبة بنجاح ✓');
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .insert([itemData]);
      if (error) {
        console.error(error);
        alert('خطأ في الإضافة: ' + error.message);
      } else {
        alert('تم إضافة الوجبة بنجاح ✓');
      }
    }

    setNewItem({ name: '', price: '', image_url: '', is_special: false });
    setImageFile(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewItem({ 
      name: item.name || item.title || '', 
      price: item.price, 
      image_url: item.image_url || item.image || '',
      is_special: item.is_special ?? item.is_offer ?? false 
    });
    setImageFile(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert('خطأ في الحذف');
    else fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-amber-500">🔒 لوحة التحكم المحمية</h1>
            <p className="text-xs text-slate-400">الرجاء إدخال الرمز السري للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="أدخل الرمز السري (مثال: 9090)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center text-lg tracking-widest text-white focus:border-amber-500 outline-none"
              autoFocus
              required
            />
            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-amber-500/10"
            >
              دخول للوحة التحكم 🚀
            </button>
          </form>
          <div className="text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-amber-400 underline">
              العودة للمتجر الرئيسي 🛍️
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-amber-500">لوحة التحكم بالمطعم ⚙️</h1>
            <button 
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              🚪 تسجيل خروج
            </button>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs transition">
              العودة للمتجر 🛍️
            </Link>
          </div>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">🛵 إعدادات التوصيل</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-sm">التوصيل متاح حالياً ✓</span>
              <input 
                type="checkbox"
                checked={deliverySettings.is_delivery_available}
                onChange={(e) => setDeliverySettings({...deliverySettings, is_delivery_available: e.target.checked})}
                className="w-6 h-6 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">سعر التوصيل (د.ع)</label>
              <input 
                type="number"
                value={deliverySettings.delivery_fee}
                onChange={(e) => setDeliverySettings({...deliverySettings, delivery_fee: e.target.value})}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white font-bold"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl text-white transition text-sm">
              حفظ إعدادات التوصيل
            </button>
          </form>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            {editingId ? '✏️ تعديل الوجبة الحالية' : '➕ إضافة وجبة أو عرض جديد'}
          </h2>
          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم الوجبة / العرض</label>
                <input 
                  type="text" 
                  placeholder="مثال: عرض عائلي دبل برجر" 
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">السعر (د.ع)</label>
                <input 
                  type="number" 
                  placeholder="السعر" 
                  required
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">صورة الوجبة</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 file:ml-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <input 
                type="checkbox" 
                id="is_special"
                checked={newItem.is_special || false}
                onChange={(e) => setNewItem({ ...newItem, is_special: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="is_special" className="text-sm font-bold text-amber-400 cursor-pointer select-none">
                🔥 جعل هذا المنتج ضمن قسم العروض المميزة (يظهر فوق في الواجهة)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={uploading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl text-sm transition"
              >
                {uploading ? 'جاري الرفع...' : editingId ? 'حفظ التعديلات ✓' : 'إضافة الوجبة للقائمة 🚀'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setNewItem({ name: '', price: '', image_url: '', is_special: false }); }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-3 rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">📋 الوجبات الحالية في القائمة ({menu.length})</h2>
          <div className="space-y-3">
            {menu.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  {(item.image_url || item.image) && (
                    <img src={item.image_url || item.image} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-800" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{item.name || item.title}</h3>
                      {item.is_special && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          عرض مميز 🔥
                        </span>
                      )}
                    </div>
                    <p className="text-amber-400 font-bold text-sm mt-1">{Number(item.price).toLocaleString()} د.ع</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    تعديل
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
