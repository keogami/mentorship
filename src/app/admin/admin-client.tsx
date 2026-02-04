"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardTab } from "@/components/admin/dashboard-tab";
import { BlocksTab } from "@/components/admin/blocks-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { CouponsTab } from "@/components/admin/coupons-tab";
import { ConfigTab } from "@/components/admin/config-tab";

type TodaySession = {
  id: string;
  scheduledAt: string;
  status: string;
  meetLink: string | null;
  durationMinutes: number;
  user: { name: string; email: string };
};

type Stats = {
  activeSubscribers: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  totalSessionsAllTime: number;
};

type ActiveBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
};

type Block = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  usersNotified: boolean;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    planName: string;
    planSlug: string;
    priceInr: number;
    period: string;
    sessionsUsed: number;
    sessionsTotal: number;
    currentPeriodEnd: string;
    cancelledAt: string | null;
  };
};

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

type Config = {
  maxSessionsPerDay: number;
  bookingWindowDays: number;
  cancellationNoticeHours: number;
  updatedAt: string | null;
};

type AdminClientProps = {
  todaySessions: TodaySession[];
  stats: Stats;
  activeBlocks: ActiveBlock[];
  blocks: Block[];
  users: AdminUser[];
  coupons: Coupon[];
  config: Config;
};

export function AdminClient({
  todaySessions,
  stats,
  activeBlocks,
  blocks,
  users,
  coupons,
  config,
}: AdminClientProps) {
  return (
    <Tabs defaultValue="dashboard">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="blocks">Calendar Blocks</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="coupons">Coupons</TabsTrigger>
        <TabsTrigger value="config">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="mt-6">
        <DashboardTab
          todaySessions={todaySessions}
          stats={stats}
          activeBlocks={activeBlocks}
        />
      </TabsContent>

      <TabsContent value="blocks" className="mt-6">
        <BlocksTab blocks={blocks} />
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <UsersTab users={users} />
      </TabsContent>

      <TabsContent value="coupons" className="mt-6">
        <CouponsTab coupons={coupons} />
      </TabsContent>

      <TabsContent value="config" className="mt-6">
        <ConfigTab config={config} />
      </TabsContent>
    </Tabs>
  );
}
