// import { motion } from "framer-motion";
// import { Link, useNavigate } from "react-router-dom";
// import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, Zap } from "lucide-react";

// import { useCart } from "@/contexts/CartContext";

// const Cart = () => {
//   const navigate = useNavigate();
//   const { items, updateQuantity, removeFromCart, total, clearCart, loading: cartLoading, error: cartError, refreshCart, mutating } = useCart();

//   const subtotal = total;
//   const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
//   const grandTotal = subtotal + shipping;

//   if (items.length === 0) {
//     return (
//       <>
//         <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
//           <div className="container mx-auto px-4 py-16">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="max-w-md mx-auto text-center py-12"
//             >
//               <div className="w-32 h-32 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
//                 <ShoppingCart className="w-16 h-16 text-muted-foreground opacity-20" />
//               </div>
//               <h1 className="text-3xl font-heading font-bold mb-4">Your Cart is Empty</h1>
//               <p className="text-muted-foreground mb-8">
//                 Looks like you haven't added anything to your cart yet.
//               </p>
//               <Link
//                 to="/products"
//                 className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
//               >
//                 <Zap className="w-5 h-5" />
//                 Start Shopping
//               </Link>
//             </motion.div>
//           </div>
//         </div>
   
//       </>
//     );
//   }

//   return (
//     <>
//       <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
//         <div className="container mx-auto px-4 py-8">
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-8"
//           >
//             <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Shopping Cart</h1>
//             <p className="text-muted-foreground">{items.length} item(s) in your cart</p>
//           </motion.div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Cart Items */}
//             <div className="lg:col-span-2 space-y-4">
//               {items.map((item, index) => (
//                 <motion.div
//                   key={item.id}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="bg-card border border-border rounded-xl p-6"
//                 >
//                   <div className="flex gap-4">
//                     {/* Product Image */}
//                     <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
//                       {item.product_image ? (
//                         <img
//                           src={item.product_image}
//                           alt={item.product_name}
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <Zap className="w-8 h-8 text-muted-foreground opacity-20" />
//                         </div>
//                       )}
//                     </div>

//                     {/* Product Details */}
//                     <div className="flex-1">
//                       <Link
//                         to={`/products/${item.product_slug}`}
//                         className="font-heading font-semibold text-lg hover:text-primary transition"
//                       >
//                         {item.product_name}
//                       </Link>
//                       <p className="text-sm text-muted-foreground mt-1">
//                         Price: ₹{item.price.toFixed(2)}
//                       </p>

//                       {/* Quantity Controls */}
//                       <div className="flex items-center gap-3 mt-3">
//                         <button
//                           onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
//                           className="p-1.5 rounded-lg border border-border hover:bg-muted transition"
//                         >
//                           <Minus className="w-4 h-4" />
//                         </button>
//                         <span className="w-12 text-center font-semibold">{item.quantity}</span>
//                         <button
//                           onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                           className="p-1.5 rounded-lg border border-border hover:bg-muted transition"
//                         >
//                           <Plus className="w-4 h-4" />
//                         </button>
//                       </div>

//                       {/* Installation Service */}
//                       {item.installation_charge > 0 && (
//                         <div className="mt-3 flex items-center gap-2 text-sm">
//                           <input
//                             type="checkbox"
//                             id={`installation-${item.id}`}
//                             checked={item.installation_service}
//                             onChange={() => {}}
//                             className="rounded border-border"
//                             readOnly
//                           />
//                           <label htmlFor={`installation-${item.id}`} className="text-muted-foreground">
//                             Installation service included (+₹{item.installation_charge.toFixed(2)})
//                           </label>
//                         </div>
//                       )}
//                     </div>

//                     {/* Price and Actions */}
//                     <div className="text-right">
//                       <p className="text-xl font-bold text-primary mb-2">
//                         ₹{(item.price * item.quantity + item.installation_charge * item.quantity).toFixed(2)}
//                       </p>
//                       <button
//                         onClick={() => removeFromCart(item.id)}
//                         className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium transition"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Remove
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}

//               {/* Clear Cart Button */}
//               <button
//                 onClick={clearCart}
//                 className="text-red-600 hover:text-red-700 text-sm font-medium transition flex items-center gap-2"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Clear Cart
//               </button>
//             </div>

//             {/* Order Summary */}
//             <div className="lg:col-span-1">
//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2 }}
//                 className="bg-card border border-border rounded-xl p-6 sticky top-24"
//               >
//                 <h2 className="text-xl font-heading font-bold mb-6">Order Summary</h2>

//                 <div className="space-y-3 mb-6">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Subtotal</span>
//                     <span className="font-medium">₹{subtotal.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Shipping</span>
//                     <span className="font-medium">
//                       {shipping === 0 ? (
//                         <span className="text-green-600 font-semibold">FREE</span>
//                       ) : (
//                         `₹${shipping.toFixed(2)}`
//                       )}
//                     </span>
//                   </div>
//                   {shipping > 0 && (
//                     <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
//                       Add ₹{(500 - subtotal).toFixed(2)} more for FREE shipping
//                     </p>
//                   )}
//                   <div className="border-t border-border pt-3">
//                     <div className="flex justify-between text-lg font-bold">
//                       <span>Total</span>
//                       <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => navigate("/checkout")}
//                   className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
//                 >
//                   Proceed to Checkout
//                   <ArrowRight className="w-5 h-5" />
//                 </button>

//                 <div className="mt-6 space-y-3">
//                   <div className="flex items-center gap-3 text-sm text-muted-foreground">
//                     <Package className="w-4 h-4" />
//                     <span>Secure Checkout</span>
//                   </div>
//                   <div className="flex items-center gap-3 text-sm text-muted-foreground">
//                     <Zap className="w-4 h-4" />
//                     <span>Free shipping on orders above ₹500</span>
//                   </div>
//                 </div>
//               </motion.div>
//             </div>
//           </div>
//         </div>

     
//       </div>
//     </>
//   );
// };

// export default Cart;

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowRight,
  Zap,
  Tag,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import ApiState from "@/components/ApiState";
import MutationButton from "@/components/MutationButton";

/* ─── free shipping progress ─────────────────────────────────── */
const FREE_SHIPPING_THRESHOLD = 500;

const ShippingProgress = ({ subtotal }: { subtotal: number }) => {
  const pct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-4 h-4 text-primary" />
        {remaining > 0 ? (
          <span>
            Add <span className="font-semibold text-primary">₹{remaining.toFixed(2)}</span> more for{" "}
            <span className="font-semibold text-green-600">FREE delivery</span>
          </span>
        ) : (
          <span className="font-semibold text-green-600">🎉 You've unlocked free delivery!</span>
        )}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
        />
      </div>
    </div>
  );
};

/* ─── main ───────────────────────────────────────────────────── */
const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, total, clearCart, loading: cartLoading, error: cartError, refreshCart, mutating } = useCart();

  const subtotal = total;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const grandTotal = subtotal + shipping;

  if (cartLoading) return <div className="min-h-[50vh] flex items-center justify-center px-4"><ApiState loading loadingLabel="Loading your cart…" /></div>;

  /* Try again is rendered by shared ApiState through onRetry. */
  if (cartError && items.length === 0) return <div className="min-h-[50vh] flex items-center justify-center px-4"><div className="w-full max-w-md"><ApiState error={new Error(cartError)} errorTitle="Could not load your cart" onRetry={refreshCart} /></div></div>;

  /* empty */
  if (items.length === 0) {
    return (
      <div className="cart-page bg-gray-50 dark:bg-gray-900 min-h-screen">
        <style>{`

          .cart-page {
            font-family: 'Poppins', sans-serif;
          }
        `}</style>
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto text-center"
          >
            <div className="w-28 h-28 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <ShoppingCart className="w-14 h-14 text-muted-foreground opacity-20" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Looks like you haven't added anything yet. Explore our collection and find what you need.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Zap className="w-4 h-4" />
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <style>{`

        .cart-page {
          font-family: 'Poppins', sans-serif;
        }

        .cart-page h1,
        .cart-page h2,
        .cart-page h3,
        .cart-page h4,
        .cart-page h5,
        .cart-page h6 {
          font-weight: 700;
        }
      `}</style>
      <div className="px-4 py-8">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-1">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── items ── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const lineTotal = item.price * item.quantity + item.installation_charge * item.quantity;
                const isLowStock =
                  item.inventory_quantity != null &&
                  item.inventory_quantity > 0 &&
                  item.inventory_quantity <= 3;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-card border border-border rounded-xl p-5 overflow-hidden"
                  >
                    <div className="flex gap-4">
                      {/* image */}
                      <Link
                        to={`/products/${item.product_slug}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden"
                        aria-label={`View ${item.product_name}`}
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Zap className="w-8 h-8 text-muted-foreground opacity-20" />
                          </div>
                        )}
                      </Link>

                      {/* details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_slug}`}
                          className="font-heading font-semibold text-base hover:text-primary transition line-clamp-2 leading-snug"
                        >
                          {item.product_name}
                        </Link>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          Unit price: ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>

                        {isLowStock && (
                          <div className="flex items-center gap-1 text-orange-500 text-xs mt-1 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Only {item.inventory_quantity} left
                          </div>
                        )}

                        {/* qty controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted transition flex items-center justify-center"
                            aria-label="Decrease quantity"
                            disabled={mutating}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className="w-10 text-center font-semibold text-sm"
                            aria-live="polite"
                            aria-label={`Quantity: ${item.quantity}`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted transition flex items-center justify-center"
                            aria-label="Increase quantity"
                            disabled={mutating}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* installation */}
                        {item.installation_charge > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            +₹{(item.installation_charge * item.quantity).toFixed(2)} installation
                          </p>
                        )}
                      </div>

                      {/* price + remove */}
                      <div className="text-right flex flex-col justify-between">
                        <p className="text-lg font-bold text-primary">
                          ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-medium transition mt-auto"
                          aria-label={`Remove ${item.product_name} from cart`}
                          disabled={mutating}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* clear */}
            <button
              onClick={clearCart}
              disabled={mutating}
              className="text-muted-foreground hover:text-red-500 text-sm font-medium transition flex items-center gap-1.5"
              aria-label="Clear all items from cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear cart
            </button>
          </div>

          {/* ── order summary ── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6 sticky top-24 space-y-5"
            >
              <h2 className="text-xl font-heading font-bold">Order Summary</h2>

              <ShippingProgress subtotal={subtotal} />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span className="font-medium">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {items.some((i) => i.installation_charge > 0) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installation</span>
                    <span className="font-medium">
                      ₹{items.reduce((s, i) => s + i.installation_charge * i.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `₹${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-base font-bold">
                  <span>Estimated Total</span>
                  <span className="text-primary">
                    ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <MutationButton
                onClick={() => navigate("/checkout")}
                pending={mutating}
                pendingLabel="Updating cart…"
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </MutationButton>

              <Link
                to="/products"
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition"
              >
                ← Continue Shopping
              </Link>

              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5 flex-shrink-0" />
                  Secure checkout — SSL encrypted
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                  Free shipping on orders above ₹500
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;