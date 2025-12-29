const API_URL = 'http://localhost:3001/hot-spots';

const spots = [
  {
    name: 'Cầu Vàng - Bà Nà Hills',
    description: 'Cây cầu biểu tượng với đôi bàn tay khổng lồ nâng đỡ.',
    category: 'Cảnh đẹp',
    rating: 4.8,
    address: 'Hòa Vang, Đà Nẵng',
    lat: 15.9989,
    lng: 107.9961,
    images: [
      'https://vietnam.travel/sites/default/files/styles/top_banner/public/2021-07/Golden%20Bridge%20Da%20Nang.jpg',
    ],
    openingHours: '08:00 - 22:00',
    priceInfo: '850.000đ - 1.050.000đ',
    isHot: true,
  },
  {
    name: 'Cầu Rồng',
    description: 'Cầu có hình dáng rồng phun lửa và nước vào cuối tuần.',
    category: 'Cảnh đẹp',
    rating: 4.7,
    address: 'Phước Ninh, Hải Châu, Đà Nẵng',
    lat: 16.0612,
    lng: 108.2269,
    images: ['https://statics.vinpearl.com/cau-rong-da-nang-1_1629272365.jpg'],
    openingHours: 'Mở cửa cả ngày',
    priceInfo: 'Miễn phí',
    isHot: true,
  },
  {
    name: 'Bán đảo Sơn Trà',
    description: 'Lá phổi xanh của thành phố Đà Nẵng.',
    category: 'Cảnh đẹp',
    rating: 4.9,
    address: 'Sơn Trà, Đà Nẵng',
    lat: 16.1214,
    lng: 108.2777,
    images: ['https://statics.vinpearl.com/ban-dao-son-tra-7_1629273456.jpg'],
    openingHours: 'Mở cửa cả ngày',
    priceInfo: 'Miễn phí',
    isHot: true,
  },
  {
    name: 'Ngũ Hành Sơn',
    description: 'Quần thể 5 ngọn núi đá vôi với hệ thống hang động kỳ ảo.',
    category: 'Cảnh đẹp',
    rating: 4.8,
    address: 'Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    lat: 16.0039,
    lng: 108.2631,
    images: [
      'https://statics.vinpearl.com/ngu-hanh-son-da-nang-8_1629274234.jpg',
    ],
    openingHours: '07:00 - 17:30',
    priceInfo: '40.000đ',
    isHot: true,
  },
  {
    name: 'Chợ Đêm Sơn Trà',
    description: 'Địa điểm vui chơi, mua sắm và ăn uống nhộn nhịp về đêm.',
    category: 'Ăn uống',
    rating: 4.5,
    address: 'Mai Hắc Đế, An Hải Trung, Sơn Trà, Đà Nẵng',
    lat: 16.0608,
    lng: 108.2285,
    images: ['https://statics.vinpearl.com/cho-dem-son-tra-1_1629275012.jpg'],
    openingHours: '18:00 - 24:00',
    priceInfo: 'Miễn phí vào cổng',
    isHot: true,
  },
];

async function seed() {
  for (const spot of spots) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spot),
      });
      if (response.ok) {
        console.log(`Seeded: ${spot.name}`);
      } else {
        const error = await response.text();
        console.error(`Failed to seed ${spot.name}:`, error);
      }
    } catch (error) {
      console.error(`Failed to seed ${spot.name}:`, error.message);
    }
  }
}

seed();
