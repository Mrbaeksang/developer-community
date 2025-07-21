'use client'

import { useState } from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CodeBlockProps {
  code: string
  language: string
  fileName?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  copyable?: boolean
  collapsible?: boolean
  maxHeight?: number
  className?: string
}

export function CodeBlock({
  code,
  language,
  fileName,
  showLineNumbers = true,
  highlightLines = [],
  copyable = true,
  collapsible = false,
  maxHeight = 400,
  className
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  
  const handleCopy = async () => {
    if (!copyable) return
    
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const lines = code.split('\n')
  const shouldShowCollapse = collapsible && lines.length > 20

  return (
    <div className={cn("relative group rounded-lg border bg-muted/30", className)}>
      {/* Header */}
      {(fileName || copyable || shouldShowCollapse) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            {fileName && (
              <span className="text-sm font-mono text-muted-foreground">
                {fileName}
              </span>
            )}
            <Badge variant="secondary" className="text-xs font-mono">
              {language}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {shouldShowCollapse && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
            )}
            {copyable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Code Content */}
      {!collapsed && (
        <div 
          className="overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <pre className="p-4 text-sm font-mono leading-relaxed">
            <code className={cn(`language-${language}`)}>
              {showLineNumbers ? (
                <div className="table w-full">
                  {lines.map((line, index) => {
                    const lineNumber = index + 1
                    const isHighlighted = highlightLines.includes(lineNumber)
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "table-row",
                          isHighlighted && "bg-yellow-500/10"
                        )}
                      >
                        <span className="table-cell w-10 pr-4 text-right text-muted-foreground/60 select-none border-r border-muted user-select-none">
                          {lineNumber}
                        </span>
                        <span className="table-cell pl-4">
                          {line || '\u00A0'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                code
              )}
            </code>
          </pre>
        </div>
      )}
      
      {/* Collapsed View */}
      {collapsed && (
        <div className="p-4 text-center text-muted-foreground">
          <span className="text-sm">코드가 접혀있습니다 ({lines.length} 줄)</span>
        </div>
      )}
    </div>
  )
}

// 언어별 색상 매핑
export const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    javascript: 'hsl(51 100% 50%)',
    typescript: 'hsl(204 70% 53%)',
    python: 'hsl(204 70% 53%)',
    java: 'hsl(25 95% 53%)',
    cpp: 'hsl(204 100% 40%)',
    rust: 'hsl(17 100% 41%)',
    go: 'hsl(193 95% 68%)',
    html: 'hsl(12 76% 61%)',
    css: 'hsl(225 73% 57%)',
    sql: 'hsl(210 11% 15%)',
    json: 'hsl(114 31% 68%)',
    yaml: 'hsl(114 31% 68%)',
    bash: 'hsl(114 31% 68%)',
    docker: 'hsl(201 100% 50%)',
    markdown: 'hsl(210 11% 15%)'
  }
  
  return colors[language.toLowerCase()] || 'hsl(210 11% 15%)'
}