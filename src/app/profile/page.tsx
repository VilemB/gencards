"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Shield, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
    } else {
      setName(session.user.name);
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await updateSession();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="card">
            <div className="flex items-center space-x-8">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              ) : (
                <div className="w-24 h-24 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                  <span className="text-2xl text-[var(--primary)]">
                    {session.user.name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-[var(--text-secondary)]"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input mt-1"
                        disabled={loading}
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-[var(--error)] text-sm">{error}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h1 className="heading-2">{session.user.name}</h1>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary"
                      >
                        Edit Profile
                      </button>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {session.user.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="heading-3">Personal Information</h2>
              </div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[var(--text-secondary)]">
                    Full Name
                  </dt>
                  <dd className="mt-1 text-[var(--text-primary)]">
                    {session.user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--text-secondary)]">
                    Email Address
                  </dt>
                  <dd className="mt-1 text-[var(--text-primary)]">
                    {session.user.email}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="heading-3">Account Management</h2>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">
                Manage your account settings and preferences
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-secondary w-full justify-center"
                >
                  Close Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-[var(--text-secondary)]" />
              <h2 className="heading-3">Close Account</h2>
            </div>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to close your account? All your data will be
              permanently removed. This action cannot be undone.
            </p>
            {error && (
              <p className="text-[var(--error)] text-sm mb-4">{error}</p>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-primary flex-1"
                disabled={loading}
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                {loading ? "Closing..." : "Close Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
