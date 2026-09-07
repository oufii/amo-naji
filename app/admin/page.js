'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSpecial, setIsSpecial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // حالات إعدادات التوصيل
  const [deliveryFee, setDeliveryFee] = useState(5000);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: menuData } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    const { data: setData } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (menuData) setItems(menuData);
    if (setData) {
      setDeliveryFee(setData.delivery_fee ?? 5000);
      setIsDeliveryAvailable(setData.is_delivery_available ?? true);
    }
  }

  // حفظ إعدادات التوصيل
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from('restaurant_settings')
      .upsert({
        id: 1,
        delivery_fee: Number(deliveryFee),
        is_delivery_available: isDeliveryAvailable
      });

    if (error) {
      alert('حدث خطأ أثناء حفظ إعدادات التوصيل: ' + error.message);
    } else {
      alert('تم تحديث إعدادات التوصيل بنجاح!');
    }
    setSavingSettings(false);
  };

  // رفع الصورة وإضافة الوجبة
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title || !price || !imageFile) {
      return alert('يرجى ملء جميع الحقول وإرفاق صورة الوجبة');
    }

    setLoading(true);
    setImageUploading(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      setImageUploading(false);

      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          title,
          price: Number(price),
          image: imageUrl,
          is_special: isSpecial
        }]);

      if (insertError) throw insertError;

      setTitle('');
      setPrice('');
      setImageFile(null);
      setIsSpecial(false);
      fetchData();
      alert('تمت إضافة الوجبة بنجاح!');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('هل أنت تأكد من حذف هذه الوجبة؟')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans dir-rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <h1 className="text-2xl font-black text-amber-500">لوحة إدارة المطعم 🛠️</h1>
        </div>

        {/* قسم إعدادات التوصيل */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">🛵 إعدادات التوصيل</h2>
          
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <input 
              type="checkbox" 
              id="deliveryToggle"
              checked={isDeliveryAvailable} 
              onChange={e => setIsDeliveryAvailable(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer"
            />
            <label htmlFor="deliveryToggle" className="text-sm font-bold cursor-pointer select-none">
              {isDeliveryAvailable ? 'التوصيل متاح حالياً ✅' : 'التوصيل غير متاح حالياً (مغلق) ❌'}
            </label>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">سعر التوصيل (د.ع)</label>
            <input 
              type="number" 
              value={deliveryFee} 
              onChange={e => setDeliveryFee(e.target.value)}
              disabled={!isDeliveryAvailable}
              placeholder="مثال: 3000"
              className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition text-sm"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل'}
          </button>
        </div>

        {/* قسم إضافة وجبة جديدة */}
        <form onSubmit={handleAddItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">➕ إضافة وجبة أو عرض جديد</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="اسم الوجبة / العرض" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-amber-500"
            />
            <input 
              type="number" 
              placeholder="السعر (د.ع)" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-slate-400">إرفاق صورة الوجبة من الجهاز:</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-slate-400 file:bg-slate-800 file:border-0 file:rounded-lg file:text-white file:px-3 file:py-1 hover:file:bg-slate-700"
            />
            {imageUploading && <p className="text-xs text-amber-400">جاري رفع الصورة...</p>}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isSpecial"
              checked={isSpecial} 
              onChange={e => setIsSpecial(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <label htmlFor="isSpecial" className="text-sm font-semibold cursor-pointer">تحديد كـ "عرض خاص 🔥"</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
          >
            {loading ? 'جاري الإضافة...' : 'إضافة المادة للقائمة'}
          </button>
        </form>

        {/* قائمة الوجبات الحالية */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-slate-200">📋 قائمة الوجبات والعروض الحالية</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                  <div>
                    <div className="font-bold">{item.title}</div>
                    <div className="text-amber-400 text-xs">{Number(item.price).toLocaleString()} د.ع {item.is_special && '🔥 عرض خاص'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs transition"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
