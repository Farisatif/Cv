import { useEffect, useState } from "react";

const GITHUB_USER = "Farisatif";
const CACHE_KEY = "cv-github-repos-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface GitHubRepoInfo {
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
}

interface Cached {
  data: Record<string, GitHubRepoInfo>;
  fetchedAt: number;
}

function loadCache(): Record<string, GitHubRepoInfo> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c: Cached = JSON.parse(raw);
    if (Date.now() - c.fetchedAt < CACHE_TTL_MS) return c.data;
  } catch {}
  return null;
}

function saveCache(data: Record<string, GitHubRepoInfo>) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() } as Cached),
    );
  } catch {}
}

export function useGitHubRepos() {
  const [repos, setRepos] = useState<Record<string, GitHubRepoInfo>>(
    () => loadCache() ?? {},
  );
  const [loading, setLoading] = useState(Object.keys(repos).length === 0);

  useEffect(() => {
    const cached = loadCache();
    if (cached && Object.keys(cached).length > 0) {
      setRepos(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
          { headers: { Accept: "application/vnd.github+json" } },
        );
        if (!res.ok) throw new Error("github repos fetch failed");
        const list = (await res.json()) as Array<{
          name: string;
          stargazers_count: number;
          forks_count: number;
          language: string | null;
          updated_at: string;
        }>;
        const map: Record<string, GitHubRepoInfo> = {};
        for (const r of list) {
          map[r.name.toLowerCase()] = {
            name: r.name,
            stars: r.stargazers_count ?? 0,
            forks: r.forks_count ?? 0,
            language: r.language,
            updatedAt: r.updated_at,
          };
        }
        if (!cancelled) {
          setRepos(map);
          saveCache(map);
        }
      } catch {
        // keep cache or empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Returns live repo info for a github URL like `github.com/User/Repo` */
  const lookup = (url?: string): GitHubRepoInfo | null => {
    if (!url) return null;
    const m = url.match(/github\.com\/[^/]+\/([^/?#]+)/i);
    if (!m) return null;
    const slug = m[1].replace(/\.git$/i, "").toLowerCase();
    return repos[slug] ?? null;
  };

  return { repos, loading, lookup };
}
