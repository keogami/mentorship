"use client"

import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Block = {
  id: string
  startDate: string
  endDate: string
  reason: string
  usersNotified: boolean
  createdAt: string
}

type BlocksTabProps = {
  blocks: Block[]
}

export function BlocksTab({ blocks }: BlocksTabProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [reason, setReason] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const rangeComplete = dateRange?.from && dateRange?.to

  // Build list of already-blocked date ranges for the calendar disabled matcher
  const blockedRanges = useMemo(() => {
    const ranges: { from: Date; to: Date }[] = []
    for (const block of blocks) {
      ranges.push({
        from: parseISO(block.startDate),
        to: parseISO(block.endDate),
      })
    }
    return ranges
  }, [blocks])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!dateRange?.from || !dateRange?.to) return

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    try {
      const response = await fetch("/admin/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create block")
      }

      const data = await response.json()
      setSuccess(
        `Block created. ${data.creditedSubscriptions} subscription(s) credited with ${data.daysPerSubscription} day(s).`
      )
      setDateRange(undefined)
      setReason("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(blockId: string) {
    setIsDeleting(blockId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/admin/api/blocks/${blockId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete block")
      }

      setSuccess("Block deleted and credits revoked.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Create block form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Block</CardTitle>
          <CardDescription>
            Block dates when you&apos;re unavailable. Active subscribers will be
            credited with bonus days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                startMonth={new Date()}
                disabled={[{ before: new Date() }, ...blockedRanges]}
                numberOfMonths={2}
              />
              {rangeComplete && (
                <p className="text-sm text-muted-foreground">
                  {format(dateRange.from!, "MMM d, yyyy")} &mdash;{" "}
                  {format(dateRange.to!, "MMM d, yyyy")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Vacation, Personal emergency"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isCreating || !rangeComplete || !reason.trim()}
            >
              {isCreating ? "Creating..." : "Create Block"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing blocks */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Blocks</h3>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocks created.</p>
        ) : (
          blocks.map((block) => (
            <Card key={block.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {block.startDate} to {block.endDate}
                    </CardTitle>
                    <CardDescription>{block.reason}</CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting === block.id}
                      >
                        {isDeleting === block.id ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete the block and revoke bonus day
                          credits that were issued for it. Sessions already
                          booked will not be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Block</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(block.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Block
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
