'use client';
import { useState, useEffect } from 'react';
import ProductDetails from '../../../components/ProductDetails/ProductDetails';
import { useParams } from 'next/navigation';
import { productData } from '../../../static/data';
import Header from '../../../components/Layout/Header';
import Footer from '../../../components/Layout/Footer';

const ProductDetailsPage = () => {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const productName = name.replace(/-/g, ' ');


  useEffect(() => {
    const data = productData.find((i) => i.name === productName);
    setData(data);
  }, []);

  return (
    <div>
      <Header />
      <ProductDetails data={data}/>
      {/* ProductDetails */}
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
