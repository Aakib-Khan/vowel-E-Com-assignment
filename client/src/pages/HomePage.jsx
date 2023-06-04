import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";

import { cartState} from "../context/cart";
import axios from "axios";
import {  useRecoilState, useSetRecoilState } from "recoil";
import toast from "react-hot-toast";
import Layout from "../components/Layout/Layout";
import { AiOutlineReload } from "react-icons/ai";

import "../styles/Homepage.css";

const HomePage = () => {
  const navigate = useNavigate();
  // const setCart = useSetRecoilState(cartState);
  // const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [products, setProducts] = useState([]);
  // console.log({products});
  const [cart, setCart] = useRecoilState(cartState);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [disabledProducts, setDisabledProducts] = useState({});

  useEffect(() => {
    getTotal();
  }, []);
  //get products
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:7000/api/v1/product/product-list/${page}`
      );
      setLoading(false);
      console.log("data.products from home page",data.products);
      setProducts(data.products);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  //getTOtal COunt
  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:7000/api/v1/product/product-count"
      );
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);
  //load more
  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:7000/api/v1/product/product-list/${page}`
      );
      setLoading(false);
      setProducts([...products, ...data?.products]);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checked.length || !radio.length) getAllProducts();
  }, [checked.length, radio.length]);


  const addToCart = (product) => {
    // Check if the product already exists in the cart
    const existingProduct = cart.find((item) => item._id === product._id);
  
    if (existingProduct) {
      // If the product already exists, update the quantityByBuyer property
      const updatedCart = cart.map((item) => {
        if (item._id === product._id) {
          return {
            ...item,
            quantityByBuyer: item.quantityByBuyer + 1,
          };
        }
        return item;
      });
  
      setCart(updatedCart);
    } else {
      // If the product doesn't exist, add it to the cart with quantityByBuyer set to 1
      setCart((prevCart) => [...prevCart, { ...product, quantityByBuyer: 1 }]);
    }
  
    setDisabledProducts((prevDisabledProducts) => ({
      ...prevDisabledProducts,
      [product._id]: true,
    }));
  
    toast.success("Item Added to cart");
  };
  

  return (
    <Layout title={"ALl Products - Best offers "}>
      {/* banner image */}
      <img
        src="/images/banner.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
      />
      {/* banner image */}
      <div className="container-fluid row mt-3 home-page">
        <div className="col-md-1 filters"></div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap">
            {products?.map((p) => (
              <div className="card m-2" key={p._id}>
                <img
                  src={`http://localhost:7000/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                  // style={{ width: "100%", height: "100%" }}
                />
                <div className="card-body">
                  <div className="card-name-price">
                    <h5 className="card-title">{p.name}</h5>
                    <h5 className="card-title card-price">
                      {p.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </h5>
                  </div>
                  <p className="card-text ">
                    {/* {p.description}... */}
                    {p.description.substring(0, 60)}...
                  </p>
                  <div className="card-name-price">
                    <button
                      className="btn btn-info ms-1"
                      onClick={() => navigate(`/product/${p.slug}`)}
                    >
                      More Details
                    </button>

                    <button
                      className="btn btn-dark ms-1"
                      // disabled={isButtonClicked}
                      onClick={() => addToCart(p)}
                    >
                      {/* ADD TO CART */}
                      {/* {isButtonClicked ? "Added to Cart" : "ADD TO CART"} */}
                      {disabledProducts[p._id] ? "Added to Cart" : "ADD TO CART"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="m-2 p-3">
            {products && products.length < total && (
              <button
                className="btn loadmore"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <>
                    {" "}
                    Loadmore <AiOutlineReload />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
