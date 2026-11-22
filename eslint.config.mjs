import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  // Never log user input (questions, birthdays, names) to the console.
  { files: ["src/**/*.{ts,tsx}"], rules: { "no-console": "error" } },
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
