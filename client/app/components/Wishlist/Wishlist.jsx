import React, { useState } from 'react';
import { RxCross1 } from 'react-icons/rx';
import { IoBagHandleOutline } from 'react-icons/io5';
import { BsCartPlus } from "react-icons/bs";
import styles from '../../styles/styles';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { AiOutlineHeart } from 'react-icons/ai';

const Wishlist = ({ setOpenWishlist }) => {
  const cartData = [
    {
      name: 'IPhone 14 pro max 256gb and 8gb ram silver',
      description: 'test',
      price: '9999',
    },
    {
      name: 'IPhone 14 pro max 256gb and 8gb ram silver',
      description: 'test',
      price: '3429',
    },
    {
      name: 'IPhone 14 pro max 256gb and 8gb ram silver',
      description: 'test',
      price: '4329',
    },
  ];
  // const { cart } = useSelector((state) => state.cart);
  // const dispatch = useDispatch();

  // const removeFromCartHandler = (data) => {
  //   dispatch(removeFromCart(data));
  // };

  // const totalPrice = cart.reduce(
  //   (acc, item) => acc + item.qty * item.discountPrice,
  //   0
  // );

  // const quantityChangeHandler = (data) => {
  //   dispatch(addTocart(data));
  // };

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-10">
      <div className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col overflow-y-scroll justify-between shadow-sm">
        {cartData && cartData.length === 0 ? (
          <div className="w-full h-screen flex items-center justify-center">
            <div className="flex w-full justify-end pt-5 pr-5 fixed top-3 right-3">
              <RxCross1
                size={25}
                className="cursor-pointer"
                onClick={() => setOpenWishlist(false)}
              />
            </div>
            <h5>Whishlist is empty!</h5>
          </div>
        ) : (
          <>
            <div>
              <div className="flex w-full justify-end pt-5 pr-5">
                <RxCross1
                  size={25}
                  className="cursor-pointer"
                  onClick={() => setOpenWishlist(false)}
                />
              </div>
              {/* Item length */}
              <div className={`${styles.noramlFlex} p-4`}>
                <AiOutlineHeart size={25} />
                <h5 className="pl-2 text-[20px] font-[500]">
                  {cartData && cartData.length} items
                </h5>
              </div>

              {/* cart Single Items */}
              <br />
              <div className="w-full border-t">
                {cartData &&
                  cartData.map((i, index) => (
                    <CartSingle key={index} data={i} />
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({ data }) => {
  const [value, setValue] = useState(1);
  const totalPrice = data.price * value;

  // const increment = (data) => {
  //   if (data.stock < value) {
  //     toast.error('Product stock limited!');
  //   } else {
  //     setValue(value + 1);
  //     const updateCartData = { ...data, qty: value + 1 };
  //     quantityChangeHandler(updateCartData);
  //   }
  // };

  // const decrement = (data) => {
  //   setValue(value === 1 ? 1 : value - 1);
  //   const updateCartData = { ...data, qty: value === 1 ? 1 : value - 1 };
  //   quantityChangeHandler(updateCartData);
  // };

  return (
    <div className="border-b p-4">
      <div className="w-full flex items-center">
        <RxCross1 className="cursor-pointer" />
        <img
          src="https://bonik-react.vercel.app/assets/images/products/Fashion/Clothes/1.SilverHighNeckSweater.png"
          alt=""
          className="w-[80px] h-[80] ml-2"
        />
        <div className="pl-[5px]">
          <h1>{data.name}</h1>
          <h4 className="font-[600] text-[17px] pt-[3px] text-[#d02222] font-Roboto">
            US${totalPrice}
          </h4>
        </div>
        <div>
          <BsCartPlus
            size={20}
            className="cursor-pointer"
            tile="Add to cart"
            onClick={() => addToCartHandler(data)}
          />
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
