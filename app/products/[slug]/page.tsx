"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { use } from "react";
import Navbar from "@/components/Navbar";
import ProductHero from "@/components/hero/ProductsHero";
import Footer from "@/components/landing/Footer";
import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import RecommendProductList from "@/components/products/recommend";
import { addToCart, getCart, updateCartQuantity } from "@/lib/cart";
import { useRouter } from "next/navigation";

interface Product {
  name: string;
  image_url: string;
  price: number;
  original_price?: number;
  description?: string;
  full_description?: string;
  category?: string;
  features?: string[];
}

interface ProductDetailProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductDetail({ params }: ProductDetailProps) {
  const { slug } = use(params);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(slug);
        if (!data) notFound();

        const cartItem = getCart().find((p) => p.id === slug);
        if (cartItem) {
          setQuantity(cartItem.quantity);
          setInCart(true);
        } else {
          setInCart(false);
        }

        setProduct(data);
      } catch (error) {
        console.error("Error loading product:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <section className="bg-green-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <section className="">
      <Navbar />
      <ProductHero
        title="Shop"
        highlight={product.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "products",
            href: "/products",
          },
          {
            label: `${product.name}`,
            href: "/#",
          },
        ]}
      />

      <div className="lg:mx-20 mx-2 p-4 my-6 lg:p-5 lg:my-10 bg-white">
        {/* PRODUCT GRID */}
        <div className="grid md:grid-cols-2 mb-20 gap-10">
          {/* IMAGE */}
          <div className="relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="border w-full h-[40vh] object-cover transition-transform hover:scale-105"
            />
          </div>

          {/* PRODUCT DETAILS */}
          <div className="lg:py-10">
            <h1 className="text-3xl font-semibold mb-3">{product.name}</h1>
            {/* PRICE */}
            <div className="flex items-center border-b pb-5 gap-2 my-4">
              <del className="text-gray-400 text-lg">
                Ksh {product.original_price || 3400}.00
              </del>
              <ins className="text-gray-800 text-2xl font-bold no-underline">
                Ksh {product.price || 2994}.00
              </ins>
            </div>
            {/* SHORT DESCRIPTION */}
            <div className="text-gray-700 space-y-3 my-6 border-b pb-5">
              <p>
                {product.description || "Product description not available"}
              </p>
            </div>
            {/* CART FORM */}
            {/* CART FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!product) return;

                addToCart({
                  id: slug,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  quantity,
                });

                setAdded(true);
                // setTimeout(() => setAdded(false), 2000);
              }}
              className="flex items-center my-5 gap-3"
            >
              <div className="flex items-center border">
                <button
                  type="button"
                  onClick={() => {
                    const newQty = Math.max(1, quantity - 1);
                    setQuantity(newQty);
                    if (product) {
                      // live sync with cart
                      const existing = getCart().find((p) => p.id === slug);
                      if (existing) updateCartQuantity(slug, newQty);
                    }
                  }}
                  className="px-3 py-2 text-xl hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="w-12 text-center border-x outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newQty = quantity + 1;
                    setQuantity(newQty);
                    if (product) {
                      const existing = getCart().find((p) => p.id === slug);
                      if (existing) updateCartQuantity(slug, newQty);
                    }
                  }}
                  className="px-3 py-2 text-xl hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              {inCart ? (
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 shadow transition"
                >
                  Buy Now
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 shadow transition"
                >
                  {added ? "Added ✓" : "Add to Cart"}
                </button>
              )}

              {added && (
                <button
                type="button"
                onClick={() => router.push("/cart")}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 shadow transition"
              >
                Buy Now
              </button>
              )}
            </form>

            {/* CATEGORY */}
            <p className="text- text-gray-500 mt-10">
              Category:{" "}
              <a href="#" className="text-green-600 hover:underline">
                {product.category || "New Product"}
              </a>
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-10">
          <ul className="flex border-b">
            {["description", "reviews"].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-lg font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-green-600"
                  }`}
                >
                  {tab === "description" ? "Description" : "Reviews (0)"}
                </button>
              </li>
            ))}
          </ul>

          {/* TAB CONTENT */}
          <div className="mt-6">
            {activeTab === "description" ? (
              <div className="text-gray-700 space-y-3">
                <h2 className="text-lg font-semibold">Description</h2>
                <p>{product.full_description || product.description}</p>
                {product.features && (
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold mb-2">Reviews</h2>
                <p className="text-gray-500">There are no reviews yet.</p>
              </div>
            )}
          </div>

          <RecommendProductList />
        </div>
      </div>

      <Footer />
    </section>
  );
}
