"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  AlertTriangle,
  Bell,
  Sun,
  Moon,
  Monitor,
  Flame,
  Hash,
  User,
  Mail,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";

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
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-12 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-white/80">
                  Customize your learning experience
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Settings className="h-8 w-8" />
              </div>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "30px 30px",
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Profile
              </h2>
            </div>

            <div className="space-y-4">
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
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Preferences
              </h2>
            </div>

            <div className="space-y-6">
              {/* Daily Reminder */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--neutral-50)] rounded-lg">
                  <Bell className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2">
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
                      className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      disabled={isSaving}
                    />
                    <span className="font-medium text-[var(--text-primary)]">
                      Daily Reminder
                    </span>
                  </label>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Receive daily reminders to study
                  </p>
                </div>
              </div>

              {/* Show Streak */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--neutral-50)] rounded-lg">
                  <Flame className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2">
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
                      className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      disabled={isSaving}
                    />
                    <span className="font-medium text-[var(--text-primary)]">
                      Show Streak
                    </span>
                  </label>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Display your study streak on the dashboard
                  </p>
                </div>
              </div>

              {/* Cards Per Day */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--neutral-50)] rounded-lg">
                  <Hash className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="cardsPerDay"
                    className="block font-medium text-[var(--text-primary)] mb-1"
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
                          cardsPerDay: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    disabled={isSaving}
                  >
                    {CARDS_PER_DAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Number of cards to study per day
                  </p>
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--neutral-50)] rounded-lg">
                  {form.preferences.theme === "light" && (
                    <Sun className="h-6 w-6 text-[var(--primary)]" />
                  )}
                  {form.preferences.theme === "dark" && (
                    <Moon className="h-6 w-6 text-[var(--primary)]" />
                  )}
                  {form.preferences.theme === "system" && (
                    <Monitor className="h-6 w-6 text-[var(--primary)]" />
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="theme"
                    className="block font-medium text-[var(--text-primary)] mb-1"
                  >
                    Theme
                  </label>
                  <select
                    id="theme"
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
                    className="w-full px-4 py-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    disabled={isSaving}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Choose your preferred theme
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Delete Account Section */}
          <section className="border-t border-[var(--neutral-200)] pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-600/90 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Delete Account
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                disabled={isSaving}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 text-[var(--error)] bg-red-50 px-4 py-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end border-t border-[var(--neutral-200)] pt-8">
            <Button
              type="submit"
              disabled={isSaving}
              size="lg"
              className="min-w-[160px] relative"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>

        {/* Success Toast */}
        {showSuccessToast && (
          <Toast
            message="Settings saved successfully!"
            onClose={() => setShowSuccessToast(false)}
          />
        )}

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
          confirmText="Delete Account"
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
          onConfirm={() => signOut()}
        />
      </div>
    </div>
  );
}
