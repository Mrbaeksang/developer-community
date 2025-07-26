'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Database, RefreshCw, Eye, EyeOff, ChevronRight, 
  AlertCircle, FileJson, Table as TableIcon, Code,
  Search, Filter, Download, Sparkles, HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import DataPreviewModal from './DataPreviewModal'

interface TableDataViewerProps {
  selectedTable?: string
  onTableSelect?: (table: string) => void
}

const TABLE_OPTIONS = [
  { value: 'profiles', label: '사용자 프로필', icon: '👤' },
  { value: 'board_types', label: '게시판 타입', icon: '📋' },
  { value: 'categories', label: '카테고리', icon: '🏷️' },
  { value: 'posts', label: '게시글', icon: '📝' },
  { value: 'communities', label: '커뮤니티', icon: '👥' },
  { value: 'tags', label: '태그', icon: '🔖' },
  { value: 'post_comments', label: '댓글', icon: '💬' },
  { value: 'community_members', label: '커뮤니티 멤버', icon: '👫' },
  { value: 'post_likes', label: '좋아요', icon: '❤️' }
]

export default function TableDataViewer({ selectedTable, onTableSelect }: TableDataViewerProps) {
  const [table, setTable] = useState(selectedTable || 'posts')
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'json' | 'sql'>('table')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [limit, setLimit] = useState('10')
  const [totalCount, setTotalCount] = useState(0)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const fetchTableData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/table-data/${table}?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch table data')
      }
      
      const result = await response.json()
      setData(result.data || [])
      setTotalCount(result.total || 0)
      
      // Extract column names
      if (result.data && result.data.length > 0) {
        setColumns(Object.keys(result.data[0]))
      } else {
        setColumns([])
      }
      
      toast.success(`${TABLE_OPTIONS.find(t => t.value === table)?.label} 데이터를 불러왔습니다`)
    } catch (error) {
      console.error('Error fetching table data:', error)
      toast.error('데이터를 불러오는데 실패했습니다')
      setData([])
      setColumns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (table) {
      fetchTableData()
    }
  }, [table, limit])

  const handleTableChange = (value: string) => {
    setTable(value)
    if (onTableSelect) {
      onTableSelect(value)
    }
  }

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const formatCellValue = (value: any, column: string) => {
    if (value === null) return <span className="text-gray-500 italic font-medium">null</span>
    if (value === undefined) return <span className="text-gray-500 italic font-medium">undefined</span>
    
    // Handle dates
    if (column.includes('_at') || column.includes('created') || column.includes('updated')) {
      try {
        const date = new Date(value)
        return <span className="text-gray-800 font-medium">{date.toLocaleString('ko-KR')}</span>
      } catch {
        return <span className="text-gray-800 font-medium">{String(value)}</span>
      }
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <Badge 
          variant={value ? 'default' : 'secondary'}
          className={value ? 'bg-green-600 text-white font-bold' : 'bg-gray-300 text-gray-900 font-bold'}
        >
          {value ? '✓ True' : '✗ False'}
        </Badge>
      )
    }
    
    // Handle JSON objects
    if (typeof value === 'object') {
      return (
        <code className="text-xs bg-gray-200 text-gray-900 px-2 py-1 rounded font-mono font-medium border">
          {JSON.stringify(value, null, 2).substring(0, 50)}...
        </code>
      )
    }
    
    // Handle long strings
    const strValue = String(value)
    if (strValue.length > 50) {
      return (
        <span className="truncate max-w-xs text-gray-800 font-medium" title={strValue}>
          {strValue.substring(0, 50)}...
        </span>
      )
    }
    
    return <span className="text-gray-800 font-medium">{strValue}</span>
  }

  const generateSQL = () => {
    return `SELECT * FROM ${table} LIMIT ${limit};`
  }

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${table}_data_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('데이터를 다운로드했습니다')
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            테이블 데이터 뷰어
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreviewModal(true)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold transition-all duration-200"
              title="데이터 미리보기를 확인합니다"
            >
              <Sparkles className="w-4 h-4" />
              <span className="ml-1">미리보기</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchTableData}
              disabled={loading}
              className="hover:bg-blue-50 hover:text-blue-700 font-bold text-gray-900 transition-all duration-200"
              title="데이터를 새로 불러옵니다"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-1">새로고침</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportData}
              disabled={data.length === 0}
              className="hover:bg-green-50 hover:text-green-700 font-bold text-gray-900 transition-all duration-200 disabled:opacity-50"
              title="데이터를 JSON 파일로 다운로드합니다"
            >
              <Download className="w-4 h-4" />
              <span className="ml-1">다운로드</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              테이블 선택
            </label>
            <Select value={table} onValueChange={handleTableChange}>
              <SelectTrigger className="border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                {TABLE_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-gray-800 font-medium hover:bg-blue-50 hover:text-blue-900 cursor-pointer focus:bg-blue-100 focus:text-blue-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{option.icon}</span>
                      <span className="font-semibold text-gray-800">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              표시 개수
            </label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[120px] border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                <SelectItem value="10" className="text-gray-800 font-semibold hover:bg-blue-50 hover:text-blue-900 cursor-pointer focus:bg-blue-100 focus:text-blue-900">10개</SelectItem>
                <SelectItem value="25" className="text-gray-800 font-semibold hover:bg-blue-50 hover:text-blue-900 cursor-pointer focus:bg-blue-100 focus:text-blue-900">25개</SelectItem>
                <SelectItem value="50" className="text-gray-800 font-semibold hover:bg-blue-50 hover:text-blue-900 cursor-pointer focus:bg-blue-100 focus:text-blue-900">50개</SelectItem>
                <SelectItem value="100" className="text-gray-800 font-semibold hover:bg-blue-50 hover:text-blue-900 cursor-pointer focus:bg-blue-100 focus:text-blue-900">100개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              보기 모드
            </label>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 border border-gray-300">
              <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-medium'
              }`}
              title="테이블 형태로 보기"
            >
              <TableIcon className="w-4 h-4" />
              <span className="text-sm">테이블</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'json' ? 'default' : 'ghost'}
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-2 transition-all duration-200 ${
                viewMode === 'json' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-medium'
              }`}
              title="JSON 형태로 보기"
            >
              <FileJson className="w-4 h-4" />
              <span className="text-sm">JSON</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'sql' ? 'default' : 'ghost'}
              onClick={() => setViewMode('sql')}
              className={`flex items-center gap-2 transition-all duration-200 ${
                viewMode === 'sql' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-medium'
              }`}
              title="SQL 쿼리 보기"
            >
              <Code className="w-4 h-4" />
              <span className="text-sm">SQL</span>
            </Button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-800 font-semibold">
            전체 {totalCount.toLocaleString()}개 중 {data.length}개 표시
          </span>
          {loading && <span className="text-blue-700 font-semibold">데이터 로딩 중...</span>}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[600px]">
        {viewMode === 'table' && (
          <div className="border rounded-lg">
            {data.length === 0 ? (
              <div className="p-8 text-center">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-900 font-bold">데이터가 없습니다</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="w-[50px] font-bold text-gray-900">#</TableHead>
                    {columns.map((col) => (
                      <TableHead key={col} className="font-bold text-gray-900">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead className="w-[50px] font-bold text-gray-900">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <React.Fragment key={index}>
                      <TableRow className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="font-bold text-gray-900">
                          {index + 1}
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col}>
                            {formatCellValue(row[col], col)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleRowExpansion(index)}
                            className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                            title={expandedRows.has(index) ? "상세 정보 숨기기" : "상세 정보 보기"}
                          >
                            {expandedRows.has(index) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(index) && (
                        <TableRow key={`expanded-${index}`}>
                          <TableCell colSpan={columns.length + 2} className="bg-gray-100 p-4 border-b border-gray-300">
                            <pre className="text-xs overflow-x-auto text-gray-900 font-medium bg-white p-3 rounded border">
                              {JSON.stringify(row, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {viewMode === 'json' && (
          <pre className="p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto text-gray-900 font-medium border-2 border-gray-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        {viewMode === 'sql' && (
          <div className="space-y-4">
            <Alert className="border-2 border-blue-300 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-gray-800 font-medium">
                아래 SQL 쿼리를 사용하여 현재 표시된 데이터를 조회할 수 있습니다
              </AlertDescription>
            </Alert>
            <pre className="p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto border-2 border-gray-600">
              <code className="font-bold">{generateSQL()}</code>
            </pre>
          </div>
        )}
      </ScrollArea>

      {/* 데이터 미리보기 모달 */}
      <DataPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={() => {
          setShowPreviewModal(false)
          // 필요시 추가 액션
        }}
        presetData={{
          id: 'current',
          name: '현재 테이블',
          description: `${TABLE_OPTIONS.find(t => t.value === table)?.label} 데이터 미리보기`,
          icon: TABLE_OPTIONS.find(t => t.value === table)?.icon || '📊',
          counts: { [table]: totalCount }
        }}
        tableInfo={TABLE_OPTIONS.map(opt => ({
          name: opt.value,
          label: opt.label,
          icon: opt.icon,
          description: `${opt.label} 테이블 데이터`
        }))}
      />
    </Card>
  )
}