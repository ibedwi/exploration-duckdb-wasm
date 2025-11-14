import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("generate-data", "routes/generate-data.tsx"),
  route("load-data", "routes/load-data.tsx"),
  route("duckdb-test", "routes/duckdb-test.tsx"),
] satisfies RouteConfig;
