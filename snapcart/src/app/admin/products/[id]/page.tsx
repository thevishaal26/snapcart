import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import AdminProductEditClient from "@/components/AdminProductEditClient";

interface Params {
  params: { id: string };
}

export default async function Page({ params }: Params) {
  try {
    await connectDb();
    const grocery = await Grocery.findById(params.id).lean();
    if (!grocery) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-semibold">Product not found</h1>
          <p className="text-gray-600">No product was found with id: {params.id}</p>
        </div>
      );
    }

    // Ensure _id is a string
    const initialProduct = {
      ...grocery,
      _id: String((grocery as any)._id),
    };

    return (
      // Client component handles interaction and PATCH
      <AdminProductEditClient initialProduct={initialProduct} />
    );
  } catch (err) {
    console.error('Error loading product edit page:', err);
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Error</h1>
        <p className="text-gray-600">Failed to load product. See server logs.</p>
      </div>
    );
  }
}
