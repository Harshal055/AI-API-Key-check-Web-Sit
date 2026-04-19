import "./globals.css";

export const metadata = {
  title: 'OmniKey | AI Model API Validator',
  description: 'Securely validate your API keys for OpenAI, Anthropic, Gemini, Mistral, Groq, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        {children}
      </body>
    </html>
  );
}
