import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { BarChart3, Lock, Users, CheckCircle2, XCircle, ArrowLeft, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import AdminLogin from "./AdminLogin";

function UnlockButton({ ipAddress }: { ipAddress: string }) {
  const unlockMutation = trpc.admin.unlockIp.useMutation();
  const [, setLocation] = useLocation();

  const handleUnlock = async () => {
    if (confirm(`Odblokować IP: ${ipAddress}?`)) {
      await unlockMutation.mutateAsync({ ipAddress });
      setLocation("/admin");
    }
  };

  return (
    <Button
      onClick={handleUnlock}
      disabled={unlockMutation.isPending}
      size="sm"
      className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs"
    >
      {unlockMutation.isPending ? "..." : "Odblokuj"}
    </Button>
  );
}

export default function AdminDashboard() {
  const [pinVerified, setPinVerified] = useState(() => {
    return !!sessionStorage.getItem("adminPin");
  });
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const statsQuery = trpc.admin.getStats.useQuery(undefined, {
    enabled: pinVerified,
  });

  const attemptsQuery = trpc.admin.getAttempts.useQuery(
    { limit: pageSize, offset: page * pageSize },
    { enabled: pinVerified }
  );

  if (!pinVerified) {
    return <AdminLogin onLoginSuccess={() => setPinVerified(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem("adminPin");
    setPinVerified(false);
  };

  const stats = statsQuery.data || {
    totalAttempts: 0,
    uniqueIps: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    currentlyLockedIps: 0,
    successRate: 0,
    repeatedOffenders: 0,
  };

  const successRate = stats.totalAttempts > 0 ? Math.round((stats.successfulAttempts / stats.totalAttempts) * 100) : 0;
  const attempts = attemptsQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-mono tracking-tighter text-slate-100">PANEL ADMINISTRATORA</h1>
            <p className="text-slate-400 text-sm mt-1">Statystyki i zarządzanie próbami</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Wróć
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-mono">Razem prób</p>
                  <p className="text-3xl font-bold text-white font-mono mt-2">{stats.totalAttempts}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-mono">Unikalne IP</p>
                  <p className="text-3xl font-bold text-white font-mono mt-2">{stats.uniqueIps}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-mono">Procent sukcesu</p>
                  <p className="text-3xl font-bold text-white font-mono mt-2">{successRate}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </div>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <p className="text-slate-400 text-sm font-mono">Udane próby</p>
              <p className="text-2xl font-bold text-green-400 font-mono mt-2">{stats.successfulAttempts}</p>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <p className="text-slate-400 text-sm font-mono">Nieudane próby</p>
              <p className="text-2xl font-bold text-red-400 font-mono mt-2">{stats.failedAttempts}</p>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <p className="text-slate-400 text-sm font-mono">Aktualnie zablokowane</p>
              <p className="text-2xl font-bold text-orange-400 font-mono mt-2">{stats.currentlyLockedIps}</p>
            </div>
          </Card>
        </div>

        {/* Attempts Table */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white font-mono mb-4">Historia prób</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">IP</th>
                    <th className="text-left py-2 px-3 text-slate-400">Kąt</th>
                    <th className="text-left py-2 px-3 text-slate-400">Status</th>
                    <th className="text-left py-2 px-3 text-slate-400">Czas</th>
                    <th className="text-left py-2 px-3 text-slate-400">Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Brak danych
                      </td>
                    </tr>
                  ) : (
                    attempts.map((attempt: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-3 text-slate-300">{attempt.ipAddress}</td>
                        <td className="py-3 px-3 text-slate-300">{attempt.angle}°</td>
                        <td className="py-3 px-3">
                          {attempt.isSuccessful ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> OK
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(attempt.attemptedAt).toLocaleString("pl-PL")}
                        </td>
                        <td className="py-3 px-3">
                          <UnlockButton ipAddress={attempt.ipAddress} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Poprzednia
              </Button>
              <span className="text-slate-400 font-mono">Strona {page + 1}</span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={attempts.length < pageSize}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Następna
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
