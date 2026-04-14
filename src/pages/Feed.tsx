import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { useState } from "react";
import profileImg from "@/assets/profile-3.jpg";
import feedImg from "@/assets/feed-1.jpg";

const Feed = () => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(51);

  const handleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col items-center">
      {/* Dark mode toggle top right */}
      <div className="w-full flex justify-end p-4">
        <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground">
          <Moon size={18} />
        </button>
      </div>

      {/* Post Card */}
      <div className="w-full max-w-lg bg-card rounded-lg overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <div
            className="w-10 h-10 rounded-full p-[2px] flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(300 80% 50%), hsl(30 80% 50%), hsl(0 80% 50%))",
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border border-background">
              <img
                src={profileImg}
                alt="Sujan"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Sujan</p>
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              📍 Hattiesburg,MS
            </p>
          </div>
        </div>

        {/* Image with carousel arrows */}
        <div className="relative">
          <img
            src={feedImg}
            alt="Feed post"
            className="w-full aspect-square object-cover"
            width={640}
            height={800}
          />
          <button className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground">
            <ChevronLeft size={28} />
          </button>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground">
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike}>
              <Heart
                size={24}
                className={liked ? "fill-accent text-accent" : "text-foreground"}
              />
            </button>
            <button>
              <MessageCircle size={24} className="text-foreground" />
            </button>
            <button>
              <Share2 size={24} className="text-foreground" />
            </button>
          </div>
          <p className="text-foreground text-sm font-medium">{likes} Likes</p>
          <p className="text-foreground text-sm font-bold">Yooo</p>
          <p className="text-muted-foreground text-sm cursor-pointer">
            View All Comments
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
