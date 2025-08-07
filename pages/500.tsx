import React from 'react'
import Head from 'next/head'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - 服务器内部错误</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-4">
              500
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              服务器内部错误，请稍后重试
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mr-4"
            >
              刷新页面
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              回到首页
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 