import { Download } from "lucide-react";

const stats = [
  { value: "1.5+", label: "Years Of Experience" },
  { value: "12+", label: "Happy Clients" },
  { value: "123+", label: "Project Completed" },
  { value: "12+", label: "Awards Won" },
];

const personalInfo = [
  { label: "Name", value: "Sujan" },
  { label: "Age", value: "19" },
  { label: "Email", value: "Admin@Sujan1919.Com.Np" },
  { label: "Address", value: "Gorkha, Nepal" },
];

const professionalInfo = [
  { label: "Freelance", value: "Available" },
  { label: "Skill", value: "Front-End & Backed" },
  { label: "Experience", value: "2.3" },
  { label: "Language", value: "Nepali, English, Hindi" },
];

const About = () => {
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
          <span className="text-foreground">ABOUT </span>
          <span className="text-accent">ME</span>
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row gap-10">
        {/* Left: Personal Info */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground mb-6">
            PERSONAL INFO
          </h2>

          <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8">
            <div className="space-y-5">
              {personalInfo.map((item) => (
                <div key={item.label}>
                  <span className="font-bold text-foreground text-sm">
                    {item.label} :{" "}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-5">
              {professionalInfo.map((item) => (
                <div key={item.label}>
                  <span className="font-bold text-foreground text-sm">
                    {item.label} :{" "}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Download CV */}
          <button className="inline-flex items-center gap-3 bg-hire text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
            Download CV
            <span className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Download size={16} />
            </span>
          </button>
        </div>

        {/* Right: Stats Grid */}
        <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-lg p-6 border border-border"
            >
              <p className="text-3xl font-bold text-accent mb-2">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
