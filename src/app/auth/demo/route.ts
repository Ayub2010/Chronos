import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/app", url.origin));
  response.cookies.set("chronos-demo", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url.origin));
  response.cookies.set("chronos-demo", "", { path: "/", maxAge: 0 });
  return response;
}
