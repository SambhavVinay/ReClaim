import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Forward the image to FastAPI
    const response = await fetch(`${process.env.BACKEND_URL}/search`, {
      // or /search
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Search request failed" },
      { status: 500 }
    );
  }
}
