import React from "react";
import { Users, Calendar, Thermometer, Eye, Building2 } from "lucide-react";

export interface MediaCardProps {
  title?: string;
  visitors?: string;
  age?: string;
  temp?: string;
  images?: string[];
  ctaText?: string;
  onCtaClick?: () => void;
}

export const InstagramMediaCard: React.FC<MediaCardProps> = ({
  title = "Modern Townhouse in Downtown",
  visitors = "2,429",
  age = "3 Years",
  temp = "28°F",
  images = [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80", // bed
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80", // kitchen
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80"  // bath
  ],
  ctaText = "Looks good, I want to sign",
  onCtaClick,
}) => {
  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white border border-[#1A2421]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 my-2">
      {/* Title */}
      <div className="p-4 bg-[#F4F7F6]/50">
        <h4 className="font-bold text-sm text-[#0C1412] leading-tight tracking-tight">{title}</h4>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <div className="bg-[#F4F7F6] p-2.5 rounded-xl border border-[#1A2421]/5 text-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#1A2421]/45 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#1A2421]/50" />
            Visitors
          </span>
          <p className="text-xs font-extrabold text-[#0C1412] mt-0.5">{visitors}</p>
        </div>
        <div className="bg-[#F4F7F6] p-2.5 rounded-xl border border-[#1A2421]/5 text-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#1A2421]/45 flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#1A2421]/50" />
            Age
          </span>
          <p className="text-xs font-extrabold text-[#0C1412] mt-0.5">{age}</p>
        </div>
        <div className="bg-[#F4F7F6] p-2.5 rounded-xl border border-[#1A2421]/5 text-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#1A2421]/45 flex items-center justify-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-[#1A2421]/50" />
            Temp
          </span>
          <p className="text-xs font-extrabold text-[#0C1412] mt-0.5">{temp}</p>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-1 px-4 pb-4">
        {images.map((img, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#1A2421]/5 relative group">
            <img 
              src={img} 
              alt={`space-${i}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {i === 2 && (
              <div className="absolute inset-0 bg-[#0C1412]/50 flex items-center justify-center text-white text-xs font-bold select-none">
                Bath +3
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {ctaText && (
        <button
          onClick={onCtaClick}
          className="w-full py-3 bg-[#0C1412] hover:bg-[#1A2421] text-white text-xs font-bold text-center border-t border-[#1A2421]/10 tracking-tight transition-colors duration-200"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
};
export default InstagramMediaCard;
