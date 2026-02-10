"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Settings error:", error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>error: failed to load settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            something went wrong. please try again.
          </p>
        </CardContent>
        <CardFooter>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={reset}>retry</Button>
            </TooltipTrigger>
            <TooltipContent>Try again</TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </div>
  )
}
