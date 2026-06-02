import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DIR = path.join(process.cwd(), 'content', 'experiments');

export interface ExperimentFrontmatter {
  title: string;
  summary: string;
  date: string; // ISO
  winner?: string;
  heroStatLabel?: string;
  heroStatValue?: string;
  status?: 'live' | 'running' | 'planned';
  tags?: string[];
}

export interface Experiment extends ExperimentFrontmatter {
  slug: string;
  content: string;
}

export function getExperimentSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getExperiment(slug: string): Experiment | null {
  const file = path.join(DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  return { slug, content, ...(data as ExperimentFrontmatter) };
}

export function getAllExperiments(): Experiment[] {
  return getExperimentSlugs()
    .map(getExperiment)
    .filter((e): e is Experiment => !!e)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const TX_DIR = path.join(process.cwd(), 'data', 'transcripts');

/** Optional transcript drill-down for an experiment (data/transcripts/<slug>.json). */
export function getTranscript(slug: string): unknown | null {
  const file = path.join(TX_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
