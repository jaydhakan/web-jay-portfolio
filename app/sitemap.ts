import type { MetadataRoute } from "next";
import { projects } from "@/data/content";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaydhakan.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = ["", "/work", "/about", "/services", "/contact"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const caseStudies: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${base}/work/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...caseStudies];
}
