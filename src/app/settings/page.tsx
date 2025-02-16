"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Flame,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    email: "",
    preferences: {
      dailyReminder: false,
      showStreak: true,
      cardsPerDay: 20,
      theme: "system",
    },
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

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
            setLoading(false);
          }
        } catch (error) {
          console.error("Error loading user settings:", error);
          setLoading(false);
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

    setIsSaving(true);
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

      setTheme(form.preferences.theme);
      setShowSuccessToast(true);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
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

  if (status === "loading" || loading) {
    return (
      <LoadingState
        title="Loading Settings"
        message="Please wait while we load your settings"
      />
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with improved gradient */}
        <div className="header-gradient mb-12">
          <div className="header-content">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                  Settings
                </h1>
                <p className="text-white/90 animate-fade-in-delayed">
                  Customize your learning experience
                </p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 animate-slide-up">
                <Settings className="h-8 w-8" />
              </div>
            </div>
          </div>
          <div className="header-pattern" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <User className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Profile
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                  >
                    Email Address{" "}
                    <span className="text-xs text-gray-500">
                      (Cannot be changed)
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
                    <input
                      type="email"
                      id="email"
                      disabled
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all "
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <Settings className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Preferences
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        preferences: { ...form.preferences, theme: "light" },
                      });
                    }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all",
                      form.preferences.theme === "light"
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--neutral-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/50"
                    )}
                  >
                    <Sun className="h-5 w-5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        preferences: { ...form.preferences, theme: "dark" },
                      });
                    }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all",
                      form.preferences.theme === "dark"
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--neutral-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/50"
                    )}
                  >
                    <Moon className="h-5 w-5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        preferences: { ...form.preferences, theme: "system" },
                      });
                    }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all",
                      form.preferences.theme === "system"
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--neutral-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/50"
                    )}
                  >
                    <Monitor className="h-5 w-5" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Study Preferences */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                  Study Preferences
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-[var(--text-secondary)]" />
                      <span className="text-[var(--text-primary)]">
                        Daily Reminder
                      </span>
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
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-light)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-[var(--text-secondary)]" />
                      <span className="text-[var(--text-primary)]">
                        Show Streak
                      </span>
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
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-light)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cards Per Day */}
              <div>
                <label
                  htmlFor="cardsPerDay"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-4"
                >
                  Cards Per Day
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
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  disabled={isSaving}
                >
                  {CARDS_PER_DAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          {/* Account Actions */}
          <hr className="border-t border-[var(--neutral-200)] my-8" />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSignOutModal(true)}
              className="flex-1"
            >
              Sign Out
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              Delete Account
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-500/5 p-4 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
          confirmText={isDeleting ? "Deleting..." : "Delete Account"}
          onConfirm={handleDeleteAccount}
          isDestructive={true}
          isLoading={isDeleting}
        />

        {/* Sign Out Modal */}
        <Modal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          title="Sign Out"
          description="Are you sure you want to sign out?"
          confirmText="Sign Out"
          onConfirm={() => signOut({ callbackUrl: "/" })}
        />

        {/* Success Toast */}
        {showSuccessToast && (
          <Toast
            message="Settings saved successfully!"
            onClose={() => setShowSuccessToast(false)}
          />
        )}
      </div>
    </div>
  );
}
