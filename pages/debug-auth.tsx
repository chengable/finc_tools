import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DebugAuth() {
  const [userStatus, setUserStatus] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string>('');

  useEffect(() => {
    // 获取cookie信息
    const allCookies = document.cookie;
    setCookies(allCookies);
    
    // 提取jwt_token (注意：HttpOnly cookie无法通过JavaScript读取)
    const tokenMatch = allCookies.match(/jwt_token=([^;]+)/);
    if (tokenMatch) {
      setJwtToken(tokenMatch[1]);
    } else {
      setJwtToken('JWT Token是HttpOnly，JavaScript无法读取（这是正常的安全设置）');
    }

    // 测试 /api/user/status
    const testUserStatus = async () => {
      try {
        const response = await axios.get('/api/user/status');
        setUserStatus({ success: true, data: response.data });
      } catch (error: any) {
        setUserStatus({ success: false, error: error.response?.data || error.message });
      }
    };

    testUserStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      const response = await axios.get('/api/user/status');
      setUserStatus({ success: true, data: response.data });
    } catch (error: any) {
      setUserStatus({ success: false, error: error.response?.data || error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">认证状态调试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cookie 信息 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookie 信息</h2>
            <div className="space-y-2">
              <div>
                <strong>可读取的 Cookies:</strong>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto mt-1">
                  {cookies || '无可读取的Cookie（HttpOnly cookie不会显示在这里）'}
                </pre>
              </div>
              <div>
                <strong>JWT Token 状态:</strong>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto mt-1">
                  {jwtToken}
                </pre>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <strong>说明：</strong> JWT Token设置为HttpOnly，这是安全的做法。
                JavaScript无法读取，但服务器可以正常接收和验证。
              </div>
            </div>
          </div>

          {/* /api/user/status 响应 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">/api/user/status 响应</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {userStatus ? JSON.stringify(userStatus, null, 2) : '加载中...'}
            </pre>
            {userStatus?.success && userStatus?.data?.isLoggedIn && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
                <strong className="text-green-800">✅ 认证状态正常</strong>
                <div className="text-sm text-green-700 mt-1">
                  用户类型: {userStatus.data.userType} | 
                  用户名: {userStatus.data.data?.username}
                </div>
              </div>
            )}
          </div>

          {/* 手动测试按钮 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">手动测试</h2>
            <div className="space-y-4">
              <button
                onClick={refreshStatus}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                刷新状态
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  document.cookie = 'jwt_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  window.location.reload();
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
              >
                清除 Cookie
              </button>
            </div>
          </div>

          {/* 快速登录 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">快速操作</h2>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/developer/login'}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                前往管理员登录
              </button>
              <button
                onClick={() => window.location.href = '/taskdetails/12345678'}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-2"
              >
                测试任务详情页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 