'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, ChevronDown, ChevronUp, Table, Key, Hash, Calendar, ToggleLeft, Type, List } from 'lucide-react'

interface TableColumn {
  name: string
  type: string
  nullable: boolean
  default?: string
  isPrimary?: boolean
  isForeign?: boolean
  description?: string
}

interface TableSchema {
  name: string
  description: string
  columns: TableColumn[]
}

// 데이터베이스 스키마 정보 (실제로는 API에서 가져올 수 있음)
const tableSchemas: TableSchema[] = [
  {
    name: 'profiles',
    description: '사용자 프로필 정보',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, description: 'auth.users 참조' },
      { name: 'username', type: 'text', nullable: false, description: '고유 사용자명' },
      { name: 'display_name', type: 'text', nullable: true, description: '표시 이름' },
      { name: 'avatar_url', type: 'text', nullable: true, description: '프로필 이미지 URL' },
      { name: 'bio', type: 'text', nullable: true, description: '자기소개' },
      { name: 'role', type: 'user_role', nullable: false, default: 'user', description: 'user | admin' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()', description: '생성일시' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()', description: '수정일시' },
    ]
  },
  {
    name: 'board_types',
    description: '게시판 타입 (지식공유, 자유게시판 등)',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, default: 'gen_random_uuid()', description: '고유 ID' },
      { name: 'name', type: 'text', nullable: false, description: '게시판 이름' },
      { name: 'slug', type: 'text', nullable: false, description: 'URL 슬러그' },
      { name: 'description', type: 'text', nullable: true, description: '게시판 설명' },
      { name: 'icon', type: 'text', nullable: true, description: '아이콘' },
      { name: 'requires_approval', type: 'boolean', nullable: false, default: 'false', description: '승인 필요 여부' },
      { name: 'is_active', type: 'boolean', nullable: false, default: 'true', description: '활성화 상태' },
      { name: 'order_index', type: 'integer', nullable: false, default: '0', description: '정렬 순서' },
    ]
  },
  {
    name: 'posts',
    description: '모든 게시글 (board_type_id로 구분)',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, default: 'gen_random_uuid()', description: '게시글 ID' },
      { name: 'board_type_id', type: 'uuid', nullable: false, isForeign: true, description: 'board_types 참조' },
      { name: 'category_id', type: 'uuid', nullable: false, isForeign: true, description: 'categories 참조' },
      { name: 'author_id', type: 'uuid', nullable: false, isForeign: true, description: 'auth.users 참조' },
      { name: 'title', type: 'text', nullable: false, description: '제목' },
      { name: 'content', type: 'text', nullable: false, description: '내용 (마크다운)' },
      { name: 'excerpt', type: 'text', nullable: true, description: '요약' },
      { name: 'status', type: 'post_status', nullable: false, default: 'draft', description: 'draft|pending|published|rejected' },
      { name: 'is_featured', type: 'boolean', nullable: false, default: 'false', description: '추천 게시글' },
      { name: 'is_pinned', type: 'boolean', nullable: false, default: 'false', description: '고정 게시글' },
      { name: 'like_count', type: 'integer', nullable: false, default: '0', description: '좋아요 수' },
      { name: 'comment_count', type: 'integer', nullable: false, default: '0', description: '댓글 수' },
      { name: 'view_count', type: 'integer', nullable: false, default: '0', description: '조회수' },
      { name: 'tags', type: 'text[]', nullable: false, default: '{}', description: '태그 배열' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()', description: '작성일시' },
      { name: 'published_at', type: 'timestamptz', nullable: true, description: '게시일시' },
    ]
  },
  {
    name: 'communities',
    description: '커뮤니티 정보',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, default: 'gen_random_uuid()', description: '커뮤니티 ID' },
      { name: 'name', type: 'text', nullable: false, description: '커뮤니티 이름' },
      { name: 'slug', type: 'text', nullable: false, description: 'URL 슬러그' },
      { name: 'description', type: 'text', nullable: true, description: '설명' },
      { name: 'visibility', type: 'community_visibility', nullable: false, default: 'public', description: 'public|private' },
      { name: 'max_members', type: 'integer', nullable: false, default: '10', description: '최대 인원' },
      { name: 'created_by', type: 'uuid', nullable: false, isForeign: true, description: '생성자 (auth.users)' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()', description: '생성일시' },
    ]
  }
]

const getTypeIcon = (type: string) => {
  if (type.includes('uuid')) return <Key className="w-4 h-4 text-purple-600" />
  if (type.includes('text')) return <Type className="w-4 h-4 text-blue-600" />
  if (type.includes('int')) return <Hash className="w-4 h-4 text-green-600" />
  if (type.includes('bool')) return <ToggleLeft className="w-4 h-4 text-orange-600" />
  if (type.includes('time')) return <Calendar className="w-4 h-4 text-pink-600" />
  if (type.includes('[]')) return <List className="w-4 h-4 text-indigo-600" />
  return <Database className="w-4 h-4 text-gray-600" />
}

export default function TableSchemaInfo() {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev)
      if (next.has(tableName)) {
        next.delete(tableName)
      } else {
        next.add(tableName)
      }
      return next
    })
  }

  return (
    <Card className="p-5 bg-white border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Table className="w-5 h-5 text-purple-600" />
          </div>
          Database Schema Information
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Supabase 테이블 구조와 컬럼 정보를 확인하세요
        </p>
        <div className="mt-2 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">
            💡 Tip: 각 테이블을 클릭하여 상세 컬럼 정보를 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tableSchemas.map((table) => (
          <div key={table.name} className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleTable(table.name)}
              className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-300">
                  {table.name}
                </span>
                <span className="text-base text-gray-900 font-semibold">{table.description}</span>
                <span className="text-sm text-gray-600">({table.columns.length} columns)</span>
              </div>
              {expandedTables.has(table.name) ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedTables.has(table.name) && (
              <div className="p-4 bg-white border-t-2 border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-2 font-semibold text-gray-700">Column</th>
                        <th className="text-left p-2 font-semibold text-gray-700">Type</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Nullable</th>
                        <th className="text-left p-2 font-semibold text-gray-700">Default</th>
                        <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column, idx) => (
                        <tr key={column.name} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-2 font-mono text-sm">
                            <div className="flex items-center gap-2">
                              {column.isPrimary && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">PK</span>
                              )}
                              {column.isForeign && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">FK</span>
                              )}
                              <span className="font-bold text-gray-800">{column.name}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(column.type)}
                              <span className="font-mono text-sm text-gray-700">{column.type}</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {column.nullable ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                          <td className="p-2">
                            {column.default && (
                              <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                                {column.default}
                              </code>
                            )}
                          </td>
                          <td className="p-2 text-gray-600 text-sm">{column.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}