"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, AlertTriangle } from "lucide-react";

interface SettingsForm {
  name: string;
  email: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user/${session.user.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });

      if (!response.ok) throw new Error("Failed to update settings");

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

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user/${session.user.id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      router.push("/auth/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Profile Settings
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  className="input w-full bg-[var(--neutral-50)]"
                  disabled
                />
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Email cannot be changed
                </p>
              </div>
              {error && (
                <p className="text-sm text-[var(--error)] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[var(--error)] mb-4">
              Danger Zone
            </h2>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-error w-full"
                disabled={isLoading}
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Are you sure you want to delete your account? This action
                  cannot be undone. All your flashcards and progress will be
                  permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    className="btn-error flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yes, Delete My Account"
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
