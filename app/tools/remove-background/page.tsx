export default function RemoveBackgroundPage() {
  return (
    <main style={{ minHeight: "calc(100dvh - 64px)", background: "#121418" }}>
      <iframe
        src="/tool-modules/remove-background/index.html"
        title="Remove Background"
        style={{
          width: "100%",
          height: "calc(100dvh - 64px)",
          minHeight: 720,
          border: 0,
          display: "block",
          background: "#121418",
        }}
        allow="clipboard-read; clipboard-write"
        loading="eager"
      />
    </main>
  );
}
