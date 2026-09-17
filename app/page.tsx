import VishwakarmaToFarlandsJourney from "./components/VishwakarmaToFarlandsJourney";
import FarlandsLandingContent from "./components/FarlandsLandingContent";
import "./landing.css";

export default function Home() {
  return (
    <main className="farlands-page">
      {/* 1. Cinematic Transition: Vishwakarma Ancient Realm -> Cosmic Arrow -> Minecraft 3D Farlands World (up to 80%) */}
      <VishwakarmaToFarlandsJourney />

      {/* 2. Full Farlands Registration & Hackathon Landing Page Hub */}
      <FarlandsLandingContent />
    </main>
  );
}
