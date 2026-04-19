import React from "react";

interface SmartTextProps {
  text: string;
  className?: string;
}

export const SmartText = ({ text, className }: SmartTextProps) => {
  if (!text) return null;

  // Regex to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          try {
            const url = new URL(part);
            const hostname = url.hostname.toLowerCase();
            
            // Check if it's a social media link
            if (hostname.includes("instagram.com") || 
                hostname.includes("twitter.com") || 
                hostname.includes("x.com") || 
                hostname.includes("facebook.com") || 
                hostname.includes("linkedin.com") ||
                hostname.includes("github.com") ||
                hostname.includes("youtube.com")) {
              
              // Extract the last part (username)
              const pathParts = url.pathname.split("/").filter(Boolean);
              const username = pathParts[pathParts.length - 1];
              
              if (username) {
                return (
                  <a 
                    key={i} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#CB2729] hover:underline transition-all"
                  >
                    @{username}
                  </a>
                );
              }
            }
            
            // Fallback for other URLs
            return (
              <a 
                key={i} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                {part}
              </a>
            );
          } catch (e) {
            return part;
          }
        }
        return part;
      })}
    </span>
  );
};
