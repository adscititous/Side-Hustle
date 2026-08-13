"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import type { Category, Condition } from "@/types";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/types";

export default function EditListingPage() {
 const router = useRouter();
const supabase = createClient();
const { user, isLoaded } = useUser();
const params = useParams();
const listingId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category>("physical_resale");
  const [condition, setCondition] = useState<Condition | "">("");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Cash");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchListing() {
      setFetching(true);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (error) {
        toast.error(error.message);
        setFetching(false);
        return;
      }

      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price.toString());
        setCategory(data.category);
        setCondition(data.condition || "");
        setPaymentMethod(data.payment_method);
        setIsAnonymous(data.is_anonymous);
        setImages([]);
      }

      setFetching(false);
    }

    fetchListing();
  }, [listingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!isLoaded) {
  setLoading(false);
  return;
}

if (!user) {
  toast.error("Please sign in first");
  setLoading(false);
  return;
}

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast.error("Profile not found");
      setLoading(false);
      return;
    }

    const imageUrls: string[] = [];

    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file);

      if (uploadError) {
        toast.error("Failed to upload image: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    const { error } = await supabase.from("listings").update({
      seller_id: profile.id,
      title,
      description,
      price: parseFloat(price),
      category,
      condition: condition || null,
      payment_method: paymentMethod,
      images: imageUrls,
      is_anonymous: isAnonymous,
    }).eq("id", listingId);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Listed!");
    router.push("/");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  }

  const showCondition = category === "physical_resale";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        List an Item
      </h1>
      <p className="mb-8 text-sm text-stone-500">
        Post to the entire GIM campus — as easy as sending a WhatsApp message
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Photo{images.length > 0 && ` (${images.length} selected)`}
          </label>
          <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500 transition hover:border-brand-400 hover:text-brand-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hostel Desk Lamp"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, reason for selling, pickup location..."
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Price (₹)
            </label>
            <input
              type="number"
              required
              min={1}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">
              Payment
            </label>
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="UPI / Cash"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              if (e.target.value !== "physical_resale") setCondition("");
            }}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {showCondition && (
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select condition</option>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-700">
              Anonymous listing
            </p>
            <p className="text-xs text-stone-500">
              Show my pseudonym instead of my name
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`relative h-6 w-11 rounded-full transition ${
              isAnonymous ? "bg-brand-600" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                isAnonymous ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Listing"}
        </button>
      </form>
    </div>
  );
}
