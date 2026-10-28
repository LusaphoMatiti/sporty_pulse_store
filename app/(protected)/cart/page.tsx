import CartItemsList from "@/components/cart/CartItemsList";
import CartTotals from "@/components/cart/CartTotals";
import EmptyState from "@/components/global/EmptyState";
import SectionTitle from "@/components/global/SectionTitle";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import { fetchCartForDisplay } from "@/utils/action";
import getAuthUser from "@/utils/action";
import { redirect } from "next/navigation";

async function CartPage() {
  const user = await getAuthUser();
  if (!user.id) redirect("/");
  const cart = await fetchCartForDisplay();
  if (!cart || cart.numItemsInCart === 0) {
    return (
      <EmptyState
        title="Empty Cart"
        description="Go to our shop and add an equipment"
      />
    );
  }

  return (
    <>
      <MarketingLayout>
        <SectionTitle text="Shopping Cart" />
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CartItemsList cartItems={cart.cartItems} />
          </div>
          <div className="lg:col-span-4">
            <CartTotals cart={cart} />
          </div>
        </div>
      </MarketingLayout>
    </>
  );
}

export default CartPage;
