import React from 'react'
import { NextPageContext } from 'next'
import Head from 'next/head'

interface ErrorProps {
  statusCode: number
  hasGetInitialProps?: boolean
  err?: Error
}

interface ErrorPageContext extends NextPageContext {
  err?: Error
}

function Error({ statusCode, hasGetInitialProps, err }: ErrorProps) {
  return (
    <>
      <Head>
        <title>
          {statusCode
            ? `${statusCode} - 服务器错误`
            : '客户端错误'}
        </title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-4">
              {statusCode || '错误'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {statusCode === 404
                ? '抱歉，找不到您访问的页面'
                : statusCode === 500
                ? '服务器内部错误'
                : statusCode
                ? '服务器发生错误'
                : '客户端发生错误'}
            </p>
            
            {/* 开发环境显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && err && (
              <div className="mt-8 text-left bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
                <h3 className="text-red-400 font-bold mb-2">开发环境错误详情：</h3>
                <pre className="text-gray-300 text-sm overflow-auto">
                  {err.stack || err.message}
                </pre>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mr-4"
            >
              刷新页面
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mr-4"
            >
              返回上页
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

Error.getInitialProps = ({ res, err }: ErrorPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode || 500 : 404
  return { statusCode }
}

export default Error 