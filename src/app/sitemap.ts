import type { MetadataRoute } from "next";

const baseUrl = "https://tapink.com.au";

const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: MetadataRoute.Sitemap[0]["priority"];
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about-us", changeFrequency: "monthly", priority: 0.7 },
  { path: "/support", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contacts", changeFrequency: "monthly", priority: 0.6 },
  { path: "/policies", changeFrequency: "yearly", priority: 0.5 },
  { path: "/return", changeFrequency: "yearly", priority: 0.5 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.6 },
  { path: "/auth", changeFrequency: "monthly", priority: 0.6 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.7 },
  { path: "/design", changeFrequency: "weekly", priority: 0.7 },
  { path: "/add-profiles", changeFrequency: "monthly", priority: 0.6 },
  { path: "/analytics", changeFrequency: "monthly", priority: 0.4 },
  { path: "/orders", changeFrequency: "monthly", priority: 0.4 },
  { path: "/checkout", changeFrequency: "monthly", priority: 0.4 },
  { path: "/user", changeFrequency: "weekly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
