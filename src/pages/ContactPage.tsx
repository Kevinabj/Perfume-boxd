import { Navbar } from "@/components/Navbar";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">Contact Us</h1>
        <p className="text-muted-foreground text-sm mb-8">Have a question, suggestion, or just want to talk fragrances? We'd love to hear from you.</p>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {[
            { icon: Mail, label: "Email", value: "hello@perfumisto.com" },
            { icon: MessageSquare, label: "Community", value: "Join our Discord" },
            { icon: MapPin, label: "Based in", value: "Paris, France 🇫🇷" },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-5 text-center">
              <item.icon size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Send a Message</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Your name" className="w-full bg-muted/20 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground" />
              <input placeholder="Your email" type="email" className="w-full bg-muted/20 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground" />
            </div>
            <textarea placeholder="Your message..." rows={4} className="w-full bg-muted/20 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-muted-foreground" />
            <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
