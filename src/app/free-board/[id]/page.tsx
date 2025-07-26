import React from 'react'
import { notFound } from 'next/navigation'
import FreePostDetail from './FreePostDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FreePostDetailPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <FreePostDetail postId={id} />
      </div>
    </div>
  )
}