import { redirect } from 'next/navigation';
import styles from '../../styles/styles';

const DropDown = ({ categoriesData, setDropDown }) => {
  const submitHandle = (i) => {
    redirect(`/products?category=${i.title}`);
  };
  return (
    <div className="pb-4 w-[270px] bg-[#fff] absolute z-30 rounded-b-md shadow-sm">
      {categoriesData &&
        categoriesData.map((i, index) => (
          <div
            key={index}
            className={`${styles.noramlFlex}`}
            onClick={() => submitHandle(i)}
          >
            <img
              src={i.image_Url}
              style={{
                width: '25px',
                height: '25px',
                objectFit: 'contain',
                marginLeft: '10px',
                userSelect: 'none',
              }}
              alt=""
            />
            <h3 className="m-3 cursor-pointer select-none">{i.title}</h3>
          </div>
        ))}
    </div>
  );
};

export default DropDown;
