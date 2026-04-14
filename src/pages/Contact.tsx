import { MapPin, Mail, Phone, Facebook, Linkedin, Instagram, Github, Heart } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "#" },
  { icon: Linkedin, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Github, href: "#" },
];

const Contact = () => {
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
          <span className="text-foreground">CONTACT </span>
          <span className="text-accent">ME</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Get in Touch */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-3">
            GET IN TOUCH
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            You Can Contact Us Via Email, Calls Or Through Social Medias .✨
          </p>
          <div className="flex gap-3">
            {socialLinks.map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-accent transition-colors"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Contact Info + Courtesy */}
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Contact Me */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-8">
              CONTACT ME
            </h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin size={24} className="text-accent flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-foreground text-sm">Address :</p>
                  <p className="text-muted-foreground text-sm">Gorkha,Nepal</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={24} className="text-accent flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-foreground text-sm">Email :</p>
                  <p className="text-muted-foreground text-sm">
                    Admin@Sujan1919.Com.Np
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={24} className="text-accent flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-foreground text-sm">Number :</p>
                  <p className="text-muted-foreground text-sm">
                    +977-9824186158
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courtesy */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-4">
              COURTESY
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Thanks To Shreya And Swostika, And Special Thanks To Sujit, For
              Their Help Throughout The Journey.❤️
            </p>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground"
                >
                  <Heart size={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
