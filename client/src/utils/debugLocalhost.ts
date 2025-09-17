/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ FIXED: أداة تشخيص شاملة لمشكلة localhost
// client/src/utils/debugLocalhost.ts

export const diagnoseLocalhostIssue = async () => {
  console.group('🔍 Localhost API Diagnosis');
  
  // 1. فحص إعدادات البيئة
  console.log('Environment Check:');
  console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('- NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('- Current URL:', window.location.href);
  
  // 2. فحص الاتصال بالسيرفر المحلي
  console.log('\n🌐 Testing Server Connection...');
  
  const baseUrl = 'http://localhost:5000';
  
  // اختبار 1: ping السيرفر الأساسي
  try {
    console.log('Testing base server...');
    const response = await fetch(baseUrl, {
      method: 'GET',
      mode: 'cors',
    });
    console.log('✅ Base server response:', response.status, response.statusText);
  } catch (error) {
    console.error('❌ Base server failed:', error.message);
  }
  
  // اختبار 2: health check
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      mode: 'cors',
    });
    console.log('✅ Health check:', response.status);
    if (response.ok) {
      const data = await response.text();
      console.log('Health response:', data);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  
  // اختبار 3: API endpoint
  try {
    console.log('Testing API endpoint...');
    const response = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      mode: 'cors',
    });
    console.log('✅ API endpoint:', response.status);
  } catch (error) {
    console.error('❌ API endpoint failed:', error.message);
  }
  
  // اختبار 4: register endpoint (OPTIONS للتحقق من CORS)
  try {
    console.log('Testing register endpoint (OPTIONS)...');
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    console.log('✅ Register OPTIONS:', response.status);
    console.log('CORS headers:', Object.fromEntries(
      [...response.headers.entries()].filter(([key]) => 
        key.toLowerCase().includes('access-control')
      )
    ));
  } catch (error) {
    console.error('❌ Register OPTIONS failed:', error.message);
  }
  
  // اختبار 5: POST request فعلي (مع بيانات خاطئة للاختبار)
  try {
    console.log('Testing register endpoint (POST)...');
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'test',
        password: 'test123'
      })
    });
    
    console.log('Register POST response:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Register endpoint working!');
    } else {
      const errorText = await response.text();
      console.log('Response body:', errorText);
      
      if (response.status === 400) {
        console.log('ℹ️ 400 Bad Request is expected for duplicate/invalid data');
      }
    }
  } catch (error) {
    console.error('❌ Register POST failed:', error.message);
    console.log('Error details:', error);
  }
  
  console.groupEnd();
};

// دالة فحص سريع
export const quickServerCheck = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'OPTIONS'
    });
    console.log(`Server Status: ${response.ok ? '✅ Online' : '❌ Issues'} (${response.status})`);
    return response.ok;
  } catch (error) {
    console.log('❌ Server Offline or CORS issues');
    return false;
  }
};

// تشغيل تلقائي في بيئة التطوير
if (import.meta.env.DEV && import.meta.env.VITE_API_URL?.includes('localhost')) {
  (window as any).diagnoseLs = {
    diagnoseLocalhostIssue,
    quickServerCheck,
  };
  
  console.log('🔧 Localhost debug tools: window.diagnoseLs.diagnoseLocalhostIssue()');
}