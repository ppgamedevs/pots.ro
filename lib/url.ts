export const absoluteUrl = (path = "/") => {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}${path}`;
};
