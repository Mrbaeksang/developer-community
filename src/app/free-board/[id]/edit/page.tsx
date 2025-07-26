import React from 'react'
import { notFound } from 'next/navigation'
import FreePostEditForm from './FreePostEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FreePostEditPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FreePostEditForm postId={id} />
    </div>
  )
}