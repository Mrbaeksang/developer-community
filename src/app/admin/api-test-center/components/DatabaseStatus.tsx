'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableStatus {
  name: string
  label: string
  page: string
  count: number
  hasTestData: boolean
}

export default function DatabaseStatus() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchDatabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/database-status')
      const data = await response.json()
      setTables(data.tables || [])
      
      // 마지막 업데이트 시간 설정
      const now = new Date()
      const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      setLastUpdated(kstTime.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }))
    } catch (error) {
      console.error('Failed to fetch database status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseStatus()
    // 10초마다 자동 새로고침
    const interval = setInterval(fetchDatabaseStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-5 bg-white border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            Supabase Database Status
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchDatabaseStatus}
            disabled={loading}
            className="hover:bg-blue-50 text-blue-600 font-semibold border border-blue-200 hover:border-blue-300 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-700 font-semibold">
          <span>실시간 테이블 레코드 수 모니터링</span>
          {lastUpdated && (
            <span className="text-blue-700">마지막 업데이트: {lastUpdated} (KST)</span>
          )}
        </div>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            💡 Tip: 각 테이블의 실시간 데이터를 확인하고, 테스트 데이터 생성 기능을 사용해보세요.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            10초마다 자동 새로고침 | PostgreSQL 기반 Supabase 프로젝트
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {tables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">데이터베이스 상태를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 총 테이블 수 표시 */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-800">총 테이블 수</span>
                <span className="text-lg font-bold text-blue-900">{tables.length}개</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-blue-800">총 레코드 수</span>
                <span className="text-lg font-bold text-blue-900">
                  {tables.reduce((sum, table) => sum + table.count, 0).toLocaleString()}개
                </span>
              </div>
            </div>

            {/* 테이블 목록 */}
            {tables.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-300 truncate">
                      {table.name}
                    </span>
                    <span className="text-sm text-gray-900 font-semibold truncate">{table.label}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium truncate block">{table.page}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">{table.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-600 ml-1">개</span>
                  </div>
                  {table.hasTestData && (
                    <span className="px-2 py-1 text-xs bg-amber-500 text-white font-semibold rounded-full shadow-sm">
                      테스트
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  )
}