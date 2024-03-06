'use client';
import Header from './components/Header';
import Heading from './utils/Heading';

export default function Home() {
  return (
    <div>
      <Heading
        title="Better Deal"
        description="Multi-vendor E-commerce Platform"
        keywords="shop, buy, sell, online shopping"
      />
      <Header />
    </div>
  );
}
