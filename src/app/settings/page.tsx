"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Loader2,
  AlertTriangle,
  Bell,
  Eye,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";

interface SettingsForm {
  name: string;
  email: string;
  preferences: {
    dailyReminder: boolean;
    showStreak: boolean;
    cardsPerDay: number;
    theme: "light" | "dark" | "system";
  };
}

const CARDS_PER_DAY_OPTIONS = [
  { value: 10, label: "10 cards" },
  { value: 20, label: "20 cards" },
  { value: 30, label: "30 cards" },
  { value: 50, label: "50 cards" },
  { value: 100, label: "100 cards" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    email: "",
    preferences: {
      dailyReminder: true,
      showStreak: true,
      cardsPerDay: 20,
      theme: "system",
    },
  });

  useEffect(() => {
    async function loadUserSettings() {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            // Set form with current user data and preferences, using defaults only if needed
            setForm({
              name: data.name || "",
              email: data.email || "",
              preferences: {
                dailyReminder: data.preferences?.dailyReminder ?? true,
                showStreak: data.preferences?.showStreak ?? true,
                cardsPerDay: data.preferences?.cardsPerDay ?? 20,
                theme: data.preferences?.theme || "system",
              },
            });
            // Update theme if it exists in user preferences
            if (data.preferences?.theme) {
              setTheme(data.preferences.theme);
            }
          }
        } catch (error) {
          console.error("Error loading user settings:", error);
        }
      }
    }

    if (session?.user) {
      loadUserSettings();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [session, status, router, setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userId = await Promise.resolve(session?.user?.id);
      const response = await fetch(`/api/user/${userId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update settings");
      }

      // Update theme after successful save
      setTheme(form.preferences.theme);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Settings
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Profile
              </h2>
              <div className="space-y-4">
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
                    Email is managed through your authentication provider
                  </p>
                </div>
              </div>
            </div>

            {/* Study Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Study Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="cardsPerDay"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Daily Study Goal
                  </label>
                  <select
                    id="cardsPerDay"
                    value={form.preferences.cardsPerDay}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          cardsPerDay: Number(e.target.value),
                        },
                      })
                    }
                    className="input w-full"
                    disabled={isLoading}
                  >
                    {CARDS_PER_DAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Set your daily study goal to maintain a steady learning pace
                  </p>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                      <Bell className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Daily Reminder
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Get notified when it&apos;s time to study
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dailyReminder"
                      checked={form.preferences.dailyReminder}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            dailyReminder: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[var(--neutral-100)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                      <Eye className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Show Streak
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Display your study streak on dashboard
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showStreak"
                      checked={form.preferences.showStreak}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            showStreak: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[var(--neutral-100)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                      <Palette className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Theme
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Choose your preferred theme
                      </p>
                    </div>
                  </div>
                  <select
                    value={form.preferences.theme}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          theme: e.target.value as "light" | "dark" | "system",
                        },
                      })
                    }
                    className="input"
                    disabled={isLoading}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
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
  );
}
