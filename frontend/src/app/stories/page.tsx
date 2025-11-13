'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

interface Story {
  id: string;
  title: string;
  description?: string;
  author: string;
  patreonTierRequired: string;
  coverImage?: string;
  owner: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function StoriesPage() {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth, logout } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchStories = async () => {
      try {
        const response = await api.get('/stories');
        setStories(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">RSP Stories Studio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email} ({user?.tier})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Available Stories</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No stories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/stories/${story.id}`)}
                >
                  {story.coverImage && (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {story.author}</p>
                    {story.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        {story.description.substring(0, 100)}
                        {story.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {story.patreonTierRequired}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {story.owner.name || story.owner.email}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
