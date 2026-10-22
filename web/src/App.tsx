import { useRoute } from "./lib";
import { GamesPage } from "./components/GamesPage";
import { GamePage } from "./components/GamePage";

export function App() {
  const route = useRoute();
  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] px-4 pb-16 @container sm:px-6">
      {route.page === "game" ? <GamePage id={route.id} playerId={route.playerId} /> : <GamesPage />}
    </div>
  );
}
