"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PlusIcon,
  BookOpenIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface Deck {
  _id: string;
  title: string;
  description: string;
  cardCount: number;
  lastStudied?: Date;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecks() {
      try {
        const response = await fetch("/api/decks");
        const data = await response.json();
        setDecks(data);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchDecks();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Please sign in to access your dashboard
        </h1>
        <Link
          href="/auth/signin"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create, study, and manage your flashcard decks
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/decks/create"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Deck
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {decks.length === 0 ? (
            <div className="col-span-full text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No decks
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new deck
              </p>
              <div className="mt-6">
                <Link
                  href="/decks/create"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Deck
                </Link>
              </div>
            </div>
          ) : (
            decks.map((deck) => (
              <div
                key={deck._id}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <BookOpenIcon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/decks/${deck._id}`}
                      className="focus:outline-none"
                    >
                      <h3 className="text-lg font-medium text-gray-900">
                        {deck.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {deck.description}
                      </p>
                    </Link>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>{deck.cardCount} cards</span>
                      {deck.lastStudied && (
                        <>
                          <span className="mx-2">&middot;</span>
                          <span>
                            Last studied{" "}
                            {new Date(deck.lastStudied).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Link
                    href={`/decks/${deck._id}/study`}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-600 text-center"
                  >
                    Study
                  </Link>
                  <Link
                    href={`/decks/${deck._id}/edit`}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 text-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
