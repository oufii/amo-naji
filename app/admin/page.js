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
  
  // حالة قائمة الوجبات
  const [menuItems, setMenuItems] = useState([]);

  // حالات التعديل
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const siteUrl = "https://oufii-amo-naji-uj6t.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(siteUrl)}`;

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchSettings();
      fetchMenuItems();
    }
    setLoading(false);
  }, []);

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

  const fetchMenuItems = async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: false });
      if (data) {
        setMenuItems(data);
      }
    } catch (e) {
      console.log('Error fetching menu items:', e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      fetchSettings();
      fetchMenuItems();
      setError('');
    } else {
      setError('الرمز السرّي غير صحيح!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

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
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

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
      fetchMenuItems();
    } catch (err) {
      setStatusMsg('❌ حدث خطأ أثناء الإضافة: ' + err.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setStatusMsg('🗑️ تم حذف الوجبة بنجاح');
      fetchMenuItems();
    } catch (err) {
      setStatusMsg('❌ فشل الحذف: ' + err.message);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
  };

  const handleSaveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ name: editName, price: Number(editPrice) })
        .eq('id', id);

      if (error) throw error;
      setStatusMsg('✨ تم تحديث الوجبة بنجاح!');
      setEditingId(null);
      fetchMenuItems();
    } catch (err) {
      setStatusMsg('❌ فشل التحديث: ' + err.message);
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
        
        {/* قسم الباركود الخاص بالموقع */}
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#f43f5e' }}>🖨️ باركود موقع المطعم للزبائن</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>امسح الكود أو قم بطباعته لكي يفتح الزبائن قائمة الطعام مباشرة:</p>
          <div style={{ background: '#fff', padding: '10px', display: 'inline-block', borderRadius: '8px' }}>
            <img src={qrCodeUrl} alt="Restaurant QR Code" style={{ display: 'block', width: '150px', height: '150px' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <a href={siteUrl} target="_blank" style={{ color: '#38bdf8', fontSize: '13px', wordBreak: 'break-all' }}>{siteUrl}</a>
          </div>
        </div>

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

        {/* قسم إضافة وجبة */}
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

        {/* قسم قائمة الوجبات الحالية وإدارتها (تعديل وحذف) */}
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: '#34d399' }}>📋 الوجبات الحالية في القائمة ({menuItems.length})</h3>
          
          {menuItems.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', margin: '20px 0' }}>لا توجد وجبات مضافة حالياً.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {menuItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: '1px solid #334155' }}>
                  
                  {editingId === item.id ? (
                    // وضع التعديل
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', flex: 2 }}
                      />
                      <input 
                        type="number" 
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)}
                        style={{ padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', flex: 1 }}
                      />
                      <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                      <button onClick={() => setEditingId(null)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>إلغاء</button>
                    </div>
                  ) : (
                    // الوضع العادي مع زر التعديل والحذف
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <div style={{ width: '50px', height: '50px', background: '#334155', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>لا توجد</div>
                        )}
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{item.name}</h4>
                          <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px' }}>{Number(item.price).toLocaleString()} د.ع</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleStartEdit(item)}
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                        >
                          تعديل ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
