import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Voice Studio",
  description: "AI Voice Agent Studio - Design, test, and deploy voice agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
