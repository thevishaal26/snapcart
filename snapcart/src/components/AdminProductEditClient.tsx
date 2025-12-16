"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Save, Upload, X } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  image?: string | null;
}

const categories = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Rice, Atta & Grains",
  "Snacks & Biscuits",
  "Spices & Masalas",
  "Beverages & Drinks",
  "Personal Care",
  "Household Essentials",
  "Instant & Packaged Food",
  "Baby & Pet Care",
];

const units = ["kg", "g", "liter", "ml", "piece", "pack"];

export default function AdminProductEditClient({ initialProduct }: { initialProduct: Product }) {
  const router = useRouter();
  const params = useParams();
  const idFromParams = params?.id as string | undefined;

  // Use the server-provided initial product as the initial state
  const [name, setName] = useState(initialProduct.name || "");
  const [category, setCategory] = useState(initialProduct.category || "");
  const [price, setPrice] = useState<number>(initialProduct.price || 0);
  const [unit, setUnit] = useState(initialProduct.unit || "");
  const [imagePreview, setImagePreview] = useState<string | null>(initialProduct.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    // Log to verify the route id is present
    console.log("Editing product ID (params):", idFromParams, "initialProduct._id:", initialProduct._id);
  }, [idFromParams, initialProduct._id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleSave = async () => {
    const id = String(idFromParams || initialProduct._id || "");
    const isValidId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidId) {
      alert(`❌ Invalid product id: ${id}`);
      console.error('Attempting to PATCH with invalid id:', id);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", String(price));
    formData.append("unit", unit);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`/api/admin/grocery/${id}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Product updated successfully");
        router.push("/admin/products");
        return;
      }

      const raw = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        parsed = raw;
      }
      console.error("PATCH error:", res.status, { raw, parsed, headers: Array.from(res.headers.entries()) });
      const message = parsed?.message || parsed || `status ${res.status}`;
      alert(`❌ Failed to update product: ${message}`);
    } catch (err) {
      console.error('Network or unexpected error during PATCH:', err);
      alert(`❌ Unexpected error: ${err}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-700">Edit Product</h1>
        <button onClick={() => router.push('/admin/products')} className="text-gray-600 hover:text-gray-800">Back</button>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-4 border border-gray-200 group">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No image selected</div>
              )}
              <label htmlFor="imageUpload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <Upload className="text-white w-7 h-7" />
              </label>
              <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Product name" />

            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
              <option value="">Select Category</option>
              {categories.map(cat=> <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <div className="flex gap-4">
              <input type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} className="w-1/2 border border-gray-300 rounded-lg p-2.5" placeholder="Price" />
              <select value={unit} onChange={(e)=>setUnit(e.target.value)} className="w-1/2 border border-gray-300 rounded-lg p-2.5 bg-white">
                <option value="">Select Unit</option>
                {units.map(u=> <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={()=>router.push('/admin/products')} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2"><Save size={16}/> Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
