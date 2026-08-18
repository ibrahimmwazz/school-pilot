import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TeacherView } from './views/TeacherView';
import { FormMasterView } from './views/FormMasterView';
import { FormMasterAttendanceView } from './views/FormMasterAttendanceView';
import { FormMasterReportsView } from './views/FormMasterReportsView';
import { BursarView } from './views/BursarView';
import { LoginView } from './views/LoginView';
import { PrincipalView } from './views/PrincipalView';
import { HeadMasterView } from './views/HeadMasterView';
import { StudentView } from './views/StudentView';
import { ParentView } from './views/ParentView';

function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function mixColors(color1: any, color2: any, weight: number) {
  const w1 = weight;
  const w2 = 1 - weight;
  return `rgb(${Math.round(color1.r * w1 + color2.r * w2)}, ${Math.round(color1.g * w1 + color2.g * w2)}, ${Math.round(color1.b * w1 + color2.b * w2)})`;
}

function applyBrandColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  
  const root = document.documentElement;
  root.style.setProperty('--brand-50', mixColors(rgb, white, 0.1));
  root.style.setProperty('--brand-100', mixColors(rgb, white, 0.2));
  root.style.setProperty('--brand-500', hex); // original
  root.style.setProperty('--brand-600', mixColors(rgb, black, 0.8));
  root.style.setProperty('--brand-700', mixColors(rgb, black, 0.6));
  root.style.setProperty('--brand-900', mixColors(rgb, black, 0.4));
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        
        // Fetch metadata to apply branding
        fetch('/api/school/metadata', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.school?.primaryColor) {
             applyBrandColor(data.school.primaryColor);
          }
        }).catch(console.error);
        
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  if (!token || !user) {
    return <LoginView onLogin={setToken} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={() => setToken(null)} />}>
          {user.role === 'TEACHER' && <Route path="/" element={<TeacherView />} />}
          {user.role === 'FORM_MASTER' && (
            <>
              <Route path="/" element={<Navigate to="/form-master" />} />
              <Route path="/form-master" element={<FormMasterView />} />
              <Route path="/form-master/attendance" element={<FormMasterAttendanceView />} />
              <Route path="/form-master/reports" element={<FormMasterReportsView />} />
            </>
          )}
          {user.role === 'BURSAR' && <Route path="/" element={<BursarView />} />}
          {user.role === 'PRINCIPAL' && <Route path="/" element={<PrincipalView />} />}
          {user.role === 'HEAD_MASTER' && <Route path="/" element={<HeadMasterView />} />}
          {user.role === 'STUDENT' && <Route path="/" element={<StudentView />} />}
          {user.role === 'ADMIN' && <Route path="/" element={<PrincipalView />} />}
          {user.role === 'PARENT' && <Route path="/" element={<ParentView />} />}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
