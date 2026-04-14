import { useState } from "react";
import profileImg from "@/assets/profile-3.jpg";

const StoriesSection = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground mb-3 uppercase">
        Stories:
      </p>
      <div className="flex items-center gap-3">
        {/* Story circle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="relative w-16 h-16 rounded-full p-[2px] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(0 80% 40%), hsl(30 80% 50%), hsl(0 80% 50%))",
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
            <img
              src={profileImg}
              alt="Story"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-0 -right-0 text-lg cursor-pointer">👆</span>
        </button>

        {/* Music player mock */}
        {expanded && (
          <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
            <div className="flex gap-[2px] items-end h-6">
              {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-accent rounded-full animate-pulse"
                  style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <div className="text-xs">
              <p className="text-foreground">Alex Warren - Ordinary</p>
              <p className="text-muted-foreground">Alex Warren</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs">
              ▶
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesSection;
