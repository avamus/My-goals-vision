"use client"

import { useEffect, useState } from "react"
import GoalsTracker from "@/components/ui/goals-tracker-new"
import { useSearchParams } from "next/navigation"

export default function GoalsTrackerContent() {
  const searchParams = useSearchParams()
  const [memberId, setMemberId] = useState<string>("")
  const [teamId, setTeamId] = useState<string | undefined>(undefined)
  
  // Get memberId and teamId from URL parameters
  useEffect(() => {
    const memberIdParam = searchParams.get("memberId")
    const teamIdParam = searchParams.get("teamId")
    
    if (memberIdParam) {
      setMemberId(memberIdParam)
    } else {
      // Fallback to a default value
      setMemberId("guest")
    }
    
    if (teamIdParam) {
      setTeamId(teamIdParam)
    }
  }, [searchParams])
  
  if (!memberId) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-500">Please wait while we set up your goals tracker.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="w-full bg-white py-8">
        <GoalsTracker memberId={memberId} teamId={teamId} />
      </div>
    </div>
  )
}
