'use client';

import Link from 'next/link'

export default function Home() {
  return (
    <Link href="/login" className="bg-blue-600 mt-100 text-white px-6 py-2 rounded-full hover:bg-blue-700">LOGIN</Link>
  )
}
