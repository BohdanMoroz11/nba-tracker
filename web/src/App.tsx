import { useRoute } from "./lib";
import { GamesPage } from "./components/GamesPage";
import { GamePage } from "./components/GamePage";

export function App() {
  const route = useRoute();
  // The game page is a fixed-viewport dashboard; the games list is a normal page.
  if (route.page === "game") return <GamePage id={route.id} playerId={route.playerId} />;
  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] px-4 pb-16 @container sm:px-6">
      <GamesPage />
    </div>
  );
}
