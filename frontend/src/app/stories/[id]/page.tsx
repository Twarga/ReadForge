'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';

interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  content?: string;
  media: Media[];
}

interface Story {
  id: string;
  title: string;
  description?: string;
  author: string;
  patreonTierRequired: string;
  coverImage?: string;
  chapters: Chapter[];
}

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [story, setStory] = useState<Story | null>(null);
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

    const fetchStory = async () => {
      try {
        const response = await api.get(`/stories/${params.id}`);
        setStory(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [isAuthenticated, params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/stories')}
            className="text-primary-600 hover:text-primary-500"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/stories')}
                className="text-primary-600 hover:text-primary-500 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">{story.title}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {story.coverImage && (
            <img
              src={story.coverImage}
              alt={story.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-3xl font-bold mb-2">{story.title}</h2>
            <p className="text-gray-600 mb-4">by {story.author}</p>
            {story.description && (
              <p className="text-gray-700 mb-4">{story.description}</p>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {story.patreonTierRequired} Tier Required
            </span>
          </div>

          <div className="space-y-8">
            {story.chapters.map((chapter) => (
              <div key={chapter.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-semibold mb-4">
                  Chapter {chapter.order + 1}: {chapter.title}
                </h3>
                {chapter.content && (
                  <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                    {chapter.content}
                  </p>
                )}
                {chapter.media.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapter.media.map((media) => (
                      <div key={media.id} className="rounded-lg overflow-hidden">
                        {media.type === 'IMAGE' ? (
                          <img
                            src={media.url}
                            alt={`Media ${media.order}`}
                            className="w-full h-auto"
                          />
                        ) : (
                          <video
                            src={media.url}
                            controls
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {story.chapters.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">No chapters available yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
