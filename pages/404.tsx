import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - 页面未找到</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29.82-5.657 2.172M12 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H5z"></path>
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              抱歉，找不到您访问的页面
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/">
              <button className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mr-4">
                回到首页
              </button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              返回上页
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 