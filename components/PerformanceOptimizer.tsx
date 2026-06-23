import React from 'react';
import Head from 'next/head';
import Script from 'next/script';

interface PerformanceOptimizerProps {
  preloadFonts?: string[];
  preloadImages?: string[];
  preloadScripts?: string[];
  enableServiceWorker?: boolean;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  preloadFonts = [],
  preloadImages = [],
  preloadScripts = [],
  enableServiceWorker = false
}) => {
  return (
    <>
      <Head>
      {/* 预加载关键字体 */}
      {preloadFonts.map((font, index) => (
        <link
          key={`font-${index}`}
          rel="preload"
          href={font}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}
      
      {/* 预加载关键图片 */}
      {preloadImages.map((image, index) => (
        <link
          key={`image-${index}`}
          rel="preload"
          href={image}
          as="image"
        />
      ))}
      
      {/* 预加载关键脚本 */}
      {preloadScripts.map((script, index) => (
        <link
          key={`script-${index}`}
          rel="preload"
          href={script}
          as="script"
        />
      ))}
      
      {/* 资源提示 - 移除Google服务，优化国内访问 */}
      <link rel="dns-prefetch" href="//hm.baidu.com" />
      
      {/* 预连接到关键第三方域名 */}
      <link rel="preconnect" href="https://hm.baidu.com" />
      
      {/* 关键CSS内联 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 关键CSS - 首屏渲染优化 */
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* 防止布局偏移 */
          .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          /* 图片懒加载优化 */
          img[loading="lazy"] {
            opacity: 0;
            transition: opacity 0.3s;
          }
          
          img[loading="lazy"].loaded {
            opacity: 1;
          }
          
          /* 减少重绘和回流 */
          * {
            box-sizing: border-box;
          }
          
          /* 优化滚动性能 */
          .scroll-container {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `
      }} />
      

      </Head>
      
      {/* Service Worker 注册 */}
      {enableServiceWorker && (
        <Script
          id="service-worker"
          strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }}
        />
      )}
      
      {/* 性能监控脚本 */}
      <Script
        id="performance-monitor"
        strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // 性能监控
          window.addEventListener('load', function() {
            // 监控关键性能指标
            if ('performance' in window) {
              const perfData = performance.getEntriesByType('navigation')[0];
              const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
              const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
              
              // 发送性能数据到分析服务
              if (window._hmt) {
                window._hmt.push(['_trackEvent', 'Performance', 'PageLoad', 'LoadTime', loadTime]);
                window._hmt.push(['_trackEvent', 'Performance', 'PageLoad', 'DOMContentLoaded', domContentLoaded]);
              }
            }
            
            // 监控 Core Web Vitals
            if ('PerformanceObserver' in window) {
              // LCP (Largest Contentful Paint)
              new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  if (window._hmt) {
                    window._hmt.push(['_trackEvent', 'CoreWebVitals', 'LCP', 'Value', Math.round(entry.startTime)]);
                  }
                }
              }).observe({entryTypes: ['largest-contentful-paint']});
              
              // FID (First Input Delay)
              new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  if (window._hmt) {
                    window._hmt.push(['_trackEvent', 'CoreWebVitals', 'FID', 'Value', Math.round(entry.processingStart - entry.startTime)]);
                  }
                }
              }).observe({entryTypes: ['first-input']});
            }
          });
          
          // 图片懒加载优化
          document.addEventListener('DOMContentLoaded', function() {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            
            if ('IntersectionObserver' in window) {
              const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    const img = entry.target;
                    img.onload = () => img.classList.add('loaded');
                    observer.unobserve(img);
                  }
                });
              });
              
              lazyImages.forEach(img => imageObserver.observe(img));
            } else {
              // 降级处理
              lazyImages.forEach(img => img.classList.add('loaded'));
            }
          });
        `
      }}
        />
    </>
  );
};

export default PerformanceOptimizer;