import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { cartState } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";
import { selector, useRecoilState, useRecoilValue } from "recoil";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useRecoilState(cartState);
  console.log({ cart });

  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const totalPriceSelector = selector({
    key: "SelecterTotalPrice",
    get: ({ get }) => {
      const cart = get(cartState);
      let total = 0;
      cart?.map((item) => {
        total = total + item.price * item.quantityByBuyer;
      });
      return total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    },
  });
  
  const totalPrice = useRecoilValue(totalPriceSelector);

 
  const removeCartItem = (pid) => {
    try {
      const updatedCart = cart
        .map((item) => {
          if (item._id === pid && item.quantityByBuyer > 0) {
            return {
              ...item,
              quantityByBuyer: item.quantityByBuyer - 1,
            };
          }
          return item;
        })
        .filter((item) => item.quantityByBuyer > 0);
  
      setCart(updatedCart);
  
    
      toast.success("Item Removed from Cart");
    } catch (error) {
      console.log(error);
    }
  };
  

 
  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:7000/api/v1/product/braintree/token"
      );
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getToken();
}, [auth?.token]);

  //handle payments
  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        "http://localhost:7000/api/v1/product/braintree/payment",
        {
          nonce,
          cart,
          // amount:totalPrice
        }
      );
      setLoading(false);
      // localStorage.removeItem("cart");
      setCart([]);
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed Successfully ");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const totalQuantityByBuyer = cart.reduce((total, item) => {
    return total + (item.quantityByBuyer || 0);
  }, 0);

  const addToCart = (product) => {
    // setCart((prevCart) => [...prevCart0, product]);
    // toast.success("Item Added to cart");
    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
      // If the item already exists in the cart, update the quantity
      const updatedCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantityByBuyer: item.quantityByBuyer + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      // If the item doesn't exist in the cart, add it as a new item
      setCart((prevCart) => [...prevCart, { ...product, quantityByBuyer: 1 }]);
    }

    toast.success("Item Added to cart");
  };

  return (
    <Layout>
      <div className=" cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello  ${auth?.token && auth?.user?.name}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${totalQuantityByBuyer} items in your cart ${
                      auth?.token ? "" : "please login to checkout !"
                    }`
                  : " Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container ">
          <div className="row ">
            <div className="col-md-7  p-0 m-0">
              {cart?.map((p) => (
                <div className="row card flex-row" key={p._id}>
                  <div className="col-md-4">
                    <img
                      src={`http://localhost:7000/api/v1/product/product-photo/${p._id}`}
                      className="card-img-top"
                      alt={p.name}
                      width="100%"
                      height={"130px"}
                    />
                  </div>
                  <div className="col-md-4">
                    <p>{p.name}</p>
                    {p.quantityByBuyer > 0 && <span  > Total Qty &nbsp; : &nbsp;{p.quantityByBuyer} </span>}
                    {/* <p>{p.description}</p> */}
                    <p>{p.description.substring(0, 30)}</p>
                    <p>Price : {p.price}</p>
                  </div>

                  <div className="col-md-4 cart-remove-btn ">
                    <button
                      style={{ marginRight: "10px" }}
                      className="btn btn-danger"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ backgroundColor: "blue" }}
                      onClick={() => addToCart(p)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-md-5 cart-summary ">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total : {totalPrice} </h4>
              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() =>
                        navigate("/login", {
                          state: "/cart",
                        })
                      }
                    >
                      Plase Login to checkout
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken || !auth?.token || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
