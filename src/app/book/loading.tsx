import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <div className="space-y-1">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Skeleton key={j} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <Skeleton className="m-6 h-6 w-28" />
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-72" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
