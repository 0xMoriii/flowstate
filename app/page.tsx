import ClientApp from "./ClientApp";

type PageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

/**
 * Server page: unwraps params/searchParams here so the client tree never
 * receives Promise props. That prevents the Next.js dev overlay from
 * enumerating params when you select elements (e.g. Cursor picker).
 */
export default async function Page(props: PageProps) {
  await (props.params ?? Promise.resolve({}));
  await (props.searchParams ?? Promise.resolve({}));
  return <ClientApp />;
}
