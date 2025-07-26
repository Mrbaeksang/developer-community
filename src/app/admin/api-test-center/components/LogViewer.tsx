'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Terminal } from 'lucide-react'

interface LogEntry {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

interface LogViewerProps {
  logs: LogEntry[]
  onClear: () => void
}

export default function LogViewer({ logs, onClear }: LogViewerProps) {
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          테스트 로그
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="text-gray-300 hover:text-white hover:bg-gray-700 font-semibold border border-gray-600 hover:border-gray-500 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
      <div className="bg-black rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm border-2 border-gray-700">
        {logs.length === 0 ? (
          <p className="text-gray-400 font-medium">테스트를 실행하면 로그가 여기에 표시됩니다...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-400 font-semibold">[{log.timestamp}]</span>{' '}
              <span className={`${getLogColor(log.type)} font-medium`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}