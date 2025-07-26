'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, Loader2, CheckCircle, XCircle, AlertCircle, 
  Key, Shield, ChevronRight 
} from 'lucide-react'
import type { ApiTest, TestResult } from '../types'

interface ApiEndpointCardProps {
  test: ApiTest
  isRunning: boolean
  isCompleted: boolean
  result: TestResult | null
  onRun: () => void
  onToggleComplete: () => void
  getApiFilePath: (endpoint: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}

export default function ApiEndpointCard({
  test,
  isRunning,
  isCompleted,
  result,
  onRun,
  onToggleComplete,
  getApiFilePath,
  getStatusIcon
}: ApiEndpointCardProps) {
  const [showResponse, setShowResponse] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
        isCompleted 
          ? 'bg-green-50 border-green-200' 
          : result?.status === 'error'
          ? 'bg-red-50 border-red-200'
          : result?.status === 'success'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isCompleted || false}
          onChange={onToggleComplete}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  test.method === 'GET' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  test.method === 'POST' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  test.method === 'PUT' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  test.method === 'PATCH' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {test.method}
                </span>
                <code className="text-sm font-mono text-gray-900 font-semibold flex-1">{test.endpoint}</code>
              </div>
              <p className="text-sm text-gray-800 font-medium mb-2">{test.description}</p>
              <div className="flex items-center gap-3 text-xs">
                {test.implemented ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    구현됨
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    미구현
                  </span>
                )}
                {test.requiresAuth && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md border border-yellow-300 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    인증 필요
                  </span>
                )}
                {test.requiresAdmin && (
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    관리자
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {result && (
                <div className="text-right mr-2">
                  {result.duration && (
                    <div className="text-xs text-gray-500">{result.duration}ms</div>
                  )}
                  {result.statusCode && (
                    <div className={`text-sm font-bold ${
                      result.statusCode < 400 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.statusCode}
                    </div>
                  )}
                </div>
              )}
              {isRunning ? (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRun}
                  className="bg-white border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                >
                  <Play className="w-3 h-3 mr-1" />
                  테스트
                </Button>
              )}
              {result && getStatusIcon(result.status)}
            </div>
          </div>
          
          {/* 파일 경로 */}
          <div className="mt-2 text-xs text-gray-700 font-mono bg-gray-100 border border-gray-300 px-3 py-2 rounded-md">
            {test.implemented ? '📁 ' : '❌ '}{getApiFilePath(test.endpoint)}
          </div>
          
          {/* 에러 메시지 표시 */}
          {result?.error && (
            <Alert className="mt-3 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {result.error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* 응답 데이터 표시 */}
          {result?.response && result.status === 'success' && (
            <details className="mt-3 group" open={showResponse} onToggle={(e) => setShowResponse(e.currentTarget.open)}>
              <summary className="cursor-pointer text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors flex items-center gap-1">
                <ChevronRight className={`w-4 h-4 transition-transform ${showResponse ? 'rotate-90' : ''}`} />
                응답 데이터 보기
              </summary>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md overflow-hidden">
                <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {typeof result.response === 'string' 
                    ? result.response 
                    : JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </details>
          )}
          
          {/* 요청 바디 표시 */}
          {test.body && (
            <details className="mt-2 group" open={showRequest} onToggle={(e) => setShowRequest(e.currentTarget.open)}>
              <summary className="cursor-pointer text-sm font-bold text-gray-700 hover:text-gray-800 transition-colors flex items-center gap-1">
                <ChevronRight className={`w-4 h-4 transition-transform ${showRequest ? 'rotate-90' : ''}`} />
                요청 데이터 보기
              </summary>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(test.body, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}