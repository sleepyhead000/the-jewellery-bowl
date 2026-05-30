import { db } from "@/lib/db";
import {
  contentPagesSettingKey,
  defaultContentPages,
  normalizeContentPages,
  type ContentPageKey,
} from "@/lib/content-pages-config";

type ContentPageProps = {
  pageKey: ContentPageKey;
};

const getContentPage = async (pageKey: ContentPageKey) => {
  const setting = await db.setting.findUnique({ where: { key: contentPagesSettingKey } });
  const pages = normalizeContentPages(setting?.value ?? defaultContentPages);
  return pages[pageKey];
};

export default async function ContentPage({ pageKey }: ContentPageProps) {
  const page = await getContentPage(pageKey);
  const paragraphs = page.body
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {paragraph}
        </p>
      ))}
      {page.listItems.length > 0 && (
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
          {page.listItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
