'use client'

import { Card } from '@/components/ui/card'
import { Database, ChevronDown, ChevronRight } from 'lucide-react'
import type { ApiTest, ApiCategory } from '../types'

interface CategorySidebarProps {
  apiCategories: ApiCategory[]
  selectedCategory: string | null
  selectedFilter: string
  searchTerm: string
  expandedSidebarCategories: Set<string>
  onCategorySelect: (category: string | null) => void
  onToggleSidebarCategory: (category: string) => void
}

export default function CategorySidebar({
  apiCategories,
  selectedCategory,
  selectedFilter,
  searchTerm,
  expandedSidebarCategories,
  onCategorySelect,
  onToggleSidebarCategory
}: CategorySidebarProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          API 카테고리
        </h3>
        <div className="space-y-2">
          {apiCategories.map((category) => {
            const categoryTests = category.tests.filter(test => {
              if (selectedFilter === 'implemented' && !test.implemented) return false
              if (selectedFilter === 'unimplemented' && test.implemented) return false
              
              if (searchTerm) {
                const search = searchTerm.toLowerCase()
                return (
                  test.endpoint.toLowerCase().includes(search) ||
                  test.description.toLowerCase().includes(search) ||
                  test.method.toLowerCase().includes(search)
                )
              }
              
              return true
            })

            if (categoryTests.length === 0) return null

            const isSelected = selectedCategory === category.name
            const isExpanded = expandedSidebarCategories.has(category.name)

            return (
              <div key={category.name} className="space-y-1">
                <div
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-md' 
                      : 'hover:bg-gray-50 text-gray-800 border-transparent hover:border-gray-200 hover:shadow-sm'
                  }`}
                  onClick={() => onCategorySelect(isSelected ? null : category.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-200' : 'bg-gray-200'
                    }`}>
                      {category.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{category.name}</div>
                      <div className={`text-xs font-medium ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`}>{category.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      isSelected 
                        ? 'bg-blue-200 text-blue-800 border-blue-300' 
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {categoryTests.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className={`h-4 w-4 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    ) : (
                      <ChevronRight className={`h-4 w-4 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}