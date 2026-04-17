import { useState, useEffect } from "react";

const GITHUB_USERNAME = "farisatif";
const CACHE_KEY = "cv-github-stats";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface GitHubStats {
  repos: number;
  followers: number;
  stars: number;
}

interface CachedStats {
  data: GitHubStats;
  fetchedAt: number;
}

function loadCache(): GitHubStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedStats = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;
  } catch {}
  return null;
}

function saveCache(data: GitHubStats) {
  try {
    const cached: CachedStats = { data, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(() => loadCache());
  const [loading, setLoading] = useState(stats === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setStats(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    async function fetchStats() {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
          fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
          ),
        ]);

        if (!userRes.ok || !reposRes.ok) throw new Error("GitHub API error");

        const user = await userRes.json();
        const repos = await reposRes.json();

        const totalStars: number = Array.isArray(repos)
          ? repos.reduce(
              (sum: number, r: { stargazers_count: number }) =>
                sum + (r.stargazers_count || 0),
              0
            )
          : 0;

        const result: GitHubStats = {
          repos: user.public_repos ?? 0,
          followers: user.followers ?? 0,
          stars: totalStars,
        };

        if (!cancelled) {
          setStats(result);
          setLoading(false);
          saveCache(result);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
