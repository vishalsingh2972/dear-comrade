import path from "path";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.resolve(process.cwd(), "../../"),
      content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
      ],
    },
  },
};

export default config;