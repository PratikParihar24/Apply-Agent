import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — Agent Apply" },
      { name: "description", content: "Connect with other creatives on their hunt." },
    ],
  }),
  component: Community,
});

function Community() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-cardbg ring-1 ring-cardborder">
        <span className="text-3xl">🪴</span>
      </div>
      <h1 className="text-3xl font-extrabold text-cream">Community page coming soon</h1>
      <p className="mt-3 max-w-md text-sm text-mutedtext">
        We're brewing a warm space for creatives to share their hunt stories. Check back soon.
      </p>
    </main>
  );
}
