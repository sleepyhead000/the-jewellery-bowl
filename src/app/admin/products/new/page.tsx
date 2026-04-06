import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Add Product</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new product listing</p>
      </div>
      <ProductForm />
    </div>
  );
}
