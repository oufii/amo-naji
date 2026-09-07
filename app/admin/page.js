'use client';
import { useState, useEffect } from 'react';

// ضع الرمز السرّي الخاص بك هنا
const ADMIN_PIN = "9090"; // غيّره للرقم الذي تريده

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // التحقق من وجود جلسة محفوطة مسبقاً
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

  // إذا لم يكن مسجلاً، تظهر شاشة طلب الرمز السرّي
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', textAlign: 'center', width: '300px' }}>
          <h2>لوحة التحكم 🔒</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>أدخل الرمز السرّي للدخول</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            style={{ width: '100%', padding: '10px', margin: '15px 0', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center', fontSize: '18px' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            دخول
          </button>
        </form>
      </div>
    );
  }

  // هنا محتوى لوحة التحكم الخاص بك المعتاد
  return (
    <div>
      <div style={{ padding: '10px', textAlign: 'left' }}>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
          تسجيل الخروج 🚪
        </button>
      </div>
      
      {/* باقي عناصر لوحة التحكم المووجودة عندك سابقاً */}
    </div>
  );
}
