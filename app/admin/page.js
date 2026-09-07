'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// اختر الرمز السرّي الذي تحبه هنا
const ADMIN_PIN = "9090"; 

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // حالات لوحة التحكم
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(5000);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('الرمز السرّي غير صحيح!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  if (loading) return null;

  // 1. شاشة إدخال الرمز السرّي
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <h2 style={{ marginBottom: '10px' }}>لوحة التحكم 🔒</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>أدخل الرمز السرّي للدخول</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', textAlign: 'center', fontSize: '20px', outline: 'none' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            دخول
          </button>
        </form>
      </div>
    );
  }

  // 2. محتوى لوحة التحكم الكامل
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      
      {/* شريط أعلى الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto 30px auto', background: '#1e293b', padding: '15px 20px', borderRadius: '12px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>🛠️ لوحة إدارة المطعم</h1>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل الخروج 🚪
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
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
          <button style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            حفظ إعدادات التوصيل
          </button>
        </div>

        {/* قسم إضافة وجبة */}
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: '#f59e0b' }}>➕ إضافة وجبة أو عرض جديد</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="اسم الوجبة / العرض" 
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{ padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
            />
            <input 
              type="number" 
              placeholder="السعر (د.ع)" 
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              style={{ padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
            />
          </div>
          <input type="file" style={{ marginBottom: '15px', color: '#94a3b8' }} />
          <button style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            إضافة الوجبة
          </button>
        </div>

      </div>
    </div>
  );
}
