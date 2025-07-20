'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Users, 
  Lock, 
  Globe,
  Plus,
  X,
  Info
} from 'lucide-react'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_public: false,
    max_members: 5,
    enable_chat: true,
    enable_memos: true,
    enable_files: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: 실제 커뮤니티 생성 로직
    console.log('커뮤니티 생성:', { ...formData, tags })
    
    // 임시로 커뮤니티 목록으로 리다이렉트
    setTimeout(() => {
      router.push('/communities')
    }, 1000)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      slug: generateSlug(name)
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="container max-w-2xl py-8">
      {/* 뒤로가기 버튼 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/communities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            커뮤니티 목록으로
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>새 커뮤니티 만들기</CardTitle>
            <CardDescription>
              소규모 그룹을 위한 프라이빗 커뮤니티를 만들어보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">커뮤니티 이름 *</Label>
                <Input
                  id="name"
                  placeholder="예: React 스터디 그룹"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.name.length}/50
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL 주소</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/communities/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="react-study"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="커뮤니티의 목적과 활동 내용을 설명해주세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.description.length}/200
                </p>
              </div>
            </div>

            {/* 공개 설정 */}
            <div className="space-y-4">
              <Label>공개 설정</Label>
              <RadioGroup
                value={formData.is_public.toString()}
                onValueChange={(value) => setFormData({ ...formData, is_public: value === 'true' })}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="false" id="private" />
                  <div className="space-y-1">
                    <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                      <Lock className="h-4 w-4" />
                      비공개 커뮤니티
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      초대받은 사람만 가입할 수 있습니다
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="true" id="public" />
                  <div className="space-y-1">
                    <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                      <Globe className="h-4 w-4" />
                      공개 커뮤니티
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      누구나 가입 신청할 수 있습니다 (승인 필요)
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* 인원 제한 */}
            <div className="space-y-2">
              <Label>최대 인원</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.max_members]}
                  onValueChange={([value]) => setFormData({ ...formData, max_members: value })}
                  min={2}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold">{formData.max_members}</span>
                  <span className="text-sm text-muted-foreground">명</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                본인을 포함한 최대 인원수입니다 (2-10명)
              </p>
            </div>

            {/* 기능 설정 */}
            <div className="space-y-4">
              <Label>커뮤니티 기능</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="chat" className="text-base cursor-pointer">
                      실시간 채팅
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      멤버들과 실시간으로 대화할 수 있습니다
                    </p>
                  </div>
                  <Switch
                    id="chat"
                    checked={formData.enable_chat}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_chat: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="memos" className="text-base cursor-pointer">
                      메모 공유
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      중요한 정보와 자료를 공유할 수 있습니다
                    </p>
                  </div>
                  <Switch
                    id="memos"
                    checked={formData.enable_memos}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_memos: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="files" className="text-base cursor-pointer">
                      파일 공유
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      문서와 파일을 업로드하고 공유할 수 있습니다
                    </p>
                  </div>
                  <Switch
                    id="files"
                    checked={formData.enable_files}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_files: checked })}
                  />
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label>태그 (선택사항)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="태그 입력"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  maxLength={20}
                />
                <Button type="button" size="icon" onClick={addTag} disabled={tags.length >= 5}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                최대 5개까지 추가할 수 있습니다
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name || !formData.slug}
              className="flex-1"
            >
              {isSubmitting ? '생성 중...' : '커뮤니티 만들기'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}