"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsForm {
  name: string;
  email: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userId = await Promise.resolve(session.user.id);
      const response = await fetch(`/api/user/${userId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update settings");
      }

      // Refresh the session to update the displayed name
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Settings
            </h1>
          </div>

          {/* Profile Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              Account Settings
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full"
                  disabled={isLoading}
                  required
                />
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  This is your public display name.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  className="input w-full bg-[var(--neutral-50)]"
                  disabled
                />
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Your email address is managed through your authentication
                  provider.
                </p>
              </div>

              {error && (
                <p className="text-sm text-[var(--error)] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
