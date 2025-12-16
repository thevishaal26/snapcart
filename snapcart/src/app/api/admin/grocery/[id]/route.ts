import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";

import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDb();
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "unauthorize to edit grocery" }, { status: 401 });
    }

    const { id } = params;
    // Additional debugging: log request URL and content-type to diagnose unexpected 400
    try {
      console.log('PATCH request url:', req.url);
      console.log('Content-Type header:', req.headers.get('content-type'));
      console.log('Raw id param:', JSON.stringify(id));
    } catch (e) {
      console.warn('Failed to log request meta:', e);
    }
      // Accept FormData (file upload) for edits
      const formData = await req.formData();
      const name = formData.get("name") as string | null;
      const category = formData.get("category") as string | null;
      const unit = formData.get("unit") as string | null;
      const price = formData.get("price") as string | null;
      const imageBlob = formData.get("image") as Blob | null;

      // Debug logs for diagnosis
      console.log(`PATCH /api/admin/grocery/${id} - received form keys:`, Array.from(formData.keys()));
      console.log('parsed values:', { name, category, unit, price, hasImage: !!imageBlob });

      // Validate id early to give a clear error
      const isValidId = /^[a-fA-F0-9]{24}$/.test(id);
      if (!isValidId) {
        console.warn('Invalid ObjectId passed to PATCH /api/admin/grocery/[id]:', id);
        // Return a distinct, verbose payload so client-side logs can confirm what's actually returned
        return NextResponse.json(
          {
            message: 'invalid grocery id',
            marker: 'PATCH_INVALID_ID_V2',
            idReceived: id,
            idType: typeof id,
            idLength: id ? String(id).length : 0,
          },
          { status: 400 }
        );
      }

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (category) updateFields.category = category;
    if (unit) updateFields.unit = unit;
    if (price) updateFields.price = price;

    if (imageBlob) {
      try {
        const imageUrl = await uploadOnCloudinary(imageBlob);
        if (imageUrl) updateFields.image = imageUrl;
        else {
          console.error('Cloudinary returned null for file upload');
          return NextResponse.json({ message: 'failed to upload image' }, { status: 500 });
        }
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return NextResponse.json({ message: `image upload error ${err}` }, { status: 500 });
      }
    }

    console.log('updateFields for id', id, updateFields);

    // Ensure the grocery exists first so we can return a clearer message
    const existing = await Grocery.findById(id);
    if (!existing) {
      console.warn('Grocery not found during PATCH for id:', id);
      return NextResponse.json({ message: 'grocery not found', id }, { status: 404 });
    }

    // Apply updates
    Object.assign(existing, updateFields);
    const saved = await existing.save();

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/grocery/[id] error:", error);
    return NextResponse.json({ message: `update grocery error ${error}` }, { status: 500 });
  }
}

// Simple GET debug endpoint to echo path param and headers for troubleshooting
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Don't require auth for this debug helper (dev only)
    const { id } = params;
    console.log('DEBUG GET /api/admin/grocery/[id] - id param:', id);
    return NextResponse.json(
      {
        debug: true,
        marker: 'GET_DEBUG_V1',
        idReceived: id,
        headers: {
          'content-type': req.headers.get('content-type'),
          cookie: !!req.headers.get('cookie'),
        },
        url: req.url,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET debug error:', err);
    return NextResponse.json({ message: 'debug get error' }, { status: 500 });
  }
}
