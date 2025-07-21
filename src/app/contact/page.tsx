'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Send, MessageCircle, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message || '문의가 성공적으로 전송되었습니다!')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        alert(result.error || '문의 전송에 실패했습니다.')
      }
    } catch (error) {
      // 문의 전송 오류 처리
      alert('문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">문의하기</h1>
        <p className="text-muted-foreground">
          궁금한 점이나 제안사항이 있으시면 언제든지 연락해주세요
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* 연락처 정보 */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">이메일</p>
                <p className="text-sm text-muted-foreground">contact@devcommunity.kr</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">실시간 문의</p>
                <p className="text-sm text-muted-foreground">평일 09:00 - 18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">위치</p>
                <p className="text-sm text-muted-foreground">서울특별시 강남구</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 문의 폼 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>문의 보내기</CardTitle>
              <CardDescription>
                아래 양식을 작성하여 문의사항을 보내주세요. 빠른 시일 내에 답변드리겠습니다.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      placeholder="홍길동"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">제목 *</Label>
                  <Input
                    id="subject"
                    placeholder="문의 제목을 입력하세요"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">내용 *</Label>
                  <Textarea
                    id="message"
                    placeholder="문의 내용을 자세히 작성해주세요"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    문의 주신 내용은 등록하신 이메일로 답변드립니다.
                    개인정보는 문의 답변 외의 목적으로 사용되지 않습니다.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '전송 중...' : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      문의 보내기
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}