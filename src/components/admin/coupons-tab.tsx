"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";

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

type RedemptionRecord = {
  id: string;
  redeemedAt: string;
  userId: string;
  userName: string;
  userEmail: string;
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

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function CouponsTab({ coupons }: CouponsTabProps) {
  const router = useRouter();

  // Create form state
  const [code, setCode] = useState("");
  const [sessionsGranted, setSessionsGranted] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editSessionsGranted, setEditSessionsGranted] = useState("");
  const [editMaxUses, setEditMaxUses] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editActive, setEditActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Toggle/delete state
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // History state
  const [viewingHistoryCouponId, setViewingHistoryCouponId] = useState<string | null>(null);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Messages
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

      setSuccess(`Coupon "${code.toUpperCase()}" created (inactive by default).`);
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

  function openEditDialog(coupon: Coupon) {
    setEditingCoupon(coupon);
    setEditCode(coupon.code);
    setEditSessionsGranted(coupon.sessionsGranted.toString());
    setEditMaxUses(coupon.maxUses?.toString() ?? "");
    setEditExpiresAt(coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "");
    setEditActive(coupon.active);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoupon) return;

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch(`/admin/api/coupons/${editingCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editCode,
          sessionsGranted: parseInt(editSessionsGranted, 10),
          maxUses: editMaxUses ? parseInt(editMaxUses, 10) : null,
          expiresAt: editExpiresAt || null,
          active: editActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update coupon");
      }

      setSuccess(`Coupon "${editCode.toUpperCase()}" updated.`);
      setEditingCoupon(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    setIsToggling(coupon.id);
    setError(null);

    try {
      const response = await fetch(`/admin/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update coupon");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsToggling(null);
    }
  }

  async function handleDelete(couponId: string) {
    setIsDeleting(couponId);
    setError(null);

    try {
      const response = await fetch(`/admin/api/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete coupon");
      }

      setSuccess("Coupon deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleViewHistory(couponId: string) {
    setViewingHistoryCouponId(couponId);
    setIsLoadingHistory(true);
    setRedemptionHistory([]);

    try {
      const response = await fetch(`/admin/api/coupons/${couponId}`);
      if (response.ok) {
        const data = await response.json();
        setRedemptionHistory(data.redemptions);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const viewingCoupon = coupons.find((c) => c.id === viewingHistoryCouponId);

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
            Generate a coupon code that grants free sessions. New coupons are inactive by default.
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
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(coupon)}
                            disabled={isToggling === coupon.id}
                          >
                            {isToggling === coupon.id
                              ? "..."
                              : coupon.active
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(coupon)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(coupon.id)}
                          >
                            History
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete coupon &quot;{coupon.code}&quot;?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(coupon.id)}
                                  disabled={isDeleting === coupon.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting === coupon.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCode">Coupon Code</Label>
              <Input
                id="editCode"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSessionsGranted">Sessions Granted</Label>
              <Input
                id="editSessionsGranted"
                type="number"
                min="1"
                value={editSessionsGranted}
                onChange={(e) => setEditSessionsGranted(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMaxUses">Max Uses (leave empty for unlimited)</Label>
              <Input
                id="editMaxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={editMaxUses}
                onChange={(e) => setEditMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExpiresAt">Expires At (optional)</Label>
              <Input
                id="editExpiresAt"
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editActive"
                checked={editActive}
                onCheckedChange={(checked) => setEditActive(checked === true)}
              />
              <Label htmlFor="editActive">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCoupon(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Redemption History Dialog */}
      <Dialog
        open={!!viewingHistoryCouponId}
        onOpenChange={(open) => !open && setViewingHistoryCouponId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redemption History</DialogTitle>
            <DialogDescription>
              {viewingCoupon && (
                <>Users who have redeemed coupon &quot;{viewingCoupon.code}&quot;</>
              )}
            </DialogDescription>
          </DialogHeader>
          {isLoadingHistory ? (
            <p className="text-muted-foreground py-4">Loading...</p>
          ) : redemptionHistory.length === 0 ? (
            <p className="text-muted-foreground py-4">No redemptions yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Redeemed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionHistory.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.userName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.userEmail}
                      </TableCell>
                      <TableCell>{formatDateTime(r.redeemedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
