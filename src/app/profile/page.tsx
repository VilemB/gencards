"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    router.push("/auth/signin");
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

      await updateSession({ name });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        </div>
      </div>
    </div>
  );
}
