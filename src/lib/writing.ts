export type MarkdownModule = {
  default: any;
  getHeadings?: () => Promise<MarkdownHeading[]>;
  frontmatter: {
    title?: string;
    description?: string;
    deck?: string;
    date?: string | Date;
    tags?: string[];
    use_math?: boolean;
    draft?: boolean;
  };
};

export type MarkdownHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type WritingEntry = {
  slug: string;
  Component: any;
  headings: MarkdownHeading[];
  data: {
    title: string;
    description: string;
    deck?: string;
    date?: Date;
    tags: string[];
    use_math: boolean;
    draft: boolean;
  };
};

type MarkdownLoaders = Record<string, () => Promise<MarkdownModule>>;

function slugFromPath(filePath: string, collection: string) {
  const match = filePath.match(new RegExp(`content/${collection}/(.+)\\.md$`));
  if (!match) {
    throw new Error(`Cannot derive slug for ${filePath}`);
  }
  return match[1];
}

function normalizeDate(value: string | Date | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function loadMarkdownEntries(loaders: MarkdownLoaders, collection: string) {
  const entries = await Promise.all(
    Object.entries(loaders).map(async ([filePath, load]) => {
      const module = await load();
      const data = module.frontmatter ?? {};
      const headings = typeof module.getHeadings === "function" ? await module.getHeadings() : [];
      return {
        slug: slugFromPath(filePath, collection),
        Component: module.default,
        headings,
        data: {
          title: data.title ?? "Untitled",
          description: data.description ?? "",
          deck: data.deck,
          date: normalizeDate(data.date),
          tags: Array.isArray(data.tags) ? data.tags : [],
          use_math: Boolean(data.use_math),
          draft: Boolean(data.draft)
        }
      } satisfies WritingEntry;
    })
  );

  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => {
      const left = a.data.date?.getTime() ?? 0;
      const right = b.data.date?.getTime() ?? 0;
      return right - left || a.data.title.localeCompare(b.data.title);
    });
}

export function formatEntryDate(date?: Date, style: "short" | "long" = "short") {
  if (!date) return "未注明日期";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: style === "long" ? "long" : "2-digit",
    day: "2-digit"
  }).format(date);
}
