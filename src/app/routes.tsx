import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ExploreGames } from "./components/ExploreGames";
import { MyBets } from "./components/MyBets";
import { Leaderboard } from "./components/Leaderboard";
import { Ledger } from "./components/Ledger";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "explore", Component: ExploreGames },
      { path: "bets", Component: MyBets },
      { path: "leaderboard", Component: Leaderboard },
      { path: "ledger", Component: Ledger },
      { path: "profile", Component: Profile },
    ],
  },
]);
