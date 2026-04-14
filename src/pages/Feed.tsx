import { Heart, MapPin, Calendar, Eye } from "lucide-react";
import { useState } from "react";
import profileImg from "@/assets/profile-3.jpg";
import feedImg from "@/assets/feed-1.jpg";
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";

const feedItems = [
  {
    id: 1,
    image: feedImg,
    title: "Yooo",
    location: "Hattiesburg, MS",
    date: "Mar 2025",
    views: 51,
    caption: "Just vibing ✌️",
  },
  {
    id: 2,
    image: profile1,
    title: "Garden Days",
    location: "Gorkha, Nepal",
    date: "Jan 2025",
    views: 34,
    caption: "Peace & green 🌿",
  },
  {
    id: 3,
    image: profile2,
    title: "Mountain High",
    location: "Manaslu Region",
    date: "Dec 2024",
    views: 72,
    caption: "Above the clouds 🏔️",
  },
];

const Feed = () => {
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Red gradient top */}
      <div
        className="h-2 w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(0 80% 30%), transparent)",
        }}
      />

      {/* Title — matches portfolio style */}
      <div className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          <span className="text-accent">MY</span>
          <span className="text-foreground"> FEED</span>
        </h1>
      </div>

      {/* Masonry-style staggered grid */}
      <div className="max-w-6xl mx-auto px-6 columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {feedItems.map((item) => {
          const isLiked = likedIds.has(item.id);
          return (
            <div
              key={item.id}
              className="break-inside-avoid group relative rounded-xl overflow-hidden border border-border bg-card"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Like button floating */}
                <button
                  onClick={() => toggleLike(item.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110"
                >
                  <Heart
                    size={18}
                    className={
                      isLiked
                        ? "fill-accent text-accent"
                        : "text-foreground"
                    }
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={profileImg}
                    alt="Sujan"
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-bold text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground text-xs">Sujan</p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm">{item.caption}</p>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-muted-foreground text-xs pt-1 border-t border-border">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-accent" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Eye size={12} />
                    {isLiked ? item.views + 1 : item.views}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Feed;
