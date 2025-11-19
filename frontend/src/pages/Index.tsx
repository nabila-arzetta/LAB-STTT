import React, { useState } from 'react';
import { Phone, MapPin, Mail, Menu, X } from 'lucide-react';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Background Gradient Layer - Paling Belakang */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#092044] via-[#1a4d7a] to-[#A7BDD2]"></div>
      
      {/* Building Image Layer - Mobile (di tengah, menempel footer) */}
      <div 
        className="absolute left-1/2 -translate-x-1/3 w-full pointer-events-none md:hidden" 
        style={{ 
          bottom: '90px',
          height: '450px',
          maxWidth: '500px'
        }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-80"
          style={{ 
            objectFit: 'contain', 
            objectPosition: 'center bottom'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Building Image untuk Tablet */}
      <div 
        className="absolute bottom-0 right-0 hidden md:block lg:hidden pointer-events-none" 
        style={{ 
          width: '85%',
          height: '65%'
        }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-75"
          style={{ 
            objectFit: 'cover', 
            objectPosition: 'left bottom'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Building Image untuk Desktop */}
      <div 
        className="absolute bottom-0 right-0 hidden lg:block pointer-events-none" 
        style={{ 
          width: '50%',
          height: '100%'
        }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-90"
          style={{ 
            objectFit: 'cover', 
            objectPosition: 'left bottom'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 px-4 py-3.5 bg-[#092044] sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <img 
              src="/images/Logo.png" 
              alt="Logo STTT"
              className="object-contain w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center shadow-md"><span class="text-[#092044] font-bold text-xs sm:text-sm">STTT</span></div>';
                }
              }}
            />
            <h1 className="text-sm font-semibold text-white sm:text-base md:text-lg lg:text-xl">
              <span className="hidden sm:inline">Politeknik STTT Bandung</span>
              <span className="sm:hidden">STTT Bandung</span>
            </h1>
          </div>
          
          {/* Desktop Login Button */}
          <a
            href="/login"
            className="hidden sm:block bg-[#E5E5E5] text-[#092044] px-4 md:px-5 lg:px-7 py-2 lg:py-2.5 rounded-lg font-semibold text-xs md:text-sm lg:text-base hover:bg-neutral-300 transition-all duration-300 hover:shadow-lg active:scale-95"
          >
            Masuk
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white transition-colors rounded-lg sm:hidden hover:bg-white/10 active:bg-white/20"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-[#092044] border-t border-white/10 shadow-lg">
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-6 py-4 text-left text-white transition-colors hover:bg-white/10 active:bg-white/20 font-medium"
            >
              Masuk
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section - Content Layer Paling Depan */}
      <main className="relative z-30 flex items-center justify-center lg:justify-start lg:items-center flex-1 py-8 sm:py-12 md:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 w-full">
          <div className="max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-[580px] mx-auto lg:mx-0 text-center lg:text-left">
            {/* Main Heading */}
            <h2 
              className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[52px] font-bold leading-tight sm:leading-tight md:leading-[1.3] lg:leading-[1.2] mb-4 sm:mb-5 md:mb-6 lg:mb-7 tracking-tight px-2 sm:px-0"
              style={{ 
                textShadow: '2px 2px 10px rgba(0, 0, 0, 0.6)',
                fontWeight: '700'
              }}
            >
              Kelola Inventaris Laboratorium{' '}
              <span className="block sm:inline">Politeknik STTT Bandung</span>
            </h2>
            
            {/* Description */}
            <p className="text-white text-sm sm:text-base md:text-lg lg:text-lg leading-relaxed max-w-full sm:max-w-md md:max-w-lg lg:max-w-[500px] mb-6 sm:mb-7 md:mb-8 lg:mb-9 opacity-95 mx-auto lg:mx-0 px-2 sm:px-0"
               style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)' }}>
              Inventaris Politeknik STTT Bandung merupakan platform untuk membantu pemantauan peralatan laboratorium agar terkendali dengan baik.
            </p>
            
            {/* CTA Button */}
            <div className="px-2 sm:px-0">
              <a
                href="/login"
                className="inline-block bg-[#E5E5E5] text-[#092044] w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-center hover:bg-neutral-300 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
              >
                Masuk untuk melanjutkan
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 sm:py-5 mt-auto bg-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-[#092044] text-xs sm:text-sm font-medium">
            {/* Phone */}
            <a 
              href="tel:+622272580" 
              className="flex items-center gap-2 transition-colors hover:text-blue-700 group"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-center sm:text-left">Phone: +62-22-7272580</span>
            </a>
            
            {/* Address */}
            <a 
              href="https://maps.google.com/?q=Jl.+Jakarta+No.+31,+Bandung+40272" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-center transition-colors hover:text-blue-700 group sm:text-left"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="max-w-[280px] sm:max-w-none">Jl. Jakarta No. 31, Bandung 40272</span>
            </a>
            
            {/* Email */}
            <a 
              href="mailto:info@stttekstil.ac.id" 
              className="flex items-center gap-2 transition-colors hover:text-blue-700 group"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-center sm:text-left">Email: info@stttekstil.ac.id</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;