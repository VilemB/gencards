"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
    <>
      <div className="min-h-screen bg-[var(--background)] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="heading-2">Profile</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary"
                disabled={loading}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="flex items-center space-x-6 mb-8">
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
              <div>
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
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <h2 className="heading-3">{session.user.name}</h2>
                    <p className="text-[var(--text-secondary)]">
                      {session.user.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--neutral-200)] pt-6">
              <h3 className="heading-4 mb-4">Account Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-[var(--text-secondary)]">
                    Email
                  </dt>
                  <dd className="mt-1 text-[var(--text-primary)]">
                    {session.user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--text-secondary)]">
                    Account ID
                  </dt>
                  <dd className="mt-1 text-[var(--text-primary)]">
                    {session.user.id}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-[var(--neutral-200)] mt-8 pt-8">
              <h3 className="heading-4 text-[var(--error)] mb-4">
                Danger Zone
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn bg-[var(--error)] text-white hover:bg-[var(--error)] hover:opacity-90"
                disabled={loading}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="heading-3 text-[var(--error)] mb-4">
              Delete Account
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            {error && (
              <p className="text-[var(--error)] text-sm mb-4">{error}</p>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn bg-[var(--error)] text-white hover:bg-[var(--error)] hover:opacity-90 flex-1"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
