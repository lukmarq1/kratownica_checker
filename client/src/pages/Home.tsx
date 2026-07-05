import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

export default function Home() {
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const verifyMutation = trpc.angle.verify.useMutation();
  const statusQuery = trpc.angle.status.useQuery();

  // Use result data if available (more up-to-date), otherwise use status query
  const isLocked = result?.isLocked ?? statusQuery.data?.isLocked ?? false;
  const remainingAttempts = result?.remainingAttempts ?? statusQuery.data?.remainingAttempts ?? 0;

  // Countdown timer
  useEffect(() => {
    if (!isLocked) {
      setTimeRemaining(null);
      return;
    }

    // Use result data if available (just got locked), otherwise use status query
    const lockoutMs = result?.remainingLockoutMs ?? statusQuery.data?.remainingLockoutMs;
    if (!lockoutMs) {
      setTimeRemaining(null);
      return;
    }

    setTimeRemaining(lockoutMs);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev || prev <= 0) {
          statusQuery.refetch();
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, result?.remainingLockoutMs, statusQuery.data?.remainingLockoutMs, statusQuery]);

  const handleVerify = async () => {
    if (!angle || isLocked) return;

    setLoading(true);
    try {
      const result = await verifyMutation.mutateAsync({
        angle: parseFloat(angle),
      });
      setResult(result);
      setAngle("");
      // Refetch status to update lock state (countdown will use result data)
      // Only refetch if not locked (for unlocking after 24h)
      if (!result.isLocked) {
        await statusQuery.refetch();
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white font-mono mb-2">KRATOWNICA</h1>
          <p className="text-slate-400 font-mono text-sm">Geocaching Angle Verification</p>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-mono">Wpisz kąt</CardTitle>
            <CardDescription className="text-slate-400">Znajdź prawidłowy kąt</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLocked ? (
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-mono text-sm font-bold">Konto zablokowane</p>
                    <p className="text-red-300 text-xs mt-1">Zbyt wiele nieudanych prób.</p>
                  </div>
                </div>
                {timeRemaining !== null && (
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-2">Odblokowanie za:</p>
                    <p className="text-2xl font-mono text-red-400 font-bold">{formatTime(timeRemaining)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Wpisz kąt (całe stopnie)"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono"
                    min="0"
                    max="360"
                  />
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={loading || !angle || isLocked}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sprawdzanie..." : isLocked ? "Zablokowane" : "Sprawdź"}
                </Button>

                {/* Remaining attempts */}
                <div className="text-center">
                  <p className="text-slate-400 text-xs">
                    Pozostało prób: <span className="font-bold text-white">{remainingAttempts}</span>
                  </p>
                </div>

                {/* Result */}
                {result && (
                  <div className={`rounded-lg p-4 flex items-start gap-3 ${result.success ? "bg-green-900/20 border border-green-700" : "bg-red-900/20 border border-red-700"}`}>
                    {result.success ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-400 font-mono text-sm font-bold">Prawidłowy kąt!</p>
                          <p className="text-green-300 text-xs mt-1">Gratulacje! Rozwiązałeś puzzle.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-400 font-mono text-sm font-bold">Nieprawidłowy kąt</p>
                          <p className="text-red-300 text-xs mt-1">Spróbuj ponownie.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs font-mono">
          <Link href="/admin" className="text-blue-400 hover:text-blue-300 underline">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
