import FarlandsWorldExperience from "./components/farlands-hero/FarlandsWorldExperience";
import "./landing.css";

export default function Home() {
  return (
    <main className="farlands-page">
      {/* 
        Core Experience:
        STEVE FALLS FROM SKY
                ↓
        STEVE LANDS ON WORLD CUBE
                ↓
        WORLD CUBE ROTATES (Reveals hackathon chapters)
                ↓
        FINAL ROTATION
                ↓
        CIRCULAR PIXEL PORTAL APPEARS BEHIND STEVE
                ↓
        REGISTER NOW
                ↓
        STEVE ENTERS PORTAL
                ↓
        PORTAL TRANSITION TO REGISTRATION PAGE (/register)
      */}
      <FarlandsWorldExperience />
    </main>
  );
}
