import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { Layout } from "./components/Layout";
import { annotations, approvals, currentOperator, runs } from "./data/static";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { CostsPage } from "./pages/CostsPage";
import { ErrorAnalysisPage } from "./pages/ErrorAnalysisPage";
import { RunDetailPage } from "./pages/RunDetailPage";
import { RunsPage } from "./pages/RunsPage";
import { ScoreboardPage } from "./pages/ScoreboardPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <RunsPage runs={runs} /> },
      { path: "runs/:runId", element: <RunDetailPage /> },
      { path: "approvals", element: <ApprovalsPage initialApprovals={approvals} operator={currentOperator} /> },
      { path: "scoreboard", element: <ScoreboardPage /> },
      { path: "errors", element: <ErrorAnalysisPage initialAnnotations={annotations} /> },
      { path: "costs", element: <CostsPage /> },
    ],
  },
];

export function createRouter() {
  return createBrowserRouter(routes, { future: { v7_relativeSplatPath: true } });
}
