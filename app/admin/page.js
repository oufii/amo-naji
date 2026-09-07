'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_PIN = "9090"; 

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // حالات البيانات
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(5000);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchSettings();
    }
    setLoading(false);
  }, []);

  // جلب إعدادات التوصيل الحالية من Supabase
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setDeliveryEnabled(data.delivery_enabled ?? true);
        setDeliveryFee(data.delivery_fee ?? 5000);
      }
    } catch (e) {
      console.log('Error fetching settings:', e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      fetchSettings();
      setError('');
    } else {
      setError('الرمز السرّي غير صحيح!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  // 1. حفظ إعدادات التوصيل في Supabase
  const handleSaveDelivery = async () => {
    setIsSavingDelivery(true);
    setStatusMsg('');
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      delivery_enabled: deliveryEnabled,
      delivery_fee: Number(deliveryFee)
    });

    setIsSavingDelivery(false);
    if (error) {
      setStatusMsg('❌ فشل حفظ التوصيل: ' + error.message);
    } else {
      setStatusMsg('✅ تم حفظ إعدادات التوصيل بنجاح!');
    }
  };

  // 2. إضافة الوجبة ورفع الصورة إلى Supabase
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) {
      setStatusMsg('⚠️ يرجى أدخال اسم الوجبة والسعر!');
      return;
    }

    setIsAddingItem(true);
    setStatusMsg('');
    let imageUrl = '';

    try {
      // رفع الصورة إلى Supabase Storage إن وجدت
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // حفظ الوجبة في جدول menu_items
      const { error: insertError } = await supabase.from('menu_items').insert([
        {
          name: itemName,
          price: Number(itemPrice),
          image_url: imageUrl
        }
      ]);

      if (insertError) throw insertError;

      setStatusMsg('✅ تم إضافة الوجبة بنجاح!');
      setItemName('');
      setItemPrice('');
      setImageFile(null);
    } catch (err) {
      setStatusMsg('❌ حدث خطأ أثناء الإضافة: ' + err.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', width: '320px' }}>
          <h2>لوحة التحكم 🔒</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>أدخل الرمز السرّي للدخول</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', textAlign: 'center', fontSize: '20px' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            دخول
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '850px', margin: '0 auto 20px auto', background: '#1e293b', padding: '15px 20px', borderRadius: '12px' }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>🛠️ لوحة إدارة المطعم</h1>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل الخروج 🚪
        </button>
      </div>

      {statusMsg && (
        <div style={{ maxWidth: '850px', margin: '0 auto 20px auto', padding: '12px', background: '#334155', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          {statusMsg}
        </div>
      )}

      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* قسم إعدادات التوصيل */}
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8' }}>🛵 إعدادات التوصيل</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', cursor: 'pointer', margin: '15px 0' }}>
            <input 
              type="checkbox" 
              checked={deliveryEnabled} 
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            التوصيل متاح حالياً ✅
          </label>
          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '5px' }}>سعر التوصيل (د.ع)</label>
            <input 
              type="number" 
              value={deliveryFee} 
              onChange={(e) => setDeliveryFee(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
            />
          </div>
          <button 
            onClick={handleSaveDelivery}
            disabled={isSavingDelivery}
            style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isSavingDelivery ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل'}
          </button>
        </div>

        {/* قسم إضافة وجبة مع الصورة بجانب الحقول */}
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: '#f59e0b' }}>➕ إضافة وجبة أو عرض جديد</h3>
          <form onSubmit={handleAddItem}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>اسم الوجبة</label>
                <input 
                  type="text" 
                  placeholder="اسم الوجبة / العرض" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>السعر (د.ع)</label>
                <input 
                  type="number" 
                  placeholder="السعر" 
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>صورة الوجبة</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '12px' }}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isAddingItem}
              style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isAddingItem ? 'جاري الإضافة والرفع...' : 'إضافة الوجبة'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
