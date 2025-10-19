export const metadata = {
  title: "Mayker Proposals",
  description: "Proposal generator for Mayker Events",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
