'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Key, Terminal } from 'lucide-react'

interface TokenDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: string, token: string) => void
}

export default function TokenDialog({ isOpen, onClose, onSave }: TokenDialogProps) {
  const [tokenType, setTokenType] = useState('user')
  const [tokenValue, setTokenValue] = useState('')

  const handleSave = () => {
    if (tokenValue.trim()) {
      onSave(tokenType, tokenValue.trim())
      setTokenValue('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Key className="w-5 h-5 text-blue-600" />
            API 테스트 토큰 설정
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              인증이 필요한 API를 테스트하려면 토큰이 필요합니다.
              <br />
              일반 사용자 토큰 또는 관리자 토큰을 설정할 수 있습니다.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenType" className="text-sm font-bold text-gray-800">토큰 타입</Label>
              <Select value={tokenType} onValueChange={setTokenType}>
                <SelectTrigger className="h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium">
                  <SelectValue className="text-gray-900 font-medium" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  <SelectItem value="user" className="text-gray-900 font-medium hover:bg-blue-50 focus:bg-blue-100 py-3">일반 사용자 토큰</SelectItem>
                  <SelectItem value="admin" className="text-red-700 font-medium hover:bg-red-50 focus:bg-red-100 py-3">관리자 토큰</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-bold text-gray-800">토큰 값</Label>
              <Input
                id="token"
                type="text"
                placeholder="Bearer eyJhbGciOiJIUzI1NiIs..."
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                className="font-mono text-sm h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-600 font-medium">
                Bearer 프리픽스를 포함한 전체 토큰을 입력하세요.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Terminal className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-700">토큰 생성 방법:</p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
                  <code>npm run generate:token</code>
                </pre>
                <p className="text-gray-600">
                  위 명령어를 실행하여 이메일과 비밀번호로 토큰을 생성할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400">
            취소
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!tokenValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}