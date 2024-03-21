'use client';
import Header from './components/Layout/Header';
import Hero from './components/Route/Hero/Hero';
import Categories from './components/Route/Categories/Categories';
import Heading from './utils/Heading';

export default function Home() {
  return (
    <div>
      <Heading
        title="Better Deal"
        description="Multi-vendor E-commerce Platform"
        keywords="shop, buy, sell, online shopping"
      />
      <Header activeHeading={1} />
      <Hero />
      <Categories />
    </div>
  );
}
