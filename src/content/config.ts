import { z, defineCollection } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    year: z.number(),
    stack: z.array(z.string()).default([]),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    report: z.string().url().optional(),   // (tu “informe”)
    cover: z.string().optional(),          // imagen opcional en /public
    featured: z.boolean().default(false),  // para destacarlo en Home
  }),
});

export const collections = { projects };
