// Service Worker for FINC AI Platform
// 版本号
const CACHE_NAME = 'finc-ai-v1.0.0';
const STATIC_CACHE = 'finc-static-v1.0.0';
const DYNAMIC_CACHE = 'finc-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

// 需要缓存的API路径
const CACHE_API_PATTERNS = [
  /^\/api\/user\/status$/,
  /^\/api\/payment\/config$/
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 处理静态资源请求
  if (request.method === 'GET') {
    // 静态资源 - 缓存优先策略
    if (STATIC_ASSETS.includes(url.pathname) || 
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            return fetch(request)
              .then((response) => {
                // 只缓存成功的响应
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(STATIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    });
                }
                return response;
              });
          })
          .catch(() => {
            // 离线时的降级处理
            if (request.destination === 'document') {
              return caches.match('/');
            }
          })
      );
      return;
    }
    
    // API请求 - 网络优先，缓存降级
    if (url.pathname.startsWith('/api/')) {
      const shouldCache = CACHE_API_PATTERNS.some(pattern => 
        pattern.test(url.pathname)
      );
      
      if (shouldCache) {
        event.respondWith(
          fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // 网络失败时使用缓存
              return caches.match(request);
            })
        );
        return;
      }
    }
    
    // 页面请求 - 网络优先策略
    if (request.destination === 'document') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // 缓存成功的页面响应
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // 离线时返回缓存的页面或首页
            return caches.match(request)
              .then((cachedResponse) => {
                return cachedResponse || caches.match('/');
              });
          })
      );
      return;
    }
  }
});

// 处理消息事件
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred', event.error);
});

// 未处理的Promise拒绝
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
});