"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Coupon = {
  id: string;
  code: string;
  sessionsGranted: number;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  active: boolean;
  createdAt: string;
};

type CouponsTabProps = {
  coupons: Coupon[];
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function CouponsTab({ coupons }: CouponsTabProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sessionsGranted, setSessionsGranted] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/admin/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          sessionsGranted: parseInt(sessionsGranted, 10),
          maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create coupon");
      }

      setSuccess(`Coupon "${code.toUpperCase()}" created.`);
      setCode("");
      setSessionsGranted("");
      setMaxUses("");
      setExpiresAt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
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

      {/* Create coupon form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Coupon</CardTitle>
          <CardDescription>
            Generate a coupon code that grants free sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., WELCOME5"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionsGranted">Sessions Granted</Label>
                <Input
                  id="sessionsGranted"
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={sessionsGranted}
                  onChange={(e) => setSessionsGranted(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing coupons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Coupons</h3>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons created.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const isExpired =
                    coupon.expiresAt &&
                    new Date(coupon.expiresAt) < new Date();
                  const isMaxedOut =
                    coupon.maxUses !== null && coupon.uses >= coupon.maxUses;

                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">
                        {coupon.code}
                      </TableCell>
                      <TableCell>{coupon.sessionsGranted}</TableCell>
                      <TableCell>
                        {coupon.uses}
                        {coupon.maxUses !== null && ` / ${coupon.maxUses}`}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="outline">Expired</Badge>
                        ) : isMaxedOut ? (
                          <Badge variant="outline">Maxed Out</Badge>
                        ) : coupon.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.expiresAt
                          ? formatDate(coupon.expiresAt)
                          : "Never"}
                      </TableCell>
                      <TableCell>{formatDate(coupon.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
