"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface BannerDisplayProps {
  position: "HERO" | "SIDEBAR" | "FOOTER" | "POPUP";
  className?: string;
  page?: string;
}

export default function BannerDisplay({ 
  position, 
  className = "",
  page = "home" 
}: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, [position, page]);

  // Auto-rotate banners every 5 seconds for hero position
  useEffect(() => {
    if (position === "HERO" && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length, position]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/banners?page=${page}&userType=ALL`);
      if (!response.ok) throw new Error("Failed to fetch banners");

      const data = await response.json();
      // Filter banners based on position (since API doesn't support position filtering yet)
      setBanners(data.banners || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (bannerId: string, action: 'impression' | 'click') => {
    try {
      await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId, action }),
      });
    } catch (error) {
      console.error('Error tracking banner interaction:', error);
    }
  };

  useEffect(() => {
    // Track impressions for visible banners
    if (banners.length > 0) {
      banners.forEach(banner => {
        trackInteraction(banner.id, 'impression');
      });
    }
  }, [banners]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
        <div className="h-32 bg-gray-300 rounded-lg"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  const renderBanner = (banner: Banner) => {
    const handleClick = () => {
      trackInteraction(banner.id, 'click');
    };

    const content = (
      <div className="relative overflow-hidden rounded-lg group cursor-pointer">
        {banner.imageUrl ? (
          <div className={`relative ${position === 'HERO' ? 'h-64 md:h-80 lg:h-96' : 'h-64'}`}>
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={position === "HERO"}
              sizes={position === "HERO" ? "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px" : "400px"}
            />
            
            {/* Overlay content for images */}
            {(banner.title || banner.subtitle || banner.content) && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2">
                <div className="text-center text-white max-w-full overflow-hidden">
                  <h3 className={`font-bold mb-2 drop-shadow-lg leading-tight ${
                    position === 'HERO' 
                      ? 'text-2xl md:text-4xl lg:text-5xl mb-4' 
                      : 'text-sm md:text-lg line-clamp-2'
                  }`}>
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className={`opacity-90 drop-shadow-md leading-tight ${
                      position === 'HERO' 
                        ? 'text-lg md:text-xl lg:text-2xl mb-4' 
                        : 'text-xs md:text-sm mb-1 line-clamp-2'
                    }`}>
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.content && (
                    <p className={`opacity-80 drop-shadow-md leading-tight ${
                      position === 'HERO' 
                        ? 'text-sm md:text-base max-w-md mx-auto' 
                        : 'text-xs line-clamp-3'
                    }`}>
                      {banner.content}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full ${position === 'HERO' ? 'h-64 md:h-80 lg:h-96' : 'h-64'} bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center p-2`}>
            <div className="text-center text-white max-w-full overflow-hidden">
              <h3 className={`font-bold mb-2 leading-tight ${
                position === 'HERO' 
                  ? 'text-2xl md:text-3xl' 
                  : 'text-sm md:text-lg line-clamp-2'
              }`}>
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className={`opacity-90 leading-tight ${
                  position === 'HERO' 
                    ? 'text-lg mb-2' 
                    : 'text-xs md:text-sm mb-1 line-clamp-2'
                }`}>
                  {banner.subtitle}
                </p>
              )}
              {banner.content && (
                <p className={`opacity-80 leading-tight ${
                  position === 'HERO' 
                    ? 'text-sm max-w-md mx-auto' 
                    : 'text-xs line-clamp-3'
                }`}>
                  {banner.content}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );

    if (banner.buttonUrl) {
      return (
        <Link
          key={banner.id}
          href={banner.buttonUrl}
          className="block"
          onClick={handleClick}
          aria-label={`Go to ${banner.title}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <div key={banner.id} onClick={handleClick}>
        {content}
      </div>
    );
  };

  // Different layouts based on position
  switch (position) {
    case "HERO":
      return (
        <div className={`relative ${className}`}>
          {renderBanner(currentBanner)}
          
          {/* Banner navigation dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                    index === currentBannerIndex ? "bg-white" : "bg-white bg-opacity-50"
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      );

    case "SIDEBAR":
      return (
        <div className={`space-y-4 ${className}`}>
          {banners.map((banner) => (
            <div key={banner.id} className="relative">
              {renderBanner(banner)}
            </div>
          ))}
        </div>
      );

    case "FOOTER":
      return (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(banners.length, 3)} gap-4 ${className}`}>
          {banners.slice(0, 3).map((banner) => (
            <div key={banner.id} className="relative">
              {renderBanner(banner)}
            </div>
          ))}
        </div>
      );

    case "POPUP":
      // Simple implementation - you might want to add modal logic
      return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
          <div className="relative max-w-2xl w-full">
            {renderBanner(currentBanner)}
            <button
              onClick={() => {/* Add close logic */}}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Close banner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}