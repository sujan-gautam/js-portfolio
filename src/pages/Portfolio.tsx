import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import portfolio5 from "@/assets/portfolio-5.jpg";
import portfolio6 from "@/assets/portfolio-6.jpg";

const projects = [
  portfolio1,
  portfolio2,
  portfolio3,
  portfolio4,
  portfolio5,
  portfolio6,
];

const Portfolio = () => {
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

      {/* Title */}
      <div className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          <span className="text-accent">MY</span>
          <span className="text-foreground"> WORK</span>
        </h1>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((img, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-lg border border-border cursor-pointer"
          >
            <img
              src={img}
              alt={`Project ${i + 1}`}
              className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              width={640}
              height={512}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
