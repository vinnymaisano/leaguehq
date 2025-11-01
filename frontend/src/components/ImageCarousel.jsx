import Slider from "react-slick"
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import img1 from '../assets/sleeper-roster.png'
import img2 from '../assets/leaguehq-roster.png'

const images = [img1, img2]

export default function ImageCarousel() {
  const settings = {
    arrows: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: false
  };

  return (
    <div style={{width: "100%", height: "350px" }}>
      <Slider {...settings}>
        {images.map((url, index) => (
          <div className="carousel-image-container" key={index}>
            <img className="carousel-image" src={url} alt={`Slide ${index + 1}`}/>
          </div>
        ))}
      </Slider>
    </div>
  );
}
