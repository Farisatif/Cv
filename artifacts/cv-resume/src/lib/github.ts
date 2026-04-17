const GITHUB_USER = "Farisatif";

export interface GitHubStats {
  followers: number;
  public_repos: number;
  stars: number;
}

export interface ContributionDay {
  date: string;
  count: number;
}

export async function fetchGitHubStats(): Promise<GitHubStats | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = await res.json();

    let stars = 0;
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (reposRes.ok) {
        const repos = await reposRes.json();
        stars = repos.reduce(
          (acc: number, r: { stargazers_count: number }) =>
            acc + (r.stargazers_count ?? 0),
          0
        );
      }
    } catch {}

    return {
      followers: data.followers ?? 0,
      public_repos: data.public_repos ?? 0,
      stars,
    };
  } catch {
    return null;
  }
}

export async function fetchGitHubContributions(): Promise<
  number[][] | null
> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const contributions: ContributionDay[] = data.contributions ?? [];
    if (!contributions.length) return null;

    contributions.sort((a, b) => a.date.localeCompare(b.date));

    const firstDate = new Date(contributions[0].date);
    const startDay = firstDate.getDay();

    const weeks: number[][] = [];
    let week: number[] = new Array(startDay).fill(0);

    for (const day of contributions) {
      week.push(day.count);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(0);
      weeks.push(week);
    }

    return weeks.length ? weeks : null;
  } catch {
    return null;
  }
}
