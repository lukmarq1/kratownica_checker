import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getOrCreateAttemptRecord,
  isIpLocked,
  getRemainingLockoutTime,
  recordFailedAttempt,
  resetAttempts,
  recordAttemptHistory,
  getAllAttempts,
  getAdminStats,
  unlockIp,
} from "./db";
import {
  recordAttemptWithTracking,
  getAdvancedAnalytics,
  getUserProfileWithTracking,
  exportAttemptDataAsCSV,
} from "./dbEnhanced";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  angle: router({
    /**
     * Check the current status of an IP (attempts, lockout, etc.)
     */
    status: publicProcedure.query(async ({ ctx }) => {
      // Extract client IP safely, preferring x-forwarded-for for proxied requests
      const xForwardedFor = ctx.req.headers["x-forwarded-for"];
      let ipAddress = "unknown";
      if (xForwardedFor) {
        const ips = Array.isArray(xForwardedFor) ? xForwardedFor : xForwardedFor.split(",");
        const firstIp = (ips[0] || "").trim();
        if (firstIp && firstIp !== "unknown") ipAddress = firstIp;
      }
      if (ipAddress === "unknown" && ctx.req.ip && ctx.req.ip !== "unknown") {
        ipAddress = ctx.req.ip;
      }
      const locked = await isIpLocked(ipAddress);
      const remainingMs = locked ? await getRemainingLockoutTime(ipAddress) : 0;
      const record = await getOrCreateAttemptRecord(ipAddress);

      return {
        isLocked: locked,
        failedAttempts: record.failedAttempts || 0,
        remainingAttempts: Math.max(0, 2 - (record.failedAttempts || 0)),
        remainingLockoutMs: remainingMs,
      };
    }),

    /**
     * Submit an angle for verification.
     * Returns success/failure with appropriate messages and lockout info.
     */
    verify: publicProcedure
      .input(z.object({ angle: z.number().min(0).max(360) }))
      .mutation(async ({ input, ctx }) => {
        // Extract client IP safely
        const xForwardedFor = ctx.req.headers["x-forwarded-for"];
        let ipAddress = "unknown";
        if (xForwardedFor) {
          const ips = Array.isArray(xForwardedFor) ? xForwardedFor : xForwardedFor.split(",");
          const firstIp = (ips[0] || "").trim();
          if (firstIp && firstIp !== "unknown") ipAddress = firstIp;
        }
        if (ipAddress === "unknown" && ctx.req.ip && ctx.req.ip !== "unknown") {
          ipAddress = ctx.req.ip;
        }
        if (ipAddress === "unknown") {
          const userAgent = ctx.req.headers["user-agent"] || "";
          const acceptLanguage = ctx.req.headers["accept-language"] || "";
          ipAddress = `fallback-${Buffer.from(userAgent + acceptLanguage).toString("base64").slice(0, 16)}`;
        }

        // Check if already locked
        const isLockedNow = await isIpLocked(ipAddress);
        if (isLockedNow) {
          const remainingMs = await getRemainingLockoutTime(ipAddress);
          return {
            success: false,
            reason: "locked",
            remainingLockoutMs: remainingMs,
          };
        }

        // Verify angle (65° ± 0.5°)
        const correctAngle = 65;
        const tolerance = 0.5;
        const isCorrect =
          input.angle >= correctAngle - tolerance &&
          input.angle <= correctAngle + tolerance;

        if (isCorrect) {
          // Success: reset attempts and record history
          await resetAttempts(ipAddress);
          const record = await getOrCreateAttemptRecord(ipAddress);
          const userAgent = ctx.req.headers["user-agent"] || "unknown";
          await recordAttemptHistory(ipAddress, input.angle, true, (record.failedAttempts || 0) + 1, userAgent);
          await recordAttemptWithTracking(ipAddress, input.angle, true, (record.failedAttempts || 0) + 1, userAgent).catch(err => console.error("[Tracking] Error:", err));
          return {
            success: true,
            reason: "correct",
            angle: input.angle,
          };
        } else {
          // Failed attempt: record and check for lockout
          const record = await getOrCreateAttemptRecord(ipAddress);
          const result = await recordFailedAttempt(ipAddress);
          const userAgent = ctx.req.headers["user-agent"] || "unknown";
          await recordAttemptHistory(ipAddress, input.angle, false, (record.failedAttempts || 0) + 1, userAgent);
          await recordAttemptWithTracking(ipAddress, input.angle, false, (record.failedAttempts || 0) + 1, userAgent).catch(err => console.error("[Tracking] Error:", err));
          return {
            success: false,
            reason: "incorrect",
            remainingAttempts: result.remainingAttempts,
            isLocked: result.isLocked,
            lockedUntil: result.lockedUntil,
            remainingLockoutMs: result.isLocked
              ? (result.lockedUntil?.getTime() || 0) - Date.now()
              : 0,
          };
        }
      }),
  }),

  admin: router({
    /**
     * Get all attempts for admin dashboard (owner only)
     */
    getAttempts: publicProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllAttempts(input.limit, input.offset);
      }),

    /**
     * Get admin statistics (owner only)
     */
    getStats: publicProcedure.query(async () => {
      return await getAdminStats();
    }),

    /**
     * Get advanced analytics with geolocation and device tracking
     */
    getAdvancedAnalytics: publicProcedure.query(async () => {
      return await getAdvancedAnalytics();
    }),

    /**
     * Get detailed user profile by IP
     */
    getUserProfile: publicProcedure
      .input(z.object({ ipAddress: z.string() }))
      .query(async ({ input }) => {
        return await getUserProfileWithTracking(input.ipAddress);
      }),

    /**
     * Export all attempt data as CSV
     */
    exportData: publicProcedure.query(async () => {
      return await exportAttemptDataAsCSV();
    }),

    unlockIp: publicProcedure
      .input(z.object({ ipAddress: z.string() }))
      .mutation(async ({ input }) => {
        await unlockIp(input.ipAddress);
        return { success: true, ipAddress: input.ipAddress };
      }),

    /**
     * Verify admin PIN
     */
    verifyPin: publicProcedure
      .input(z.object({ pin: z.string() }))
      .mutation(async ({ input }) => {
        const adminPin = ENV.adminPin;
        if (!adminPin) {
          return { success: false, error: "Admin PIN not configured" };
        }
        const isValid = input.pin === adminPin;
        return { success: isValid };
      }),
  }),
});

export type AppRouter = typeof appRouter;
