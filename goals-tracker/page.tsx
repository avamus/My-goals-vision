"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Import client component with ssr disabled
const GoalsTrackerContent = dynamic(() => import("@/components/custom/goals-tracker-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-500">Please wait while we set up your goals tracker.</p>
      </div>
    </div>
  )
});

// Main page component
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-500">Please wait while we set up your goals tracker.</p>
        </div>
      </div>
    }>
      <GoalsTrackerContent />
    </Suspense>
  )
}
