"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Mail, Calendar, Loader2, PencilLine } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUserData() {
      try {
        const id = await Promise.resolve(params?.id);
        if (!id) {
          router.push("/auth/signin");
          return;
        }

        const response = await fetch(`/api/user/${id}`);
        if (!response.ok) {
          throw new Error("Failed to load user data");
        }
        const user = await response.json();
        setUserData(user);
        setName(user.name);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      loadUserData();
    }
  }, [session, sessionStatus, router, params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/user/${userData?._id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session || !userData) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                {userData.image ? (
                  <Image
                    src={userData.image}
                    alt={userData.name}
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-[var(--primary)]">
                      {userData.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="sr-only">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input w-full"
                          placeholder="Your name"
                          disabled={isSaving}
                          required
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-[var(--error)]">{error}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="btn-secondary"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                          {userData.name}
                        </h1>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                          title="Edit profile"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[var(--text-secondary)]">
                        {userData.email}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 border-t border-[var(--neutral-200)] pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <Mail className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Email</p>
                  <p className="text-[var(--text-primary)]">{userData.email}</p>
                </div>
              </div>
              {userData.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                    <Calendar className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Joined
                    </p>
                    <p className="text-[var(--text-primary)]">
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              Recent Activity
            </h2>
            {/* Add activity content here */}
            <p className="text-[var(--text-secondary)]">
              Activity section coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
