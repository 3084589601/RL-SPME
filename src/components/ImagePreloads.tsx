export function ImagePreloads({ urls }: { urls: string[] }) {
  const unique = [...new Set(urls.filter(Boolean))];
  return (
    <>
      {unique.map((href, i) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          {...(i === 0 ? { fetchPriority: "high" as const } : {})}
        />
      ))}
    </>
  );
}
