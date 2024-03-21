import Link from 'next/link';
import { navItems } from '../../static/data';
import styles from '../../styles/styles';

const Navbar = ({ active }) => {
  return (
    <div className={`block 800px:${styles.noramlFlex}`}>
      {navItems &&
        navItems.map((i, index) => (
          <div className="flex" key={i.title}>
            <Link
              href={i.url}
              className={`${
                active === index + 1
                  ? 'text-[#17dd1f]'
                  : 'text-black 800px:text-[#fff]'
              } pb-[30px] 800px:pb-0 font-[500] px-6 cursor-pointer}`}
            >
              {i.title}
            </Link>
          </div>
        ))}
    </div>
  );
};

export default Navbar;
