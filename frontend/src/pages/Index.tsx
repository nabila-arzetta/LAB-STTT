import React, { useState } from 'react';
import { Phone, MapPin, Mail, Menu, X } from 'lucide-react';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Background Gradient Layer - Paling Belakang */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#092044] via-[#1a4d7a] to-[#A7BDD2]"></div>
      
      {/* Building Image Layer - Di Atas Gradient */}
      <div 
        className="absolute right-0 hidden w-1/2 md:block pointer-events-none" 
        style={{ 
          right: '-1px', 
          bottom: '0px', 
          height: 'calc(100% - 2px)', 
          transform: 'translateX(-50px)' 
        }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-90"
          style={{ 
            objectFit: 'cover', 
            objectPosition: 'bottom left', 
            right: '-50px', 
            bottom: '0' 
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
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/images/Logo.png" 
              alt="Logo STTT"
              className="object-contain w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center shadow-md"><span class="text-[#092044] font-bold text-xs sm:text-sm">STTT</span></div>';
                }
              }}
            />
            <h1 className="text-base font-semibold text-white sm:text-lg lg:text-xl">
              <span className="hidden sm:inline">Politeknik STTT Bandung</span>
              <span className="sm:hidden">STTT Bandung</span>
            </h1>
          </div>
          
          {/* Desktop Login Button */}
          <a
            href="/login"
            className="hidden sm:block bg-[#E5E5E5] text-[#092044] px-5 lg:px-7 py-2 lg:py-2.5 rounded-lg font-semibold text-sm lg:text-base hover:bg-white transition-all duration-300 hover:shadow-lg active:scale-95"
          >
            Masuk
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white transition-colors rounded-lg sm:hidden hover:bg-white/10 active:bg-white/20"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
      <main className="relative z-30 flex items-center flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 w-full">
          <div className="max-w-full sm:max-w-xl lg:max-w-[580px]">
            {/* Main Heading */}
            <h2 
              className="text-white text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-bold leading-tight sm:leading-tight lg:leading-[1.2] mb-5 sm:mb-6 lg:mb-7 tracking-tight"
              style={{ 
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
                fontWeight: '700'
              }}
            >
              Kelola Inventaris Laboratorium <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Politeknik STTT Bandung
            </h2>
            
            {/* Description */}
            <p className="text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-full sm:max-w-md lg:max-w-[480px] mb-6 sm:mb-8 lg:mb-9 opacity-95"
               style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.2)' }}>
              Inventaris Politeknik STTT Bandung merupakan platform untuk membantu pemantauan peralatan laboratorium agar terkendali dengan baik.
            </p>
            
            {/* CTA Button */}
            <a
              href="/login"
              className="inline-block bg-[#E5E5E5] text-[#092044] w-full sm:w-auto sm:min-w-[240px] lg:min-w-[280px] px-6 py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-center hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              Masuk untuk melanjutkan
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-3.5 mt-auto bg-white sm:py-4 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-5 text-[#092044] text-xs sm:text-sm font-medium">
            {/* Phone */}
            <div className="flex items-center gap-2 transition-colors cursor-pointer hover:text-blue-700">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Phone: +62-22-7272580</span>
            </div>
            
            {/* Address */}
            <div className="flex items-center gap-2 text-center transition-colors cursor-pointer hover:text-blue-700 sm:text-left">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Jl. Jakarta No. 31, Bandung 40272</span>
            </div>
            
            {/* Email */}
            <div className="flex items-center gap-2 transition-colors cursor-pointer hover:text-blue-700">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Email: info@stttekstil.ac.id</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;