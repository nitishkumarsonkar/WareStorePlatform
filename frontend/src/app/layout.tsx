import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Ware Store - Where Trust Builds | B2B Construction Marketplace',
  description: 'Verified B2B Construction Marketplace connecting Builders and Material Vendors with PostGIS geolocation and real-time bidding.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-8 mt-16 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <div className="flex items-center justify-center space-x-2 font-bold text-white text-sm">
                <span>Ware Store</span>
                <span>•</span>
                <span className="text-amber-400 font-normal">Where Trust Builds</span>
              </div>
              <p className="text-slate-500">
                PostGIS Spatial Indexing • Redis OTP Rate-Limiting • Verified PAN & GSTIN Compliance
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
