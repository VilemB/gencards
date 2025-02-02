"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Loader2,
  AlertTriangle,
  Bell,
  Eye,
  Palette,
  Trash2,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SettingsForm | null>(null);

  useEffect(() => {
    async function loadUserSettings() {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            // Safely set form with user data
            setForm({
              name: data.name || "",
              email: data.email || "",
              preferences: {
                dailyReminder: Boolean(data.preferences?.dailyReminder),
                showStreak: Boolean(data.preferences?.showStreak),
                cardsPerDay: data.preferences?.cardsPerDay || 20,
                theme: data.preferences?.theme || "system",
              },
            });
            // Only set theme if it exists
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
    if (!form) return;

    setIsLoading(true);
    setError("");

    try {
      const userId = session?.user?.id;
      const response = await fetch(`/api/user/${userId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      // Update theme if it was changed
      setTheme(form.preferences.theme);

      // Show success message
      const successMessage = document.getElementById("successMessage");
      if (successMessage) {
        successMessage.classList.remove("opacity-0");
        setTimeout(() => {
          successMessage.classList.add("opacity-0");
        }, 3000);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const userId = session?.user?.id;
      const response = await fetch(`/api/user/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  if (status === "loading" || !form) {
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                <Settings className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Settings
              </h1>
            </div>
            <div
              id="successMessage"
              className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full transition-opacity duration-300 opacity-0"
            >
              Settings saved successfully!
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div className="bg-[var(--background)] border border-[var(--neutral-200)] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Profile
                </h2>
                <div className="flex-1 border-b border-[var(--neutral-200)]"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm transition-colors"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 py-2 text-[var(--text-secondary)] sm:text-sm cursor-not-allowed"
                    disabled
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Email is managed through your authentication provider
                  </p>
                </div>
              </div>
            </div>

            {/* Study Preferences */}
            <div className="bg-[var(--background)] border border-[var(--neutral-200)] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Study Preferences
                </h2>
                <div className="flex-1 border-b border-[var(--neutral-200)]"></div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="cardsPerDay"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-1"
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
                    className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {CARDS_PER_DAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Set your daily study goal to maintain a steady learning pace
                  </p>
                </div>

                {/* Toggles Section */}
                <div className="space-y-4">
                  {/* Daily Reminder Toggle */}
                  <div className="flex items-center justify-between py-3 px-4 bg-[var(--neutral-50)] rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
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
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
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
                        className="sr-only peer"
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                  </div>

                  {/* Show Streak Toggle */}
                  <div className="flex items-center justify-between py-3 px-4 bg-[var(--neutral-50)] rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
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
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
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
                        className="sr-only peer"
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                  </div>

                  {/* Theme Selection */}
                  <div className="flex items-center justify-between py-3 px-4 bg-[var(--neutral-50)] rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
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
                            theme: e.target.value as
                              | "light"
                              | "dark"
                              | "system",
                          },
                        })
                      }
                      className="rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm transition-colors"
                      disabled={isLoading}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4">
              <Button
                type="submit"
                className="w-full transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving changes...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full transition-all"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
